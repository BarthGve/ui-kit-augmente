import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerPreviewControls } from "./PreviewControls";

describe("PlayerPreviewControls", () => {
  const props = {
    isPlaying: false,
    rewind10Seconds: () => {},
    forward10Seconds: () => {},
    volume: 1,
    isMuted: false,
    toggleMute: () => {},
    handleVolumeChange: () => {},
    toggleFullscreen: () => {},
  };

  it("ignores Space once fullscreen is entered", async () => {
    const togglePlay = vi.fn();
    const { rerender } = render(
      <PlayerPreviewControls
        {...props}
        togglePlay={togglePlay}
        isFullscreen={false}
      />,
    );
    await userEvent.keyboard(" ");
    expect(togglePlay).toHaveBeenCalledTimes(1);

    rerender(
      <PlayerPreviewControls
        {...props}
        togglePlay={togglePlay}
        isFullscreen={true}
      />,
    );
    await userEvent.keyboard(" ");
    expect(togglePlay).toHaveBeenCalledTimes(1);
  });
});
