// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import Loading from "./loading";

test("renders show loading skeleton", () => {
  const { container } = render(<Loading />);
  expect(container.firstChild).toBeDefined();
});
