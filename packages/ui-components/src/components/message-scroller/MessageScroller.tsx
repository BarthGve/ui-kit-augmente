import clsx from "clsx";
import {
  HTMLAttributes,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from ":/components/button";
import { Icon } from ":/components/icon";
import { useCunningham } from ":/components/provider";

export type MessageScrollerHandle = {
  /** Scrolls to the latest message and follows new ones again. */
  scrollToBottom: () => void;
  /** Scrolls to the element marked `data-message-id={id}`; resolves to false if there is none. */
  scrollToMessage: (id: string) => boolean;
};

export type MessageScrollerProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "role"
> & {
  /** Names the scrollable region. */
  "aria-label": string;
  /** The conversation is being written (a streamed reply): `aria-busy` on the log. */
  streaming?: boolean;
  /** Distance, in pixels, from the end within which the reader still counts as following. Default 24. */
  threshold?: number;
  ref?: Ref<MessageScrollerHandle>;
};

/**
 * Scroll area for a live conversation. It follows new content only while the
 * reader is at the end; scrolled up, it stays where it is and offers a "jump
 * to latest" button. Content added above (older messages) does not move what
 * the reader is looking at. The viewport is a labelled, focusable region and
 * the messages are a `role="log"`. Mark each message with `data-message-id`
 * to jump to it.
 */
export const MessageScroller = ({
  streaming = false,
  threshold = 24,
  className,
  children,
  ref,
  ...props
}: MessageScrollerProps) => {
  const { t } = useCunningham();
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [atEnd, setAtEnd] = useState(true);
  // Remembered between renders without re-rendering.
  const state = useRef({
    atEnd: true,
    anchor: null as Element | null,
    anchorTop: 0,
  });

  const isAtEnd = useCallback(() => {
    const el = viewport.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }, [threshold]);

  const scrollToBottom = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    state.current.atEnd = true;
    setAtEnd(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToBottom,
      scrollToMessage: (id: string) => {
        const target = content.current?.querySelector(
          `[data-message-id="${CSS.escape(id)}"]`,
        );
        if (!target) return false;
        target.scrollIntoView({ block: "center" });
        return true;
      },
    }),
    [scrollToBottom],
  );

  // Remember the first message in view and where it sits, to keep it there if
  // content is added above it.
  const remember = useCallback(() => {
    const el = viewport.current;
    const list = content.current;
    if (!el || !list) return;
    const top = el.getBoundingClientRect().top;
    const anchor = Array.from(list.children).find(
      (child) => child.getBoundingClientRect().bottom > top,
    );
    state.current.anchor = anchor ?? null;
    state.current.anchorTop = anchor
      ? anchor.getBoundingClientRect().top - top
      : 0;
  }, []);

  useEffect(() => {
    const el = viewport.current;
    const list = content.current;
    if (!el || !list || typeof ResizeObserver === "undefined") return;
    remember();
    const observer = new ResizeObserver(() => {
      if (state.current.atEnd) {
        el.scrollTop = el.scrollHeight;
        return;
      }
      // Scrolled up: keep the remembered message where it was.
      const { anchor, anchorTop } = state.current;
      if (anchor && anchor.isConnected) {
        const shift =
          anchor.getBoundingClientRect().top -
          el.getBoundingClientRect().top -
          anchorTop;
        if (shift !== 0) el.scrollTop += shift;
      }
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [remember]);

  // New children that do not change the box (rare) still count as content.
  useEffect(() => {
    if (state.current.atEnd) scrollToBottom();
  }, [children, scrollToBottom]);

  return (
    <div className={clsx("c__message-scroller", className)}>
      <div
        {...props}
        ref={viewport}
        role="region"
        tabIndex={0}
        className="c__message-scroller__viewport"
        onScroll={(event) => {
          // Only the reader's own scrolling changes whether we follow: content
          // growing under a reader at the end must not count as leaving it.
          state.current.atEnd = isAtEnd();
          setAtEnd(state.current.atEnd);
          remember();
          props.onScroll?.(event);
        }}
      >
        <div
          ref={content}
          role="log"
          aria-live="polite"
          aria-busy={streaming}
          className="c__message-scroller__content"
        >
          {children}
        </div>
      </div>
      {!atEnd && (
        <Button
          className="c__message-scroller__jump"
          size="small"
          variant="secondary"
          color="neutral"
          icon={<Icon name="arrow_downward" aria-hidden="true" />}
          onClick={scrollToBottom}
        >
          {t("components.messageScroller.jump")}
        </Button>
      )}
    </div>
  );
};
