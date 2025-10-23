import { notFound } from "next/navigation";

export default function NotFoundCatchAllPage() {
  notFound();

  return <></>;
}
