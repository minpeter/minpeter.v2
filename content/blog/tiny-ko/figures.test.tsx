// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  BenchmarkFigure,
  CorpusFigure,
  EvalMethodFigure,
  LineageFigure,
  ModelBlueprintFigure,
} from "./evidence-figures";
import {
  ConfigDiffFigure,
  MuonCurvesFigure,
  PretrainingRunsFigure,
  RunLedgerFigure,
  SftLadderFigure,
  SftLossFigure,
  V2StaircaseFigure,
} from "./training-figures";
import {
  EvalBenchFigure,
  EvalPplFigure,
  EvalVerdictFigure,
  SftPenaltyFigure,
} from "./eval-figures";

vi.mock(import("./figures.module.css"), () => ({
  default: new Proxy<Record<string, string>>(
    {},
    { get: (_target, property) => String(property) }
  ),
}));

describe("tiny-ko evidence figures", () => {
  it("renders both quantitative charts with accessible names", () => {
    render(
      <>
        <PretrainingRunsFigure />
        <SftLossFigure />
      </>
    );

    expect(
      screen.getByRole("group", {
        name: /^tiny-ko 사전학습 런의 평가 정확도 곡선/u,
      })
    ).toBeTruthy();
    expect(
      screen.getByRole("group", { name: /^tiny-ko SFT 학습 및 검증 손실/u })
    ).toBeTruthy();
    expect(screen.getByText("v4 · 60.02%")).toBeTruthy();
    expect(screen.getByText("검증 1.5297")).toBeTruthy();
    expect(
      screen
        .getAllByRole("link")
        .every(
          (link) =>
            link.getAttribute("target") === "_blank" &&
            link.getAttribute("rel") === "noreferrer noopener"
        )
    ).toBeTruthy();
  });

  it("keeps architecture and corpus evidence semantic", () => {
    render(
      <>
        <ModelBlueprintFigure />
        <CorpusFigure />
      </>
    );

    expect(
      screen.getByRole("group", { name: "tiny-ko-base 모델 구조" })
    ).toBeTruthy();
    expect(screen.getByText("124,635,456")).toBeTruthy();
    expect(screen.getByText("7,270,628")).toBeTruthy();
    expect(
      screen.getByText("PARAMETERS").parentElement?.firstElementChild?.tagName
    ).toBe("DT");
    expect(
      screen
        .getByRole("link", { name: /W&B · v5 run config/u })
        .getAttribute("href")
    ).toBe(
      "https://api.wandb.ai/files/kasfiekfs-e/huggingface/3qngrf8o/config.yaml"
    );
  });

  it("selects a pretraining run directly on its accuracy curve", () => {
    const { container } = render(<PretrainingRunsFigure />);

    expect(container.querySelectorAll("path[data-curve]")).toHaveLength(4);

    const v5Curve = screen.getByRole("button", { name: /^v5 curve/u });
    fireEvent.focus(v5Curve);

    expect(v5Curve.getAttribute("aria-pressed")).toBe("true");
    const readout = screen.getByText(/selected run/iu, {
      selector: "output",
    }).textContent;
    expect(readout).toContain("49.28%");
    expect(readout).toContain("114,475");
  });

  it("selects a pretraining curve from the keyboard", () => {
    render(<PretrainingRunsFigure />);

    const run20m = screen.getByRole("button", { name: /^20M 영\/한 curve/u });
    fireEvent.keyDown(run20m, { key: "Enter" });

    expect(run20m.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByText(/selected run/iu, { selector: "output" }).textContent
    ).toContain("36.23%");
  });

  it("draws the real logged SFT training curve behind the checkpoints", () => {
    const { container } = render(<SftLossFigure />);

    const trainPath = container.querySelector('path[data-series="training"]');
    expect(trainPath).not.toBeNull();
    expect(
      trainPath?.getAttribute("d")?.split("L").length
    ).toBeGreaterThan(50);
  });

  it("scrubs the SFT loss chart directly on the chart surface", () => {
    render(<SftLossFigure />);

    const checkpoint = screen.getByRole("button", { name: /^600 steps?/u });
    expect(checkpoint.closest("svg")).not.toBeNull();

    fireEvent.mouseEnter(checkpoint);

    expect(checkpoint.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByText(/selected checkpoint/iu, { selector: "output" })
        .textContent
    ).toContain("600");
    expect(
      screen.getByText(/selected checkpoint/iu, { selector: "output" })
        .textContent
    ).toContain("1.5146");

    fireEvent.keyDown(checkpoint, { key: " " });

    expect(
      screen.getByText(/selected checkpoint/iu, { selector: "output" })
        .textContent
    ).toContain("1.5392");
  });

  it("renders the v4 SFT ladder with direct targets", () => {
    render(<SftLadderFigure />);

    const v68 = screen.getByRole("button", { name: /^v4 68k base/u });
    fireEvent.mouseEnter(v68);

    expect(v68.getAttribute("aria-pressed")).toBe("true");
    const readout = screen.getByText(/selected SFT run/iu, {
      selector: "output",
    }).textContent;
    expect(readout).toContain("1.4286");
    expect(readout).toContain("2,972");
  });

  it("defaults the SFT ladder readout to the v4-1 rerun", () => {
    render(<SftLadderFigure />);

    const readout = screen.getByText(/selected SFT run/iu, {
      selector: "output",
    }).textContent;
    expect(readout).toContain("v4-1 122k");
    expect(readout).toContain("1.1718");
  });

  it("compares AdamW and Muon directly on the loss curves", () => {
    render(<MuonCurvesFigure />);

    const muon = screen.getByRole("button", { name: /^124M · Muon curve/u });
    fireEvent.focus(muon);

    expect(muon.getAttribute("aria-pressed")).toBe("true");
    const readout = screen.getByText(/selected run/iu, {
      selector: "output",
    }).textContent;
    expect(readout).toContain("2.7239");
    expect(readout).toContain("18.2h");
  });

  it("renders the run ledger with wall-clock hours", () => {
    render(<RunLedgerFigure />);

    expect(screen.getAllByRole("row")).toHaveLength(10);
    expect(screen.getByText("93.5h")).toBeTruthy();
    expect(screen.getByText("18.2h")).toBeTruthy();
  });

  it("shows log-derived token totals for finished runs in the ledger", () => {
    render(<RunLedgerFigure />);

    expect(screen.getByText("≈30.0B")).toBeTruthy();
    expect(screen.getAllByText("≈29.8B")).toHaveLength(2);
    expect(screen.getByText("≈0.86B")).toBeTruthy();
  });

  it("renders the v2 streaming failure as an epoch staircase", () => {
    const { container } = render(<V2StaircaseFigure />);

    expect(
      screen.getByRole("img", { name: /v2.*epoch/u })
    ).toBeTruthy();
    const staircase = container.querySelector('path[data-series="epoch"]');
    expect(staircase).not.toBeNull();
    expect(staircase?.getAttribute("d")?.split("L").length).toBeGreaterThan(
      100
    );
  });

  it("renders the v2 to v5 config diff table", () => {
    render(<ConfigDiffFigure />);

    expect(screen.getAllByRole("row")).toHaveLength(5);
    expect(screen.getByText(/128,268/u)).toBeTruthy();
    expect(screen.getByText(/32,000/u)).toBeTruthy();
    expect(screen.getByText("648,000 steps")).toBeTruthy();
  });

  it("renders the held-out perplexity table with BPB columns", () => {
    render(<EvalPplFigure />);

    expect(screen.getAllByRole("row")).toHaveLength(9);
    expect(screen.getByText("15.89")).toBeTruthy();
    expect(screen.getByText("1.8884")).toBeTruthy();
    expect(screen.getByText("279.24")).toBeTruthy();
  });

  it("renders the corrected evaluation method summary", () => {
    render(<EvalMethodFigure />);

    expect(screen.getByText("fixed UTF-8 bytes")).toBeTruthy();
    expect(screen.getByText("balanced · macro-F1")).toBeTruthy();
  });

  it("renders the SFT penalty dumbbell chart", () => {
    const { container } = render(<SftPenaltyFigure />);

    expect(screen.getByRole("img", { name: /SFT/u })).toBeTruthy();
    expect(
      container.querySelectorAll('[data-kind="base"]')
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('[data-kind="sft"]')
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('[data-kind="connector"]')
    ).toHaveLength(3);
  });

  it("renders the KLUE benchmark table with random baselines", () => {
    render(<EvalBenchFigure />);

    expect(screen.getByText("53.6%")).toBeTruthy();
    expect(screen.getByText("52.5%")).toBeTruthy();
    expect(screen.getAllByText("14.3%")).toHaveLength(2);
    expect(screen.getAllByText("33.3%").length).toBeGreaterThanOrEqual(2);
  });

  it("renders the verification verdict table", () => {
    render(<EvalVerdictFigure />);

    expect(screen.getAllByRole("row")).toHaveLength(7);
    expect(screen.getAllByText("일치함")).toHaveLength(3);
    expect(screen.getAllByText("미확정")).toHaveLength(2);
    expect(screen.getByText("확인됨")).toBeTruthy();
  });

  it("surfaces the public upload and W&B lineage timeline", () => {
    render(<LineageFigure />);

    const timeline = screen.getByRole("list");
    expect(timeline.textContent).toContain("06.02");
    expect(timeline.textContent).toContain("tiny-ko-base");
    expect(timeline.textContent).toContain("07.25");
    expect(timeline.textContent).toContain("187M · 250725");
    expect(timeline.textContent).toContain("webtext / small / pico");
  });

  it("keeps benchmark and lineage evidence semantic", () => {
    const { container } = render(
      <>
        <BenchmarkFigure />
        <LineageFigure />
      </>
    );

    expect(container.querySelectorAll("figure")).toHaveLength(2);
    expect(
      screen.getByRole("table", { name: /tiny-ko 벤치마크 결과/u })
    ).toBeTruthy();
    expect(screen.getByText("0.2392")).toBeTruthy();
    expect(screen.getByText("187M · 250725")).toBeTruthy();
  });
});
