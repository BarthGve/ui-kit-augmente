import { createContext, PropsWithChildren, useContext } from "react";
import { I18nProvider, useLocale } from "react-aria";

export type Direction = "ltr" | "rtl";

const DirectionContext = createContext<Direction>("ltr");

/** The reading direction of the nearest `DirectionProvider`; `ltr` without one. */
export const useDirection = (): Direction => useContext(DirectionContext);

// A locale whose direction is the wanted one, for react-aria, which derives
// the arrow keys of Tabs, Slider and the like from its locale.
const STAND_IN_LOCALE: Record<Direction, string> = {
  ltr: "en-US",
  rtl: "ar-EG",
};

const AriaDirection = ({
  direction,
  children,
}: PropsWithChildren<{ direction: Direction }>) => {
  const { locale, direction: current } = useLocale();
  return (
    <I18nProvider
      locale={current === direction ? locale : STAND_IN_LOCALE[direction]}
    >
      {children}
    </I18nProvider>
  );
};

/**
 * Sets the reading direction of its subtree: a `dir` attribute on a wrapper
 * that adds no box, a hook for components that need to know, and the arrow
 * keys of the react-aria based components (Tabs, Slider...) follow it. Use
 * logical CSS properties (`inline-start`, `inline-end`) in styles so that
 * layouts mirror.
 */
export const DirectionProvider = ({
  direction,
  children,
}: PropsWithChildren<{ direction: Direction }>) => (
  <DirectionContext.Provider value={direction}>
    <div dir={direction} style={{ display: "contents" }}>
      <AriaDirection direction={direction}>{children}</AriaDirection>
    </div>
  </DirectionContext.Provider>
);
