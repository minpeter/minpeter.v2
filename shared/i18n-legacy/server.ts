import { createI18nServer } from "next-international/server";

export const { getI18n, getScopedI18n, getStaticParams } = createI18nServer({
  ko: () => import("./ko"),
  en: () => import("./en"),
});
