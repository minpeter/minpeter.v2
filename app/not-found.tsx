import { Suspense } from "react";

export default function NotFound() {
  return (
    <Suspense>
      <div>
        <section>
          404: I don&apos;t expect people to come here (if they bypass i18n by
          going through a proxy)
        </section>
      </div>
    </Suspense>
  );
}
