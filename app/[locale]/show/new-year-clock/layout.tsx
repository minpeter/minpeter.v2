import type { Metadata } from "next";
import type { ReactNode } from "react";

import NewMetadata from "@/shared/utils/metadata";

interface Props {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return NewMetadata({
    description: "A live countdown to the next year.",
    locale,
    path: "/show/new-year-clock",
    title: "minpeter | new year clock",
  });
}

export default function NewYearClockLayout({ children }: Readonly<Props>) {
  return children;
}
