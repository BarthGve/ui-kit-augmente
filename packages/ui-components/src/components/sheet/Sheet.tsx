import clsx from "clsx";
import {
  PropsWithChildren,
  ReactNode,
  useEffect,
  useId,
  useState,
} from "react";
import ReactModal from "react-modal";
import { Button } from ":/components/button";
import { CloseIcon } from ":/components/modal/CloseIcon";
import { NOSCROLL_CLASS, useModals } from ":/components/modal/ModalProvider";
import { useCunningham } from ":/components/provider";

export type SheetSide = "left" | "right" | "top" | "bottom";

export type SheetProps = PropsWithChildren<{
  isOpen: boolean;
  /** Called on Escape, with the close button and on an outside click. */
  onClose: () => void;
  /** Names the dialog and fills the header. */
  title: ReactNode;
  /** Side the sheet slides in from. Default `right`. */
  side?: SheetSide;
  /** Pinned under the body, for the actions. */
  footer?: ReactNode;
  /** Close on a click on the backdrop. Default `true`. */
  closeOnClickOutside?: boolean;
  className?: string;
}>;

/**
 * Panel that slides over the page from one side, as a modal dialog. It shares
 * the `Modal` overlay (react-modal, focus trap, scroll lock, backdrop).
 */
export const Sheet = (props: SheetProps) => {
  // Like Modal: wait for the first render, so the portal parent exists.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <SheetInner {...props} /> : null;
};

const SheetInner = ({
  isOpen,
  onClose,
  title,
  side = "right",
  footer,
  closeOnClickOutside = true,
  className,
  children,
}: SheetProps) => {
  const { t } = useCunningham();
  const { modalParentSelector } = useModals();
  const titleId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <ReactModal
      isOpen
      onRequestClose={onClose}
      parentSelector={modalParentSelector}
      overlayClassName="c__modal__backdrop"
      className={clsx("c__sheet", `c__sheet--${side}`, className)}
      bodyOpenClassName={clsx("c__modals--opened", NOSCROLL_CLASS)}
      shouldCloseOnOverlayClick={closeOnClickOutside}
      shouldCloseOnEsc
      role="dialog"
      aria={{ labelledby: titleId }}
    >
      <div className="c__sheet__header">
        <div className="c__sheet__title" id={titleId}>
          {title}
        </div>
        <Button
          icon={<CloseIcon />}
          variant="tertiary"
          color="neutral"
          size="small"
          aria-label={t("components.sheet.close")}
          onClick={onClose}
        />
      </div>
      <div className="c__sheet__body">{children}</div>
      {footer && <div className="c__sheet__footer">{footer}</div>}
    </ReactModal>
  );
};
