import { notFound } from "next/navigation";

export default async function NotFoundCatchAllPage() {
  "use cache";

  notFound();
}
