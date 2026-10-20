import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Button } from "../../src/components/button";
import { VerticalSeparator } from "../../src/components/separator";
import { Toolbar } from "../../src/components/toolbar";

export const TestToolbar = ({ width }: { width?: number }) => (
  <CunninghamProvider>
    <div style={{ padding: "1rem", width }}>
      <button>Before</button>
      <Toolbar aria-label="Formatting">
        <Button color="neutral" variant="tertiary">
          Bold
        </Button>
        <Button color="neutral" variant="tertiary">
          Italic
        </Button>
        <VerticalSeparator withPadding={false} />
        <Button color="neutral" variant="tertiary" disabled>
          Link
        </Button>
        <Button color="neutral" variant="tertiary">
          Quote
        </Button>
        <Button color="neutral" variant="tertiary">
          Code
        </Button>
      </Toolbar>
      <button>After</button>
    </div>
  </CunninghamProvider>
);
