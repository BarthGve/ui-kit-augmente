import type { Meta, StoryObj } from "@storybook/react";
import { Carousel } from "./Carousel";

const Slide = ({ n }: { n: number }) => (
  <div
    style={{
      display: "grid",
      placeItems: "center",
      height: 160,
      background: "linear-gradient(135deg, #cfd3f1, #8f94fd)",
      borderRadius: 8,
    }}
  >
    Slide {n}
  </div>
);

const meta: Meta<typeof Carousel> = {
  title: "Components/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          'Slides in a native CSS scroll-snap strip (no library): swipe and scroll work without script. Previous and next buttons, indicators and the arrow keys (also Home and End) move between slides. The region is `aria-roledescription="carousel"` and each slide a labelled group; the slides out of view are hidden from assistive technology and not focusable. `autoPlay` can be paused, stops on hover and focus, never starts with `prefers-reduced-motion`, and the live region is silent while it rotates.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Carousel>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel aria-label="Featured">
        <Slide n={1} />
        <Slide n={2} />
        <Slide n={3} />
      </Carousel>
    </div>
  ),
};

export const AutoPlay: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel aria-label="News" autoPlay loop interval={3000}>
        <Slide n={1} />
        <Slide n={2} />
        <Slide n={3} />
      </Carousel>
    </div>
  ),
};

export const WithoutIndicators: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Carousel aria-label="Photos" indicators={false} loop>
        <Slide n={1} />
        <Slide n={2} />
      </Carousel>
    </div>
  ),
};
