import { useState } from "react";
import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Card } from "../../src/components/card/Card";

export const TestCard = ({ theme = "default" }: { theme?: string }) => {
  const [presses, setPresses] = useState(0);

  return (
    <CunninghamProvider theme={theme}>
      <div style={{ display: "grid", gap: "1rem", padding: "1rem" }}>
        <button>Before cards</button>
        <Card>Static card</Card>
        <Card href="#card-target">Linked card</Card>
        <Card onPress={() => setPresses((count) => count + 1)}>
          Pressable card
        </Card>
        <output aria-label="Presses">{presses}</output>
      </div>
    </CunninghamProvider>
  );
};
