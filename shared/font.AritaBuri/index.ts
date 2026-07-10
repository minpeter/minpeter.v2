import localFont from "next/font/local";

const AritaBuriLocalFont = localFont({
  display: "swap",
  fallback: ["system-ui", "arial"],
  preload: true,
  src: "./AritaBuriKR-Medium.ttf",
  variable: "--font-arita-buri",
});

export { AritaBuriLocalFont };
