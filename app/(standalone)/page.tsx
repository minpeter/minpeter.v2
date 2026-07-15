import { createMetadata } from "@/shared/utils/metadata";

export const metadata = createMetadata({
  description: "minpeter's personal website",
  locale: "ko",
  path: "/",
  title: "minpeter",
});

export default function Page() {
  return <div>hello?</div>;
}
