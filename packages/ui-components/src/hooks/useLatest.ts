import { useLayoutEffect, useRef } from "react";

/**
 * Keeps a ref pointing to the latest value, so an effect can call the latest callback
 * prop without listing it as a dependency: inline callbacks change on every render and
 * would re-run the effect each time. The ref itself is stable.
 */
export const useLatest = <T>(value: T) => {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
};
