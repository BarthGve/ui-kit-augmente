import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Timeline } from "../../src/components/timeline/Timeline";

const events = Array.from({ length: 8 }, (_, i) => ({
  id: `e${i}`,
  date: `2026-10-${String(i + 10).padStart(2, "0")}`,
  title: `Step ${i + 1}`,
  state: i < 3 ? ("done" as const) : i === 3 ? ("current" as const) : undefined,
}));

export const TestTimeline = ({
  orientation,
}: {
  orientation: "vertical" | "horizontal";
}) => (
  <CunninghamProvider>
    <div style={{ padding: "1rem" }}>
      <button>Before timeline</button>
      <div style={{ width: "320px" }} data-testid="container">
        <Timeline
          aria-label="History"
          orientation={orientation}
          events={events}
        />
      </div>
    </div>
  </CunninghamProvider>
);
