import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { UploadModule, UploadModuleProps } from "./UploadModule";
import { isAccepted } from "./utils";

const file = (name: string, size = 100, type = "text/plain") => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

type Control = {
  progress: (p: number) => void;
  resolve: () => void;
  reject: (e?: Error) => void;
  signal: AbortSignal;
};

// An upload function the test drives by hand.
const manualUpload = () => {
  const controls: Control[] = [];
  const upload = vi.fn(
    (
      _file: File,
      ctx: { onProgress: (p: number) => void; signal: AbortSignal },
    ) =>
      new Promise<void>((resolve, reject) => {
        controls.push({
          progress: ctx.onProgress,
          resolve,
          reject,
          signal: ctx.signal,
        });
      }),
  );
  return { upload, controls };
};

const setup = (props: Partial<UploadModuleProps> = {}) => {
  const manual = manualUpload();
  const view = render(
    <CunninghamProvider currentLocale="en-US">
      <UploadModule multiple upload={manual.upload} {...props} />
    </CunninghamProvider>,
  );
  const input = view.container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const add = (...files: File[]) => userEvent.upload(input, files);
  const items = () => screen.queryAllByTestId("file-uploader-item");
  return { ...manual, add, items, view };
};

const live = () => screen.getByRole("status");

describe("UploadModule", () => {
  it("adds chosen files to a list with name, size and progress", async () => {
    const { add, items, upload, controls } = setup();
    await add(file("a.txt", 2000), file("b.txt", 3000));
    expect(items()).toHaveLength(2);
    expect(upload).toHaveBeenCalledTimes(2);
    expect(within(items()[0]).getByText(/a\.txt/)).toBeVisible();
    expect(within(items()[0]).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    act(() => controls[0].progress(40));
    expect(within(items()[0]).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("shows the success state when the upload resolves", async () => {
    const { add, items, controls } = setup();
    await add(file("a.txt", 2000));
    await act(async () => controls[0].resolve());
    expect(items()[0]).toHaveClass("c__file-uploader__item--done");
    expect(within(items()[0]).queryByRole("progressbar")).toBeNull();
    expect(within(items()[0]).getByText("2 KB")).toBeVisible();
  });

  it("shows the error state and offers a retry that starts the upload again", async () => {
    const { add, items, controls, upload } = setup();
    await add(file("a.txt"));
    await act(async () => controls[0].reject(new Error("boom")));
    expect(items()[0]).toHaveClass("c__file-uploader__item--error");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(upload).toHaveBeenCalledTimes(2);
    expect(items()[0]).toHaveClass("c__file-uploader__item--uploading");
    await act(async () => controls[1].resolve());
    expect(items()[0]).toHaveClass("c__file-uploader__item--done");
  });

  it("rejects a file over the size limit without starting an upload", async () => {
    const { add, items, upload } = setup({ maxSize: 1000 });
    await add(file("big.txt", 5000));
    expect(upload).not.toHaveBeenCalled();
    expect(items()[0]).toHaveClass("c__file-uploader__item--error");
    expect(within(items()[0]).getByText("File exceeds 1 KB")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("rejects a refused type without starting an upload", async () => {
    const { add, items, upload } = setup({ accept: ".pdf,image/*" });
    await userEvent.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      file("notes.txt", 10, "text/plain"),
      { applyAccept: false },
    );
    expect(upload).not.toHaveBeenCalled();
    expect(
      within(items()[0]).getByText("File type not accepted"),
    ).toBeVisible();
    // An accepted file still goes through.
    await userEvent.upload(
      document.querySelector('input[type="file"]') as HTMLInputElement,
      file("scan.png", 10, "image/png"),
      { applyAccept: false },
    );
    expect(upload).toHaveBeenCalledTimes(1);
    void add;
  });

  it("lets a rejected file be dismissed", async () => {
    const { add, items } = setup({ maxSize: 10 });
    await add(file("big.txt", 500));
    await userEvent.click(screen.getByRole("button", { name: /Delete/ }));
    expect(items()).toHaveLength(0);
  });

  it("cancels a file in progress: the upload is aborted and the file leaves the list", async () => {
    const { add, items, controls } = setup();
    await add(file("a.txt"));
    await userEvent.click(
      screen.getByRole("button", { name: "Cancel upload" }),
    );
    expect(controls[0].signal.aborted).toBe(true);
    expect(items()).toHaveLength(0);
    // A late rejection from the aborted upload does not bring the file back.
    await act(async () => controls[0].reject(new Error("aborted")));
    expect(items()).toHaveLength(0);
  });

  it("removes a finished file", async () => {
    const { add, items, controls } = setup();
    await add(file("a.txt"));
    await act(async () => controls[0].resolve());
    await userEvent.click(
      screen.getByRole("button", { name: /Delete a\.txt/ }),
    );
    expect(items()).toHaveLength(0);
  });

  it("announces progress and results to assistive technology", async () => {
    const { add, controls } = setup({ maxSize: 1000 });
    expect(live()).toHaveAttribute("aria-live", "polite");
    await add(file("a.txt"));
    expect(live()).toHaveTextContent("Uploading a.txt");
    await act(async () => controls[0].resolve());
    await waitFor(() => expect(live()).toHaveTextContent("a.txt uploaded"));
    await add(file("big.txt", 5000));
    expect(live()).toHaveTextContent("big.txt rejected: File exceeds 1 KB");
    await add(file("b.txt"));
    await act(async () => controls[1].reject(new Error("x")));
    await waitFor(() =>
      expect(live()).toHaveTextContent("b.txt: upload failed"),
    );
  });

  it("replaces the file in single mode and aborts the previous upload", async () => {
    const { add, items, controls } = setup({ multiple: false });
    await add(file("a.txt"));
    await add(file("b.txt"));
    expect(controls[0].signal.aborted).toBe(true);
    expect(items().length === 0 || items().length === 1).toBe(true);
    expect(screen.getAllByText(/b\.txt/).length).toBeGreaterThan(0);
  });
});

describe("isAccepted", () => {
  it.each([
    ["a.pdf", "application/pdf", ".pdf", true],
    ["A.PDF", "application/pdf", ".pdf", true],
    ["a.txt", "text/plain", ".pdf", false],
    ["a.png", "image/png", "image/*", true],
    ["a.png", "image/png", "image/png,.pdf", true],
    ["a.gif", "image/gif", "image/png,.pdf", false],
    ["a.anything", "", undefined, true],
    ["a.anything", "", "", true],
  ])("%s (%s) against %s -> %s", (name, type, accept, expected) => {
    expect(isAccepted(file(name, 1, type), accept)).toBe(expected);
  });
});
