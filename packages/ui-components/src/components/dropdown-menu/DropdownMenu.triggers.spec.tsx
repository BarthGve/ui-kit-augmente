import { ReactElement, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CunninghamProvider } from ":/components/provider";
import { Button } from ":/components/button";
import { DropdownMenu } from "./DropdownMenu";
import { FeedbackForm } from ":/components/feedback-form";
import { LanguagePicker } from ":/components/language";
import { FilePreview } from ":/components/preview";
import { HelpMenu } from ":/components/help-menu";
import { AccessRoleDropdown } from "../share/access/AccessRoleDropdown";
import { ShareMembersActions } from "../share/modal/ShareMembersActions";
import { ShareLinkSettings } from "../share/modal/items/ShareLinkSettings";
import { ShareMemberItem } from "../share/modal/items/ShareMemberItem";
import { ShareInvitationItem } from "../share/modal/items/ShareInvitationItem";

const wrap = (ui: ReactElement) =>
  render(<CunninghamProvider currentLocale="en-US">{ui}</CunninghamProvider>);

// A closed menu trigger announces a menu that is collapsed; once opened it
// reads expanded.
const expectTrigger = async (trigger: HTMLElement) => {
  expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
};

const ROLES = [
  { label: "Admin", value: "admin" },
  { label: "Reader", value: "reader" },
];

describe("DropdownMenu trigger", () => {
  const Toggle = ({ child }: { child?: ReactElement }) => {
    const [open, setOpen] = useState(false);
    return (
      <DropdownMenu
        options={[{ label: "One", value: "1" }]}
        isOpen={open}
        onOpenChange={setOpen}
      >
        {child ?? <Button onClick={() => setOpen(!open)}>Menu</Button>}
      </DropdownMenu>
    );
  };

  it("announces a collapsed then expanded menu on its trigger", async () => {
    wrap(<Toggle />);
    await expectTrigger(screen.getByRole("button", { name: "Menu" }));
  });

  it("lets the trigger keep attributes it sets itself", () => {
    wrap(
      <Toggle
        child={
          <Button aria-haspopup="dialog" aria-expanded={true}>
            Own
          </Button>
        }
      />,
    );
    const trigger = screen.getByRole("button", { name: "Own" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("DropdownMenu consumers expose the menu state on their trigger", () => {
  it("FeedbackForm (category)", async () => {
    wrap(
      <FeedbackForm
        isOpen
        categories={[{ label: "Bug", value: "bug" }]}
        onSend={() => {}}
        onCancel={() => {}}
      >
        <span>anchor</span>
      </FeedbackForm>,
    );
    await expectTrigger(
      document.querySelector(
        ".c__feedback-form__category__trigger",
      ) as HTMLElement,
    );
  });

  it("LanguagePicker", async () => {
    wrap(
      <LanguagePicker
        languages={[
          { label: "English", value: "en", isChecked: true },
          { label: "Français", value: "fr" },
        ]}
      />,
    );
    await expectTrigger(screen.getByRole("button", { name: /Language/ }));
  });

  it("FilePreview (actions)", async () => {
    wrap(
      <FilePreview
        isOpen
        onClose={() => {}}
        files={[
          {
            id: "1",
            size: 10,
            title: "a.png",
            mimetype: "image/png",
            url_preview: "a.png",
            url: "a.png",
          },
        ]}
        openedFileId="1"
      />,
    );
    const buttons = await screen.findAllByRole("button");
    const trigger = buttons.find((b) => b.hasAttribute("aria-haspopup"));
    expect(trigger).toBeDefined();
    await expectTrigger(trigger as HTMLElement);
  });

  it("HelpMenu", async () => {
    wrap(<HelpMenu documentationUrl="https://example.com" />);
    await expectTrigger(screen.getByRole("button", { name: "Help" }));
  });

  it("AccessRoleDropdown", async () => {
    const Dropdown = () => {
      const [open, setOpen] = useState(false);
      return (
        <AccessRoleDropdown
          roles={ROLES}
          selectedRole="admin"
          onSelect={() => {}}
          isOpen={open}
          onOpenChange={setOpen}
        />
      );
    };
    wrap(<Dropdown />);
    await expectTrigger(screen.getByTestId("access-role-dropdown-button"));
  });

  it("ShareMembersActions", async () => {
    wrap(<ShareMembersActions onOpenImport={() => {}} />);
    await expectTrigger(screen.getByRole("button"));
  });

  it("ShareLinkSettings (reach and role)", async () => {
    wrap(
      <ShareLinkSettings
        canUpdate
        linkReach="public"
        linkReachChoices={[{ label: "Public", value: "public" }]}
        onUpdateLinkReach={() => {}}
        showLinkRole
        linkRole="reader"
        linkRoleChoices={[{ label: "Reader", value: "reader" }]}
        onUpdateLinkRole={() => {}}
      />,
    );
    await expectTrigger(screen.getByTestId("share-link-reach-dropdown-button"));
    await userEvent.keyboard("{Escape}");
    await expectTrigger(screen.getByTestId("share-link-role-dropdown-button"));
  });

  it("ShareMemberItem", async () => {
    wrap(
      <ShareMemberItem
        roles={ROLES}
        accessData={{
          id: "1",
          role: "admin",
          user: { id: "u1", full_name: "Ada", email: "ada@example.com" },
        }}
      />,
    );
    await expectTrigger(screen.getByTestId("access-role-dropdown-button"));
  });

  it("ShareInvitationItem", async () => {
    wrap(
      <ShareInvitationItem
        roles={ROLES}
        invitation={{
          id: "1",
          role: "reader",
          email: "bob@example.com",
          user: { id: "u2", full_name: "Bob", email: "bob@example.com" },
        }}
      />,
    );
    await expectTrigger(screen.getByTestId("access-role-dropdown-button"));
  });
});
