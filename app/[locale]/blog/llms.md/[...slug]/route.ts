import { notFound } from "next/navigation";
import { type NextRequest, NextResponse } from "next/server";

import { getLLMText } from "@/lib/get-llm-text";
import { blog } from "@/lib/source";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const page = blog.getPage(slug);

  if (!page) notFound();

  // Always return full content for individual blog posts
  const content = await getLLMText(page, true);

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  return blog.generateParams();
}
