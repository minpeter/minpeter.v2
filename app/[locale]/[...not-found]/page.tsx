import { notFound } from "next/navigation";

export default function NotFoundCatchAllPage() {
  "use cache";

  notFound();
}
