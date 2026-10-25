import { Meta } from "@storybook/react";
import React, { useEffect } from "react";
import { Button } from ":/components/button";
import { AlertModal, AlertModalProps } from ":/components/modal/AlertModal";
import { useModal } from ":/components/modal/index";
import longLorem from ":/components/modal/resources/longLorem.json";

const meta: Meta = {
  title: "Components/Modal/AlertModal",
  parameters: {
    docs: {
      story: {
        height: "350px",
      },
    },
  },
};

export default meta;

type DemoProps = Omit<AlertModalProps, "isOpen" | "onClose">;

/** Opens on mount and from its button, so focus return is visible. */
const Demo = (props: DemoProps) => {
  const modal = useModal();
  const { open } = modal;
  useEffect(() => {
    open();
  }, [open]);
  return (
    <>
      <Button onClick={modal.open}>Open alert</Button>
      <AlertModal {...props} isOpen={modal.isOpen} onClose={modal.close} />
    </>
  );
};

const action = (label: string) => ({
  label,
  onClick: () => alert(`${label} clicked`),
});

export const Neutral = {
  render: () => (
    <Demo title="Are you absolutely sure?" primaryAction={action("Continue")}>
      This action cannot be undone. This will permanently delete your account
      from our servers.
    </Demo>
  ),
};

export const Info = {
  render: () => (
    <Demo
      severity="info"
      title="Your session will expire soon"
      primaryAction={action("Stay signed in")}
    >
      You will be signed out in 5 minutes. Save your work to avoid losing
      changes.
    </Demo>
  ),
};

export const Success = {
  render: () => (
    <Demo
      severity="success"
      title="Document published"
      primaryAction={action("View document")}
    >
      Your document is now visible to everyone who has the link.
    </Demo>
  ),
};

export const Warning = {
  render: () => (
    <Demo
      severity="warning"
      title="Unsaved changes"
      primaryAction={action("Save and leave")}
    >
      If you leave this page, your latest changes will be lost.
    </Demo>
  ),
};

export const Error = {
  render: () => (
    <Demo
      severity="error"
      title="Delete this file?"
      primaryAction={action("Delete")}
    >
      The file will be permanently deleted. This cannot be undone.
    </Demo>
  ),
};

export const DismissOnly = {
  render: () => (
    <Demo title="Session closed">
      You have been signed out because you were inactive.
    </Demo>
  ),
};

export const WithMedia = {
  render: () => (
    <Demo
      media={
        <span className="material-icons" aria-hidden="true">
          lock
        </span>
      }
      title="Share this project?"
      primaryAction={action("Share")}
    >
      Everyone in the workspace will be able to see and edit it.
    </Demo>
  ),
};

export const SmallSize = {
  render: () => (
    <Demo
      size="sm"
      severity="warning"
      title="Discard draft?"
      primaryAction={action("Discard")}
    >
      Your draft will be lost.
    </Demo>
  ),
};

export const CloseOnClickOutside = {
  render: () => (
    <Demo severity="info" title="New version available" closeOnClickOutside>
      Click outside, press Escape or use Ok to close.
    </Demo>
  ),
};

export const LongMessage = {
  render: () => (
    <Demo
      severity="warning"
      title="Read before continuing"
      primaryAction={action("I understand")}
    >
      {longLorem.text}
    </Demo>
  ),
};

export const WithDetails = {
  render: () => (
    <Demo
      severity="error"
      title="Upload failed"
      primaryAction={action("Try again")}
      details={
        <ul>
          <li>report.pdf: file too large</li>
          <li>photo.heic: format not supported</li>
        </ul>
      }
    >
      2 files could not be sent.
    </Demo>
  ),
};
