import { LOCALE_METADATA } from "@agent-native/core/client/i18n";
import { createToolkitI18nCatalog } from "@agent-native/toolkit/app/i18n";

import enUS from "./en-US";

const FA_IR = {
  code: "fa-IR",
  englishName: "Persian",
  nativeName: "فارسی",
  dir: "rtl",
} as const;

const locales = [...Object.values(LOCALE_METADATA), FA_IR];

export const i18nCatalog = createToolkitI18nCatalog({
  messages: enUS,
  locales,
  supportedLocales: locales.map((locale) => locale.code),
  localeLoaders: {
    "zh-CN": () => import("./zh-CN"),
    "zh-TW": () => import("./zh-TW"),
    "es-ES": () => import("./es-ES"),
    "fr-FR": () => import("./fr-FR"),
    "de-DE": () => import("./de-DE"),
    "ja-JP": () => import("./ja-JP"),
    "ko-KR": () => import("./ko-KR"),
    "pt-BR": () => import("./pt-BR"),
    "hi-IN": () => import("./hi-IN"),
    "ar-SA": () => import("./ar-SA"),
    "fa-IR": () => import("./fa-IR"),
  },
});
