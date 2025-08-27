import Header from "@/components/header";
import type { Route } from "next";

export default async function NotFound({
  params,
}: {
  params?: { locale: "ko" | "en" };
}) {
  const locale = params?.locale ?? "ko";
  return (
    <section>
      <Header
        title="404"
        description="page not found :/"
        link={{ href: `/${locale}/blog` as Route, text: "글 목록으로" }}
      />
    </section>
  );
}
