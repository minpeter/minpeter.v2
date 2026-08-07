import {
  DiagramFigure,
  DiagramFlow,
  FlowArrow,
  FlowStage,
  LossNote,
} from "./primitives";

export const ImeCompositionPathDiagram = () => (
  <DiagramFigure
    description="CSI-u는 터미널이 받은 이벤트를 표현할 수 있지만, IME가 먼저 소비한 g·i·t와 최종 commit의 관계를 복원하지 못한다."
    name="ime-composition-path"
    title="IME가 먼저 소비한 key event는 CSI-u에 들어오지 않는다"
  >
    <DiagramFlow label="g i t가 한글 IME에서 햣으로 조합되어 Atuin query가 되는 경로">
      <FlowStage
        detail="g · i · t"
        stage="constituent-keys"
        title="구성 key events"
      >
        <div className="mt-2 text-foreground text-sm leading-snug">
          사용자가 실제로 누른 키
        </div>
      </FlowStage>

      <FlowArrow label="입력기가 key events를 조합" />

      <FlowStage
        detail="ㅎ → 햐 → 햣"
        stage="ime"
        title="한글 IME composition"
        tone="loss"
      >
        <LossNote>
          g·i·t는 이 경계에서 소비되며 commit과 연결된 K/S/B/M/E가 남지 않음
        </LossNote>
      </FlowStage>

      <FlowArrow label="입력기가 최종 문자열을 commit" />

      <FlowStage
        detail={'CommitText("햣")'}
        stage="terminal"
        title="터미널"
        tone="emphasis"
      >
        <div className="mt-2 text-foreground text-sm leading-snug">
          key event가 아니라 committed text를 받음
        </div>
      </FlowStage>

      <FlowArrow label="터미널이 committed text를 PTY에 기록" />

      <FlowStage detail={'UTF-8 "햣"'} stage="pty" title="PTY bytes">
        <div className="mt-2 text-foreground text-sm leading-snug">
          최종 text byte stream만 운반
        </div>
      </FlowStage>

      <FlowArrow label="Crossterm이 UTF-8 text를 문자 이벤트로 해석" />

      <FlowStage
        detail={"Char('햣')"}
        stage="crossterm"
        title="Crossterm parser"
      />

      <FlowArrow label="문자 이벤트가 검색 query에 입력" />

      <FlowStage detail="햣" stage="atuin" title="Atuin query" />
    </DiagramFlow>
  </DiagramFigure>
);
