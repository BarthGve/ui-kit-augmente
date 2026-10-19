import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { ShareImportModal } from "../import-modal/ShareImportModal";
import { ShareModalExample } from "./stories/ShareModalExample";

// Guards the markup of the share modal before its stylesheets move to tokens:
// the exact DOM is compared to a file snapshot, with React Aria / React `useId`
// ids normalised and react-modal's transient `--after-open` classes dropped, so the output does not depend on render order.
const markup = () =>
  document.body.innerHTML
    .replace(/ ReactModal__\w+--after-open/g, "")
    .replace(/«r\w+»/g, "ID")
    .replace(/react-aria\d+-/g, "react-aria-")
    .replace(/></g, ">\n<");

// File snapshots written by hand: the shared setup's second copy of vitest
// leaves `toMatchFileSnapshot` without state. `UPDATE_SNAPSHOTS=1` rewrites them.
const expectSnapshot = (name: string) => {
  const file = resolve(__dirname, "__snapshots__", `${name}.html`);
  if (process.env.UPDATE_SNAPSHOTS || !existsSync(file)) {
    mkdirSync(resolve(file, ".."), { recursive: true });
    writeFileSync(file, markup());
  }
  expect(markup()).toBe(readFileSync(file, "utf8"));
};

const renderModal = async (ui: ReactElement) => {
  render(<CunninghamProvider>{ui}</CunninghamProvider>);
  await waitFor(() => {
    if (!document.querySelector(".c__modal")) throw new Error("not open");
  });
};

const invitations = [
  {
    id: "1",
    surname: "Doe",
    role: "administrator",
    email: "admin@example.com",
    user: { id: "1", full_name: "Ada Admin", email: "admin@example.com" },
  },
  {
    id: "2",
    surname: "Roe",
    role: "reader",
    email: "reader@example.com",
    user: { id: "2", full_name: "Rita Reader", email: "reader@example.com" },
  },
];

describe("ShareModal markup", () => {
  it("default", async () => {
    await renderModal(<ShareModalExample linkSettings />);
    expectSnapshot("default");
  });

  it("with invitations", async () => {
    await renderModal(
      <ShareModalExample linkSettings invitations={invitations} />,
    );
    expectSnapshot("with-invitations");
  });

  it("empty", async () => {
    await renderModal(
      <ShareModalExample linkSettings invitations={[]} members={[]} />,
    );
    expectSnapshot("empty");
  });
});

describe("ShareImportModal markup", () => {
  it("initial state", async () => {
    await renderModal(<ShareImportModal isOpen onClose={() => {}} />);
    expectSnapshot("import-initial");
  });
});
