import React, { useRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useHandleClickOutside } from ":/hooks/useHandleClickOutside";

describe("useHandleClickOutside", () => {
  const TestComponent = ({
    onClickOutside,
  }: {
    onClickOutside: () => void;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    useHandleClickOutside(ref, onClickOutside);
    return (
      <>
        <div ref={ref}>inside</div>
        <button>outside</button>
      </>
    );
  };

  it("calls the latest callback after a rerender", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<TestComponent onClickOutside={first} />);
    rerender(<TestComponent onClickOutside={second} />);

    await userEvent.click(screen.getByText("outside"));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText("inside"));
    expect(second).toHaveBeenCalledTimes(1);
  });
});
