import localFont from "next/font/local";

/*
  -- ENGLISH FONTS --
*/
export const pally = localFont({
  src: [
    {
      path: "../assets/fonts/en/Pally/Pally-Regular.ttf",
    },
  ],
  variable: "--font-heading",
});

// FUNCTIONS
export function LangFont(locale: string): string {
  switch (locale) {
    case "en":
      return pally.className;
    default:
      return pally.className;
  }
}

export function LangDir(locale: string): string {
  switch (locale) {
    case "en":
      return "ltr";
    default:
      return "ltr";
  }
}
