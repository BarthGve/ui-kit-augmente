import { useRef, useState } from "react";
import { CunninghamProvider } from "../../src/components/provider/Provider";
import {
  MessageScroller,
  MessageScrollerHandle,
} from "../../src/components/message-scroller";

const Row = ({ id }: { id: number }) => (
  <p data-message-id={`m${id}`} style={{ margin: 0, height: 40, boxSizing: "border-box", border: "1px solid #ccc" }}>
    Message {id}
  </p>
);

export const TestMessageScroller = () => {
  const [ids, setIds] = useState(() => Array.from({ length: 30 }, (_, i) => i + 100));
  const ref = useRef<MessageScrollerHandle>(null);
  return (
    <CunninghamProvider>
      <div style={{ height: 300, display: "flex", flexDirection: "column" }}>
        <MessageScroller aria-label="Conversation" ref={ref}>
          {ids.map((id) => (
            <Row key={id} id={id} />
          ))}
        </MessageScroller>
      </div>
      <button onClick={() => setIds((all) => [...all, Math.max(...all) + 1])}>Append</button>
      <button onClick={() => setIds((all) => [Math.min(...all) - 1, Math.min(...all) - 2, Math.min(...all) - 3, ...all])}>Prepend</button>
      <button onClick={() => ref.current?.scrollToMessage("m105")}>Jump to 105</button>
    </CunninghamProvider>
  );
};
