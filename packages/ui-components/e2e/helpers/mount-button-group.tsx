import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Button } from "../../src/components/button";
import { ButtonGroup } from "../../src/components/button-group";

export const TestButtonGroup = ({ orientation }: { orientation?: "horizontal" | "vertical" }) => (
  <CunninghamProvider>
    <div style={{ padding: "1rem" }}>
      <ButtonGroup aria-label="Alignment" orientation={orientation}>
        <Button color="neutral" variant="bordered">Left</Button>
        <Button color="neutral" variant="bordered">Center</Button>
        <Button color="neutral" variant="bordered">Right</Button>
      </ButtonGroup>
    </div>
  </CunninghamProvider>
);
