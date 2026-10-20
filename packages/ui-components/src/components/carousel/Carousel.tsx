import clsx from "clsx";
import {
  Children,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from ":/components/button";
import { Icon } from ":/components/icon";
import { useCunningham } from ":/components/provider";

export type CarouselProps = Omit<
  HTMLAttributes<HTMLElement>,
  "onChange" | "children"
> & {
  /** Names the carousel. */
  "aria-label": string;
  children: ReactNode;
  /** Shows the dots that go to a slide. Default `true`. */
  indicators?: boolean;
  /** Goes from the last slide to the first one, and back. */
  loop?: boolean;
  /** Moves on its own. It stops on hover and focus, and with reduced motion. */
  autoPlay?: boolean;
  /** Milliseconds between slides when `autoPlay`. Default 5000. */
  interval?: number;
  onChange?: (index: number) => void;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/**
 * Slides in a native scroll-snap strip: swipe and scroll work without script.
 * Previous and next buttons, indicators and the arrow keys move between the
 * slides; the slide show can be paused and stops on hover and focus.
 */
export const Carousel = ({
  children,
  indicators = true,
  loop = false,
  autoPlay = false,
  interval = 5000,
  onChange,
  className,
  ...props
}: CarouselProps) => {
  const { t } = useCunningham();
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const rotating = autoPlay && !paused && !engaged && !prefersReducedMotion();

  const goTo = useCallback(
    (target: number) => {
      const next = loop
        ? (target + count) % count
        : Math.min(Math.max(target, 0), count - 1);
      if (next === index) return;
      setIndex(next);
      onChange?.(next);
      const el = viewport.current;
      el?.scrollTo?.({
        left: next * el.clientWidth,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [count, loop, onChange, index],
  );

  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(
      () => goTo(index + 1 >= count ? 0 : index + 1),
      interval,
    );
    return () => clearTimeout(timer);
  }, [rotating, index, interval, count, goTo]);

  // A swipe or a scroll moves the strip: follow it.
  const onScroll = () => {
    const el = viewport.current;
    if (!el || el.clientWidth === 0) return;
    const seen = Math.round(el.scrollLeft / el.clientWidth);
    if (seen !== index && seen >= 0 && seen < count) {
      setIndex(seen);
      onChange?.(seen);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    goTo(target);
  };

  return (
    <section
      {...props}
      aria-roledescription="carousel"
      className={clsx("c__carousel", className)}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setEngaged(true)}
      onMouseLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
    >
      <div
        ref={viewport}
        className="c__carousel__viewport"
        data-testid="carousel-live"
        aria-live={rotating ? "off" : "polite"}
        onScroll={onScroll}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={t("components.carousel.slide_label", {
              current: i + 1,
              total: count,
            })}
            aria-hidden={i === index ? undefined : true}
            // The slides out of view must not be focusable either.
            inert={i === index ? undefined : true}
            data-current={i === index}
            className="c__carousel__slide"
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="c__carousel__controls">
        <Button
          variant="tertiary"
          color="neutral"
          size="small"
          icon={<Icon name="chevron_left" aria-hidden="true" />}
          aria-label={t("components.carousel.previous")}
          // aria-disabled, not disabled: a button that disables itself under the
          // focus would drop the focus, and the arrow keys with it.
          aria-disabled={!loop && index === 0 ? true : undefined}
          onClick={() => goTo(index - 1)}
        />
        {indicators && (
          <div
            role="group"
            aria-label={t("components.carousel.slides")}
            className="c__carousel__indicators"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                className="c__carousel__indicator"
                aria-label={t("components.carousel.go_to", { current: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
        {autoPlay && (
          <Button
            variant="tertiary"
            color="neutral"
            size="small"
            icon={
              <Icon name={paused ? "play_arrow" : "pause"} aria-hidden="true" />
            }
            aria-label={
              paused
                ? t("components.carousel.play")
                : t("components.carousel.pause")
            }
            onClick={() => setPaused(!paused)}
          />
        )}
        <Button
          variant="tertiary"
          color="neutral"
          size="small"
          icon={<Icon name="chevron_right" aria-hidden="true" />}
          aria-label={t("components.carousel.next")}
          aria-disabled={!loop && index === count - 1 ? true : undefined}
          onClick={() => goTo(index + 1)}
        />
      </div>
    </section>
  );
};
