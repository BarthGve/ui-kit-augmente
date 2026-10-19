import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { ContactImport, ContactImportProps } from "./ContactImport";
import { parseContacts, validateContacts } from "./utils";

const csv = (text: string, name = "contacts.csv") =>
  new File([text], name, { type: "text/csv" });

const setup = (props: Partial<ContactImportProps> = {}) => {
  const onImport = vi.fn();
  const view = render(
    <CunninghamProvider currentLocale="en-US">
      <ContactImport onImport={onImport} {...props} />
    </CunninghamProvider>,
  );
  const choose = async (file: File) => {
    await userEvent.upload(
      view.container.querySelector('input[type="file"]') as HTMLInputElement,
      file,
      { applyAccept: false },
    );
  };
  return { onImport, choose, view };
};

const CONTACTS = `email,name
ada@example.com,Ada
bob@example.com,Bob
not-an-email,Broken
ADA@example.com,Ada again
`;

const rows = () =>
  within(screen.getByRole("table")).getAllByRole("row").slice(1);
const importButton = () => screen.getByRole("button", { name: /^Import/ });

describe("ContactImport", () => {
  it("asks for a file first, with the import disabled", () => {
    setup();
    expect(screen.queryByRole("table")).toBeNull();
    expect(importButton()).toBeDisabled();
  });

  it("shows one row per contact after choosing a file", async () => {
    const { choose } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    expect(rows()).toHaveLength(4);
    expect(screen.getByRole("textbox", { name: "Email of row 1" })).toHaveValue(
      "ada@example.com",
    );
    expect(within(rows()[1]).getByText("Bob")).toBeVisible();
  });

  it("flags invalid and duplicate addresses in text", async () => {
    const { choose } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    expect(within(rows()[0]).getByText("Valid")).toBeVisible();
    expect(within(rows()[2]).getByText("Invalid e-mail address")).toBeVisible();
    expect(within(rows()[3]).getByText("Duplicate")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("2 valid, 2 to fix");
  });

  it("lets an invalid address be fixed", async () => {
    const { choose } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    const field = screen.getByRole("textbox", { name: "Email of row 3" });
    await userEvent.clear(field);
    await userEvent.type(field, "carol@example.com");
    expect(within(rows()[2]).getByText("Valid")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("3 valid, 1 to fix");
  });

  it("lets a row be removed", async () => {
    const { choose } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    await userEvent.click(
      screen.getByRole("button", { name: "Remove not-an-email" }),
    );
    expect(rows()).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("2 valid, 1 to fix");
  });

  it("imports only the valid rows", async () => {
    const { choose, onImport } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    expect(importButton()).toHaveTextContent("Import 2 contacts");
    await userEvent.click(importButton());
    expect(onImport).toHaveBeenCalledExactlyOnceWith([
      { email: "ada@example.com", name: "Ada" },
      { email: "bob@example.com", name: "Bob" },
    ]);
  });

  it("disables the import when no row is valid", async () => {
    const { choose } = setup();
    await choose(csv("email\nnope\n"));
    await screen.findByRole("table");
    expect(importButton()).toBeDisabled();
  });

  it("associates the cells with their column headers", async () => {
    const { choose } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual([
      "E-mail",
      "Name",
      "Status",
      "Actions",
    ]);
    headers.forEach((h) => expect(h).toHaveAttribute("scope", "col"));
    expect(screen.getByRole("table")).toHaveAccessibleName(
      "Contacts to import",
    );
  });

  it("is operable by keyboard", async () => {
    const { choose, onImport } = setup();
    await choose(csv(CONTACTS));
    await screen.findByRole("table");
    screen.getByRole("textbox", { name: "Email of row 1" }).focus();
    await userEvent.tab(); // row 1 remove
    expect(
      screen.getByRole("button", { name: "Remove ada@example.com" }),
    ).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(rows()).toHaveLength(3);
    importButton().focus();
    await userEvent.keyboard("{Enter}");
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("reports a file it cannot read as contacts", async () => {
    const { choose } = setup();
    await choose(csv(""));
    await waitFor(() =>
      expect(screen.getByText("The file has no contact")).toBeVisible(),
    );
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("refuses a file with too many rows", async () => {
    const { choose } = setup({ maxRows: 2 });
    await choose(csv(CONTACTS));
    await waitFor(() =>
      expect(
        screen.getByText("The file has more than 2 contacts"),
      ).toBeVisible(),
    );
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("refuses a file type that is not csv or xlsx", async () => {
    const { choose } = setup();
    await choose(csv("a", "contacts.txt"));
    await waitFor(() =>
      expect(
        screen.getByText("Only .csv and .xlsx files are accepted"),
      ).toBeVisible(),
    );
  });
});

describe("parseContacts", () => {
  it("reads e-mail and optional name, with or without a header", async () => {
    expect(await parseContacts(csv("a@b.co,Ann\nc@d.co\n"))).toEqual({
      rows: [
        { email: "a@b.co", name: "Ann" },
        { email: "c@d.co", name: "" },
      ],
    });
    expect(await parseContacts(csv("E-mail;Nom\nx@y.fr;Xavier\n"))).toEqual({
      rows: [{ email: "x@y.fr", name: "Xavier" }],
    });
  });

  it("skips blank lines", async () => {
    expect(await parseContacts(csv("\na@b.co\n\n"))).toEqual({
      rows: [{ email: "a@b.co", name: "" }],
    });
  });

  it("reports an empty file", async () => {
    expect(await parseContacts(csv("email\n"))).toEqual({ error: "empty" });
  });
});

describe("validateContacts", () => {
  it("marks invalid and duplicate addresses, the first occurrence stays valid", () => {
    const result = validateContacts([
      { id: "1", email: "A@x.io", name: "" },
      { id: "2", email: "a@x.io ", name: "" },
      { id: "3", email: "nope", name: "" },
      { id: "4", email: "", name: "" },
    ]);
    expect(result.map((r) => r.status)).toEqual([
      "valid",
      "duplicate",
      "invalid",
      "invalid",
    ]);
  });
});
