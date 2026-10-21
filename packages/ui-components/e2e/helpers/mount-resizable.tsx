import { useState } from "react";
import { Layout } from "react-resizable-panels";
import { CunninghamProvider } from "../../src/components/provider/Provider";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../../src/components/resizable";

export const TestResizable = ({ orientation = "horizontal" }: { orientation?: "horizontal" | "vertical" }) => {
  const [layout, setLayout] = useState<Layout>({ left: 50, right: 50 });
  const [last, setLast] = useState("none");
  return (
    <CunninghamProvider>
      <div style={{ width: 600, height: 300 }}>
        <ResizablePanelGroup
          orientation={orientation}
          layout={layout}
          onResize={(next) => {
            setLayout(next);
            setLast(JSON.stringify(next));
          }}
        >
          <ResizablePanel id="left" defaultSize="50" minSize="20" maxSize="80">Left</ResizablePanel>
          <ResizableHandle aria-label="Resize left panel" />
          <ResizablePanel id="right" defaultSize="50">Right</ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <button onClick={() => setLayout({ left: 30, right: 70 })}>Set 30/70</button>
      <output aria-label="last layout">{last}</output>
    </CunninghamProvider>
  );
};
