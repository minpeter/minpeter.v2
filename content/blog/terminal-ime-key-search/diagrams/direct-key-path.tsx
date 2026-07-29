import {
  DiagramFigure,
  DiagramFlow,
  FlowArrow,
  FlowStage,
  LossNote,
} from "./primitives";

export const DirectKeyPathDiagram = () => (
  <DiagramFigure
    description="PTY는 CSI-u 바이트를 보존하지만, Crossterm 0.29가 B=99를 공개 이벤트에 남기지 않으면 Atuin은 그 값을 사용할 수 없다."
    name="direct-key-path"
    title="직접 key event의 base-layout 정보가 사라지는 지점"
  >
    <DiagramFlow label="키릴 문자 직접 key event가 Atuin에 도착하는 경로">
      <FlowStage
        detail="Ctrl+с · U+0441"
        stage="keyboard-layout"
        title="OS / 키보드 배열"
      >
        <div className="mt-2 text-sm leading-snug text-foreground">
          PC-101 위치: c · U+0063
        </div>
        <div className="mt-1 font-mono text-sm text-foreground">
          K=1089 · B=99
        </div>
      </FlowStage>

      <FlowArrow label="터미널이 key event를 CSI-u로 직렬화" />

      <FlowStage
        detail="ESC[1089::99;5u"
        stage="terminal"
        title="터미널"
        tone="emphasis"
      >
        <div className="mt-2 text-sm leading-snug text-foreground">
          K와 B를 함께 인코딩
        </div>
      </FlowStage>

      <FlowArrow label="터미널이 escape sequence를 PTY에 기록" />

      <FlowStage detail="ESC[1089::99;5u" stage="pty" title="PTY bytes">
        <div className="mt-2 text-sm leading-snug text-foreground">
          byte stream을 그대로 운반
        </div>
      </FlowStage>

      <FlowArrow label="Crossterm이 CSI-u bytes를 파싱" />

      <FlowStage
        detail="code='с' · modifiers=Ctrl"
        stage="crossterm"
        title="Crossterm parser"
        tone="loss"
      >
        <LossNote>base-layout B=99를 공개 KeyEvent에 노출하지 않음</LossNote>
      </FlowStage>

      <FlowArrow label="Crossterm KeyEvent가 Atuin에 전달" />

      <FlowStage detail="'с' + Ctrl" stage="atuin" title="Atuin">
        <div className="mt-2 text-sm font-medium leading-snug text-foreground">
          B=99는 보이지 않음
        </div>
      </FlowStage>
    </DiagramFlow>
  </DiagramFigure>
);
