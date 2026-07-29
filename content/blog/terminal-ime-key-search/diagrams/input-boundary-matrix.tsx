import { DiagramFigure } from "./primitives";

const boundaryRows = [
  {
    examples: "일반 키릴 문자 배열",
    observer: "터미널이 key event를 받음",
    output: "CSI-u K/S/B를 PTY에 보낼 수 있음",
    path: "direct-key-event",
    recovery: "Crossterm이 B를 보존하면 활용 가능",
    title: "직접 key event",
  },
  {
    examples: "Windows TSF · macOS AppKit · X11 IBus",
    observer: "터미널 통합층이 key 또는 commit callback을 봄",
    output: "committed text와 선택적으로 forwarded key",
    path: "host-integrated-composition",
    recovery: "commit과 구성 키의 안정적인 연결은 없음",
    title: "호스트 통합 composition",
  },
  {
    examples: "Wayland input-method-v2",
    observer: "입력기가 터미널보다 먼저 key를 받음",
    output: "터미널에는 주로 committed text가 도착",
    path: "pre-terminal-grab",
    recovery: "compositor와 input method 협력 없이는 불가",
    title: "터미널 앞 keyboard grab",
  },
] as const;

const feasibilityRows = [
  {
    input: "cyrillic-direct",
    outcome: "base-layout metadata 활용 가능",
    title: "키릴 direct layout",
  },
  {
    input: "dubeolsik",
    outcome: "명시적 canonical alternate query만 가능",
    title: "두벌식 committed text",
  },
  {
    input: "candidate-ime",
    outcome: "committed text의 canonical inverse가 없음",
    title: "중국어 병음 · 일본어",
  },
] as const;

export const InputBoundaryMatrix = () => (
  <DiagramFigure
    description="같은 문자권이라도 key event가 어느 경계를 통과했는지에 따라 Atuin이 사용할 수 있는 정보와 해결 범위가 달라진다."
    name="input-boundary-matrix"
    title="입력 경계별로 남는 정보와 Atuin의 현실적인 범위"
  >
    <div className="grid gap-3" data-matrix="platform-boundaries">
      {boundaryRows.map((row) => (
        <article
          className="rounded-lg border border-border bg-background p-3"
          data-boundary={row.path}
          key={row.path}
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="text-sm font-semibold">{row.title}</div>
            <div className="text-sm text-foreground">{row.examples}</div>
          </div>
          <dl className="mt-3 grid gap-2 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold">누가 key를 보는가</dt>
              <dd className="mt-1 text-sm leading-snug">{row.observer}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold">PTY / Atuin에 도착</dt>
              <dd className="mt-1 text-sm leading-snug">{row.output}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold">provenance 복원</dt>
              <dd className="mt-1 text-sm leading-snug">{row.recovery}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>

    <div className="my-3 flex items-center gap-2" aria-hidden="true">
      <div className="h-px flex-1 bg-foreground" />
      <div className="text-xs font-semibold">Atuin에서 가능한 해석</div>
      <div className="h-px flex-1 bg-foreground" />
    </div>

    <div className="grid gap-2 sm:grid-cols-3" data-matrix="input-feasibility">
      {feasibilityRows.map((row) => (
        <div
          className="rounded-lg border border-border bg-background p-3 text-center"
          data-input={row.input}
          key={row.input}
        >
          <div className="text-sm font-semibold">{row.title}</div>
          <div className="mt-2 text-sm leading-snug">{row.outcome}</div>
        </div>
      ))}
    </div>
  </DiagramFigure>
);
