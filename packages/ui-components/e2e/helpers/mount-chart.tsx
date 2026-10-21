import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Chart } from "../../src/components/chart";

const DATA = [
  { month: "Jan", sales: 12, costs: 8 },
  { month: "Feb", sales: 18, costs: 9 },
  { month: "Mar", sales: 9, costs: 11 },
];

export const TestChart = ({ width = 600, type = "bar" }: { width?: number; type?: "bar" | "line" | "area" }) => (
  <CunninghamProvider>
    <div style={{ width }}>
      <Chart
        title="Monthly results"
        summary="Sales peak in February."
        type={type}
        data={DATA}
        xKey="month"
        series={[{ key: "sales", label: "Sales" }, { key: "costs", label: "Costs" }]}
      />
    </div>
  </CunninghamProvider>
);
