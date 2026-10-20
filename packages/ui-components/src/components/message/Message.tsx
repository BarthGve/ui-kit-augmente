import clsx from "clsx";
import { HTMLAttributes, ReactNode } from "react";
import { Bubble, BubbleVariant } from ":/components/bubble";
import { useCunningham } from ":/components/provider";
import { UserAvatar } from ":/components/users";

export type MessageProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  author: string;
  /** When the message was sent. */
  timestamp: Date | string;
  /** Replaces the displayed time, for a format of your own ("2:05 PM", "yesterday"). */
  timeLabel?: string;
  /** The reader's own message: aligned to the end. */
  own?: boolean;
  /** Content of the message, shown in a `Bubble`. */
  children: ReactNode;
  /** Variant of the bubble. Default `default` for the reader, `muted` for others. */
  variant?: BubbleVariant;
  /** Controls such as reply or react; shown on hover and focus. */
  actions?: ReactNode;
  /** Hides the avatar. */
  hideAvatar?: boolean;
};

const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

/**
 * One message of a conversation: avatar, author, time and content in a
 * `Bubble`, with actions that appear on hover and focus (and always on touch
 * screens). The reader's own messages sit at the end.
 */
export const Message = ({
  author,
  timestamp,
  timeLabel,
  own = false,
  children,
  variant,
  actions,
  hideAvatar = false,
  className,
  ...props
}: MessageProps) => {
  const { t } = useCunningham();
  const date = new Date(timestamp);
  const align = own ? "end" : "start";

  return (
    <article
      {...props}
      className={clsx("c__message", { "c__message--own": own }, className)}
    >
      {!hideAvatar && (
        <div className="c__message__avatar">
          <UserAvatar fullName={author} size="small" />
        </div>
      )}
      <div className="c__message__body">
        <div className="c__message__meta">
          {own ? (
            <span className="c__offscreen">{t("components.message.you")}</span>
          ) : (
            <span className="c__message__author">{author}</span>
          )}
          <time className="c__message__time" dateTime={date.toISOString()}>
            {timeLabel ?? formatTime(date)}
          </time>
        </div>
        <div className="c__message__content">
          <Bubble
            align={align}
            variant={variant ?? (own ? "default" : "muted")}
          >
            {children}
          </Bubble>
          {actions != null && (
            <div className="c__message__actions">{actions}</div>
          )}
        </div>
      </div>
    </article>
  );
};
