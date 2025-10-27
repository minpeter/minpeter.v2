import type { Route } from "next";

import Header from "@/components/header";

export default function NotFound({
  params,
}: {
  params?: { locale: "ko" | "en" };
}) {
  const locale = params?.locale ?? "ko";
  return (
    <section>
      <Header
        description="page not found :/"
        link={{ href: `/${locale}/blog` as Route, text: "글 목록으로" }}
        title="404"
      />
    </section>
  );
}
