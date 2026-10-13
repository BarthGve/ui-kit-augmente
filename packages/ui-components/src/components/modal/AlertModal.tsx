import React, { ReactNode, useCallback, useId } from "react";
import classNames from "classnames";
import { Modal, ModalSize } from ":/components/modal/index";
import { useCunningham } from ":/components/provider";
import { Button } from ":/components/button";
import { iconFromType, VariantType } from ":/utils/VariantUtils";

/** The four severities of `Alert`; no severity means neutral. */
export type AlertModalSeverity = `${Exclude<VariantType, VariantType.NEUTRAL>}`;

export type AlertModalProps = {
  isOpen: boolean;
  /** Called by the dismiss action, Escape and (opt-in) a click outside. */
  onClose: () => void;
  /** Adds the severity icon and colours the primary action. */
  severity?: AlertModalSeverity;
  title: ReactNode;
  /** The message, read as the dialog description. */
  children: ReactNode;
  /** Extra content after the message, not part of the description. */
  details?: ReactNode;
  /** Replaces the severity icon, above the title. */
  media?: ReactNode;
  /** Does not close the modal: the caller decides. */
  primaryAction?: { label: string; onClick: () => void };
  dismissLabel?: string;
  closeOnClickOutside?: boolean;
  /** `"default"` is `ModalSize.MEDIUM`, `"sm"` is `ModalSize.SMALL`. */
  size?: "default" | "sm";
};

export const AlertModal = ({
  isOpen,
  onClose,
  severity,
  title,
  children,
  details,
  media,
  primaryAction,
  dismissLabel,
  closeOnClickOutside,
  size = "default",
}: AlertModalProps) => {
  const { t } = useCunningham();
  const titleId = useId();
  const messageId = useId();
  // An error is destructive: Enter on open must not confirm it.
  const focusPrimary = !!primaryAction && severity !== "error";
  // Not `autoFocus`: it scrolls the button into view, and the footer sits at
  // the end of the scroller, so a long message would open past its title.
  // Stable callback: runs when the button mounts, not on every render.
  const focusOnMount = useCallback(
    (button: HTMLButtonElement | null) =>
      button?.focus({ preventScroll: true }),
    [],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size === "sm" ? ModalSize.SMALL : ModalSize.MEDIUM}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      hideCloseButton
      closeOnClickOutside={closeOnClickOutside}
      titleIcon={
        !media &&
        severity && (
          <span
            className={classNames(
              "material-icons",
              `modal-message-${severity}-icon`,
            )}
            aria-hidden="true"
          >
            {iconFromType(severity as VariantType)}
          </span>
        )
      }
      title={
        <>
          {media && <div className="c__alert-modal__media">{media}</div>}
          <span id={titleId}>{title}</span>
        </>
      }
      rightActions={
        <div className="c__alert-modal__actions">
          <Button
            variant={primaryAction ? "bordered" : "primary"}
            color={primaryAction ? "neutral" : (severity ?? "neutral")}
            onClick={onClose}
            ref={focusPrimary ? undefined : focusOnMount}
          >
            {dismissLabel ??
              t(
                primaryAction
                  ? "components.modals.helpers.confirmation.cancel"
                  : "components.modals.helpers.disclaimer.ok",
              )}
          </Button>
          {primaryAction && (
            <Button
              color={severity ?? "neutral"}
              onClick={primaryAction.onClick}
              ref={focusPrimary ? focusOnMount : undefined}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      }
    >
      <div
        id={messageId}
        className="c__modal__content__text c__modal__content__text--light"
      >
        {children}
      </div>
      {details}
    </Modal>
  );
};
