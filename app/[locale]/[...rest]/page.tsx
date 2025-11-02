import { notFound } from "next/navigation";

export default function CatchAllPage() {
  // Catching unknown routes
  // ref: https://next-intl.dev/docs/environments/error-files#catching-unknown-routes

  notFound();
}
