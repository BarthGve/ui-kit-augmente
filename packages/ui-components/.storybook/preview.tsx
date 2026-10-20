import { CunninghamProvider } from "../src/components/provider/Provider";
import { Locales } from "../src/components/provider/Locales";
import { DirectionProvider } from "../src/components/direction";
import "./../src/index.scss";
import "./../src/styles/fonts.scss";
import "./../src/style-stories.scss";
import type { Preview } from "@storybook/react";
import { DocsContainer } from "@storybook/blocks";
import { I18nProvider } from "@react-aria/i18n";
import React from "react";
import {
  DEFAULT_THEME,
  getStorybookTheme,
  getThemeFromGlobals,
  THEMES,
} from "./theme";

const DocsWithTheme = (props) => {
  const globals = props.context.store.userGlobals.globals;
  const theme = getThemeFromGlobals(globals);
  return (
    <CunninghamProvider
      currentLocale={globals.locale ?? Locales.enUS}
      theme={theme}
    >
      <I18nProvider locale={globals.locale ?? Locales.enUS}>
        <DocsContainer {...props} theme={getStorybookTheme(theme)} />
      </I18nProvider>
    </CunninghamProvider>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Component theme",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: THEMES.map(({ value, title }) => ({ value, title })),
      },
    },
    locale: {
      description: "Component language",
      toolbar: {
        title: "Language",
        icon: "globe",
        dynamicTitle: true,
        items: [
          { value: Locales.enUS, title: "English" },
          { value: Locales.frFR, title: "Français" },
          { value: Locales.nlNL, title: "Nederlands" },
          { value: Locales.deDE, title: "Deutsch" },
          { value: Locales.esES, title: "Español" },
        ],
      },
    },
    direction: {
      description: "Reading direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        dynamicTitle: true,
        items: [
          { value: "ltr", title: "Left to right" },
          { value: "rtl", title: "Right to left" },
        ],
      },
    },
  },
  initialGlobals: {
    theme: DEFAULT_THEME,
    locale: Locales.enUS,
    direction: "ltr",
  },
  decorators: [
    (Story, context) => (
      <CunninghamProvider
        currentLocale={context.globals.locale ?? Locales.enUS}
        theme={getThemeFromGlobals(context.globals)}
      >
        <I18nProvider locale={context.globals.locale ?? Locales.enUS}>
          <DirectionProvider direction={context.globals.direction ?? "ltr"}>
            <div>
              <Story />
            </div>
          </DirectionProvider>
        </I18nProvider>
      </CunninghamProvider>
    ),
  ],
  parameters: {
    options: {
      storySort: {
        order: [
          "Getting Started",
          [
            "Installation",
            "First steps",
            "Theming",
            "Customization",
            "Colors",
            "Spacings",
            "Typography",
          ],
          "Components",
          "Migrating",
          "Misc",
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      container: DocsWithTheme,
    },
  },
};

export default preview;
