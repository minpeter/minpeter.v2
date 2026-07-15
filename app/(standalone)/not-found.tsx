import { NotFoundPage } from "@/components/not-found-page";
import { createMetadata } from "@/shared/utils/metadata";

export const metadata = createMetadata({
  description: "주소가 잘못되었거나 페이지가 이동했을 수 있습니다.",
  image: {
    alt: "minpeter | 404",
    url: "/og/not-found",
  },
  title: "minpeter | 404",
});

export default function NotFound() {
  return (
    <NotFoundPage
      backHref="/"
      backLabel="홈으로"
      description="주소가 잘못되었거나 페이지가 이동했을 수 있습니다."
      navigationLabel="404 페이지 탐색"
      showLanguageSelector={false}
      title="페이지를 찾을 수 없습니다"
    />
  );
}
