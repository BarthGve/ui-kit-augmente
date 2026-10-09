import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Checkbox } from "../../src/components/forms/checkbox";

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
      <span
        data-testid="brand-probe"
        style={{
          color: "var(--c--contextuals--border--semantic--brand--primary)",
        }}
      />
    </div>
  </CunninghamProvider>
);
