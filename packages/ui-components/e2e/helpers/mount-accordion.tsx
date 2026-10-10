import { CunninghamProvider } from "../../src/components/provider/Provider";
import {
  Accordion,
  AccordionItem,
} from "../../src/components/accordion/Accordion";

export const TestAccordion = () => (
  <CunninghamProvider>
    <div style={{ padding: "1rem" }}>
      <button>Before accordion</button>
      <Accordion data-testid="accordion">
        <AccordionItem id="a" title="Alpha">
          <button>Inside Alpha</button>
        </AccordionItem>
        <AccordionItem id="b" title="Bravo">
          <button>Inside Bravo</button>
        </AccordionItem>
        <AccordionItem id="c" title="Charlie">
          <button>Inside Charlie</button>
        </AccordionItem>
      </Accordion>
      <button>After accordion</button>
    </div>
  </CunninghamProvider>
);
