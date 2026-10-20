import { CunninghamProvider } from "../../src/components/provider/Provider";
import { Button } from "../../src/components/button";
import { DropdownMenu } from "../../src/components/dropdown-menu";

export const FRENCH_LABELS = [
  { label: "Les personnes disposant du lien peuvent consulter ce document sans se connecter", value: "public" },
  { label: "Seules les personnes invitées peuvent y accéder", value: "restricted" },
  { label: "Organisation", value: "org" },
];

export const TestDropdown = ({ variant }: { variant?: "default" | "tiny" }) => (
  <CunninghamProvider currentLocale="en-US">
    <div style={{ padding: "1rem" }}>
      <DropdownMenu
        isOpen
        variant={variant}
        options={FRENCH_LABELS}
        selectedValues={["restricted"]}
      >
        <Button>Menu</Button>
      </DropdownMenu>
    </div>
  </CunninghamProvider>
);
