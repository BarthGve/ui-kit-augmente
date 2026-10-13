import React from "react";
import { render, screen } from "@testing-library/react";
import {
  Modal,
  ModalDefaultVariantProps,
  ModalSize,
} from ":/components/modal/index";
import { CunninghamProvider } from ":/components/provider";

const renderModal = (
  props: Omit<ModalDefaultVariantProps, "size" | "isOpen" | "onClose">,
) =>
  render(
    <CunninghamProvider>
      <Modal
        size={ModalSize.SMALL}
        isOpen={true}
        onClose={() => {}}
        {...props}
      />
    </CunninghamProvider>,
  );

describe("<Modal/> role and aria labelling", () => {
  it("renders the content with role alertdialog when asked", async () => {
    renderModal({ role: "alertdialog", title: "Delete file?" });
    const dialog = await screen.findByRole("alertdialog");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("is named and described by the referenced nodes, without aria-label", async () => {
    renderModal({
      role: "alertdialog",
      "aria-labelledby": "modal-title",
      "aria-describedby": "modal-message",
      title: <span id="modal-title">Delete file?</span>,
      children: <p id="modal-message">This cannot be undone.</p>,
    });
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveAttribute("aria-labelledby", "modal-title");
    expect(dialog).toHaveAttribute("aria-describedby", "modal-message");
    expect(dialog).toHaveAccessibleName("Delete file?");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    // A ReactNode title would otherwise leak as "[object Object]".
    expect(dialog).not.toHaveAttribute("aria-label");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("keeps role dialog and the title as aria-label without the new props", async () => {
    renderModal({ title: "Settings" });
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Settings");
    expect(dialog).not.toHaveAttribute("aria-labelledby");
    expect(dialog).not.toHaveAttribute("aria-describedby");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});
