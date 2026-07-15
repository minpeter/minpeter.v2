import { createMetadata } from "@/shared/utils/metadata";

export const metadata = createMetadata({
  description: "Page not found :/",
  image: {
    alt: "minpeter | 404",
    url: "/og/not-found",
  },
  title: "minpeter | 404",
});

export default function NotFound() {
  return (
    <div>
      <section>
        404: I don&apos;t expect people to come here (if they bypass i18n by
        going through a proxy)
      </section>
    </div>
  );
}
