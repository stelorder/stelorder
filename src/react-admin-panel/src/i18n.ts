import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { getBaseUrl } from "./utils/url";

const loadNamespace = () => {
    const path = window.location.href;
    const pageRegexp = /^.*?#\/?([a-zA-Z]*?)\/?$/;
    const match = path.match(pageRegexp);
    if (match) {
        const page = match[1];
        console.log("page found:", page);
        if(page) return page;
    }
    return (window as typeof window & { wpApiSettings?: Record<string, string> }).wpApiSettings?.integration ? "welcome" : "home";
}

const ns = loadNamespace();

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["es", "en", "fr"],

    load: "languageOnly",

    ns,
    partialBundledLanguages: true,


    interpolation: {
      escapeValue: false, // No es necesario para React
    },

    backend: {
      loadPath: getBaseUrl("/assets/locales/{{lng}}/{{ns}}.json"),
    },

    detection: {
      order: ['navigator'],
      caches: []
    },
  });

export default i18n;