// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { postMetadataType } from "@/shared/source";

import { PostRow } from "./post-row";

const post: postMetadataType = {
  description: "One-line summary",
  draft: false,
  lang: ["en"],
  published: new Date("2024-03-05T00:00:00Z"),
  title: "A Post",
  url: "/blog/a-post",
};

describe(PostRow, () => {
  it("keeps the row to title and date unless a description is asked for", () => {
    const { unmount } = render(<PostRow draftLabel="Draft" post={post} />);
    expect(screen.queryByText("One-line summary")).toBeNull();
    expect(screen.getByText("24. 03. 05.").tagName).toBe("TIME");
    unmount();

    render(<PostRow draftLabel="Draft" post={post} showDescription />);
    expect(screen.queryByText("One-line summary")).not.toBeNull();
  });

  it("names its link for the list that owns it", () => {
    render(<PostRow draftLabel="Draft" post={post} testId="home-post-link" />);

    expect(screen.getByTestId("home-post-link").getAttribute("href")).toBe(
      "/blog/a-post"
    );
  });
});
