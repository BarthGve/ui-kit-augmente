import { useState } from "react";
import { Dialog, Modal } from "react-aria-components";
import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Gantt } from "../../src/components/gantt/Gantt";
import {
  DEMO_DEPENDENCIES,
  DEMO_TASKS,
  DEMO_TODAY,
} from "../../src/components/gantt/demo";
import type {
  GanttDependency,
  GanttProps,
  GanttTask,
  GanttZoom,
} from "../../src/components/gantt/types";

// 30 staggered tasks over about a year: wider and taller than the box.
const TASKS: GanttTask[] = Array.from({ length: 30 }, (_, i) => {
  const day = 5 + i * 12;
  const start = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(2026, 0, day + 9)).toISOString().slice(0, 10);
  return { id: `t${i}`, name: `Task ${i + 1}`, start, end };
});

export const TestGantt = (props: Partial<GanttProps>) => (
  <CunninghamProvider>
    <div style={{ height: "300px", padding: "1rem" }}>
      <Gantt
        aria-label="Schedule"
        data-testid="gantt"
        tasks={TASKS}
        today="2026-03-23"
        {...props}
      />
    </div>
  </CunninghamProvider>
);

// A parent that accepts every zoom request, in the same event.
export const ControlledGantt = () => {
  const [zoom, setZoom] = useState<GanttZoom>("week");
  return <TestGantt zoom={zoom} onZoomChange={setZoom} />;
};

// Editing (s23): a parent that applies every change.
export const EditableGantt = ({
  onTaskChange,
  ...props
}: Partial<GanttProps>) => {
  const [tasks, setTasks] = useState(TASKS);
  return (
    <TestGantt
      editable
      tasks={tasks}
      onTaskChange={(id, change) => {
        onTaskChange?.(id, change);
        setTasks((all) =>
          all.map((task) => (task.id === id ? { ...task, ...change } : task)),
        );
      }}
      {...props}
    />
  );
};

// An editable chart inside a dismissable RAC dialog, "Closed" once it closes.
export const GanttInModal = () => {
  const [open, setOpen] = useState(true);
  return (
    <CunninghamProvider>
      {!open && <p>Closed</p>}
      <Modal isOpen={open} onOpenChange={setOpen} isDismissable>
        <Dialog aria-label="Plan">
          <div style={{ height: "300px", width: "900px" }}>
            <Gantt
              aria-label="Schedule"
              data-testid="gantt"
              tasks={TASKS}
              today="2026-03-23"
              editable
            />
          </div>
        </Dialog>
      </Modal>
    </CunninghamProvider>
  );
};

// The `Dependencies` story's data (s24 t05) under a parent that applies every
// task and link change; tall enough to show every row without scrolling.
export const DemoGantt = ({
  onTaskChange,
  onDependencyChange,
}: Pick<GanttProps, "onTaskChange" | "onDependencyChange">) => {
  const [tasks, setTasks] = useState(DEMO_TASKS);
  const [dependencies, setDependencies] =
    useState<GanttDependency[]>(DEMO_DEPENDENCIES);
  return (
    <CunninghamProvider>
      <div style={{ height: "36rem", padding: "1rem" }}>
        <Gantt
          aria-label="Schedule"
          data-testid="gantt"
          tasks={tasks}
          dependencies={dependencies}
          today={DEMO_TODAY}
          editable
          onTaskChange={(id, change) => {
            onTaskChange?.(id, change);
            setTasks((all) =>
              all.map((task) =>
                task.id === id ? { ...task, ...change } : task,
              ),
            );
          }}
          onDependencyChange={(change) => {
            onDependencyChange?.(change);
            const { from, to } = change.dependency;
            setDependencies((all) =>
              change.kind === "add"
                ? [...all, change.dependency]
                : all.filter((l) => l.from !== from || l.to !== to),
            );
          }}
        />
      </div>
    </CunninghamProvider>
  );
};
