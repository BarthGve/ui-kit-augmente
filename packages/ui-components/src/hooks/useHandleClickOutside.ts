import { RefObject, useEffect } from "react";
import { useLatest } from ":/hooks/useLatest";

export const useHandleClickOutside = (
  ref: RefObject<HTMLDivElement | null>,
  onClickOutside: () => void,
) => {
  const onClickOutsideRef = useLatest(onClickOutside);
  useEffect(() => {
    const outsideListenerEvent = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onClickOutsideRef.current();
    };
    document.addEventListener("click", outsideListenerEvent, true);
    return () =>
      document.removeEventListener("click", outsideListenerEvent, true);
  }, [ref, onClickOutsideRef]);
};
