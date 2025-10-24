import { notFound } from "next/navigation";
import { Suspense } from "react";

function NotFoundContent() {
  notFound();
  return null;
}

export default function NotFoundCatchAllPage() {
  return (
    <Suspense fallback={<div />}>
      <NotFoundContent />
    </Suspense>
  );
}
