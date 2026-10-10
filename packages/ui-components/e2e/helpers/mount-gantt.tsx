import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Gantt } from "../../src/components/gantt/Gantt";
import type { GanttTask } from "../../src/components/gantt/types";

// 30 staggered tasks over about a year: wider and taller than the box.
const TASKS: GanttTask[] = Array.from({ length: 30 }, (_, i) => {
  const day = 5 + i * 12;
  const start = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(2026, 0, day + 9)).toISOString().slice(0, 10);
  return { id: `t${i}`, name: `Task ${i + 1}`, start, end };
});

export const TestGantt = () => (
  <CunninghamProvider>
    <div style={{ height: "300px", padding: "1rem" }}>
      <Gantt
        aria-label="Schedule"
        data-testid="gantt"
        tasks={TASKS}
        today="2026-03-23"
      />
    </div>
  </CunninghamProvider>
);
