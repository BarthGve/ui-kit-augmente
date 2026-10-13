import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Checkbox } from "../../src/components/forms/checkbox";
import { Radio, RadioGroup } from "../../src/components/forms/radio";
import { Switch } from "../../src/components/forms/switch";

// The padding absorbs the label's negative `margin-left` so it is never clipped.
export const TestCheckboxes = () => (
  <CunninghamProvider>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <button>Before</button>
      <div data-testid="default">
        <Checkbox aria-label="Default" />
      </div>
      <div data-testid="small">
        <Checkbox aria-label="Small" size="small" />
      </div>
      <div data-testid="small-indeterminate">
        <Checkbox aria-label="Small indeterminate" size="small" indeterminate />
      </div>
      <div data-testid="small-hint">
        <Checkbox label="Small with hint" size="small" text="Hint" />
      </div>
      <BrandProbe />
    </div>
  </CunninghamProvider>
);

export const TestRadios = () => (
  <CunninghamProvider>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <button>Before</button>
      <div data-testid="default">
        <Radio aria-label="Default" name="default" defaultChecked />
      </div>
      <div data-testid="small">
        <RadioGroup>
          <Radio label="One" name="small" value="one" size="small" />
          <Radio label="Two" name="small" value="two" size="small" />
        </RadioGroup>
      </div>
      <div data-testid="small-bare">
        <Radio aria-label="Small" name="small-bare" size="small" />
      </div>
      <BrandProbe />
    </div>
  </CunninghamProvider>
);

export const TestSwitches = () => (
  <CunninghamProvider>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <button>Before</button>
      <div data-testid="default">
        <Switch aria-label="Default" />
      </div>
      <div data-testid="default-checked">
        <Switch aria-label="Default checked" defaultChecked />
      </div>
      <div data-testid="small">
        <Switch aria-label="Small" size="small" />
      </div>
      <div data-testid="small-checked">
        <Switch aria-label="Small checked" size="small" defaultChecked />
      </div>
      <div data-testid="small-left">
        <Switch label="Left" size="small" text="Left hint" />
      </div>
      <div data-testid="small-right">
        <Switch label="Right" size="small" labelSide="right" text="Hint" />
      </div>
      <BrandProbe />
    </div>
  </CunninghamProvider>
);

const BrandProbe = () => (
  <span
    data-testid="brand-probe"
    style={{
      color: "var(--c--contextuals--border--semantic--brand--primary)",
    }}
  />
);
