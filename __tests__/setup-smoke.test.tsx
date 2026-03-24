// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function HelloWorld() {
  return <div data-testid="hello">Hello World</div>;
}

describe("React rendering smoke test", () => {
  it("renders without crashing", () => {
    render(<HelloWorld />);
    expect(screen.getByTestId("hello")).toBeDefined();
    expect(screen.getByTestId("hello").textContent).toBe("Hello World");
  });
});
