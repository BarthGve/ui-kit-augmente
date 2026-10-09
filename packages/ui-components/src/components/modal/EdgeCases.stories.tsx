import React, { useEffect } from "react";
import { Meta } from "@storybook/react";
import { Button } from ":/components/button";
import { Modal, ModalSize, useModal } from ":/components/modal/index";
import longLorem from ":/components/modal/resources/longLorem.json";

const meta: Meta = {
  title: "Components/Modal/Edge Cases",
  parameters: {
    docs: {
      story: {
        height: "350px",
      },
    },
  },
};

export default meta;

export const StackedModals = {
  render: () => {
    const modal1 = useModal();
    const modal2 = useModal();
    const modal3 = useModal();

    const openModals = () => {
      modal1.open();
      setTimeout(() => {
        modal2.open();
        setTimeout(() => {
          modal3.open();
        }, 100);
      }, 100);
    };

    useEffect(() => {
      openModals();
    }, []);

    const array = Array.from({ length: 1000 }, (_, i) => i);

    return (
      <>
        <div
          style={{
            minHeight: "3000px",
            backgroundColor: "pink",
          }}
        >
          <Button
            onClick={openModals}
            style={{
              position: "fixed",
            }}
          >
            Open Modals
          </Button>
          <Modal
            leftActions={<Button variant="tertiary">Tertiary</Button>}
            rightActions={
              <>
                <Button variant="secondary">Secondary</Button>
                <Button variant="primary">Primary</Button>
              </>
            }
            size={ModalSize.LARGE}
            {...modal1}
          >
            {longLorem.text}
          </Modal>
          <Modal
            leftActions={<Button variant="tertiary">Tertiary</Button>}
            rightActions={
              <>
                <Button variant="secondary">Secondary</Button>
                <Button variant="primary">Primary</Button>
              </>
            }
            size={ModalSize.MEDIUM}
            {...modal2}
          >
            {longLorem.text}
          </Modal>
          <Modal
            leftActions={<Button variant="tertiary">Tertiary</Button>}
            rightActions={
              <>
                <Button variant="secondary">Secondary</Button>
                <Button variant="primary">Primary</Button>
              </>
            }
            size={ModalSize.SMALL}
            {...modal3}
          >
            {longLorem.text}
          </Modal>
          {array.map((i) => (
            <div key={i}>{i}</div>
          ))}
        </div>
      </>
    );
  },
};

/** `role="alertdialog"`, named and described by nodes inside the modal. */
export const AlertDialogRole = {
  render: () => {
    const modal = useModal({ isOpenDefault: true });
    return (
      <>
        <Button onClick={modal.open}>Open alert dialog</Button>
        <Modal
          size={ModalSize.SMALL}
          role="alertdialog"
          aria-labelledby="edge-cases-alert-title"
          aria-describedby="edge-cases-alert-message"
          title={<span id="edge-cases-alert-title">Delete this file?</span>}
          rightActions={
            <>
              <Button variant="secondary" onClick={modal.close}>
                Cancel
              </Button>
              <Button onClick={modal.close}>Delete</Button>
            </>
          }
          {...modal}
        >
          <div
            id="edge-cases-alert-message"
            className="c__modal__content__text"
          >
            The file will be deleted permanently.
          </div>
        </Modal>
      </>
    );
  },
};
