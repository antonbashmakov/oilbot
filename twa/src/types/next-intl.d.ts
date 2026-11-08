import messages from "../../messages/ru.json";

// Type-checked message keys and the app's only locale (TWA-03).
declare module "next-intl" {
  interface AppConfig {
    Locale: "ru";
    Messages: typeof messages;
  }
}
