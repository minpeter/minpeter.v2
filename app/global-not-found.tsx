import { routing } from "@/shared/i18n/routing";

import "./globals.css";
import { RootDocument } from "./root-document";

export default function GlobalNotFound() {
  return (
    <RootDocument lang={routing.defaultLocale}>
      <section>
        404: I don&apos;t expect people to come here (if they bypass i18n by
        going through a proxy)
      </section>
    </RootDocument>
  );
}
