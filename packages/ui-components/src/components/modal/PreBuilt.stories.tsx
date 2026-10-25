import { Meta } from "@storybook/react";
import React, { useCallback, useEffect } from "react";
import { Button } from ":/components/button";
import { useModals } from ":/components/modal/ModalProvider";
import { VariantType } from ":/utils/VariantUtils";

const meta: Meta = {
  title: "Components/Modal",
  parameters: {
    docs: {
      story: {
        height: "350px",
      },
    },
  },
};

export default meta;

export const DeleteConfirmationModal = {
  render: () => {
    const { deleteConfirmationModal } = useModals();

    const ask = useCallback(async () => {
      const decision = await deleteConfirmationModal();
      alert(`You decided ${decision}`);
    }, [deleteConfirmationModal]);

    useEffect(() => {
      ask();
    }, [ask]);

    return <Button onClick={ask}>Open</Button>;
  },
};

export const ConfirmationModal = {
  render: () => {
    const { confirmationModal } = useModals();

    const ask = useCallback(async () => {
      const decision = await confirmationModal();
      alert(`You decided ${decision}`);
    }, [confirmationModal]);

    useEffect(() => {
      ask();
    }, [ask]);

    return <Button onClick={ask}>Open</Button>;
  },
};

const MessageWrapper = (type: VariantType) => () => {
  const { messageModal } = useModals();

  const ask = useCallback(async () => {
    const decision = await messageModal({
      title: "Watch out!",
      children: "This is a custom message!",
      messageType: type,
    });
    alert(`You decided ${decision}`);
  }, [messageModal]);

  useEffect(() => {
    ask();
  }, [ask]);

  return <Button onClick={ask}>Open</Button>;
};

export const SuccessModal = {
  render: MessageWrapper(VariantType.SUCCESS),
};
export const InfoModal = {
  render: MessageWrapper(VariantType.INFO),
};

export const ErrorModal = {
  render: MessageWrapper(VariantType.ERROR),
};

export const NeutralModal = {
  render: MessageWrapper(VariantType.NEUTRAL),
};
export const WarningModal = {
  render: MessageWrapper(VariantType.WARNING),
};
