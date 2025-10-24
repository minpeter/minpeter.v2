import { notFound } from "next/navigation";
import { Suspense } from "react";

function NotFoundTrigger(): null {
  notFound();
  return null;
}

export default function NotFoundCatchAllPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundTrigger />
    </Suspense>
  );
}
