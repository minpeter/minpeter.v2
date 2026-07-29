import { DiagramFigure, FieldCard } from "./primitives";

export const CsiUAnatomyDiagram = () => (
  <DiagramFigure
    description="CSI-u는 받은 키, modifier, event 종류와 생성된 text를 서로 다른 필드로 표현한다."
    name="csi-u-anatomy"
    title="CSI-u 필드 구조"
  >
    <div
      aria-label="CSI-u 시퀀스의 CSI, 키, modifier와 event, associated text, final byte 필드"
      className="grid grid-cols-2 gap-2 sm:grid-cols-[0.8fr_1.5fr_1.1fr_1fr_0.6fr]"
      role="img"
    >
      <FieldCard field="csi" value="ESC [">
        CSI · 1B 5B
      </FieldCard>
      <FieldCard field="key" value="K : S : B">
        현재 키 · Shift 결과 · PC-101 위치
      </FieldCard>
      <FieldCard field="modifier-event" value="M : E">
        modifier · press/repeat/release
      </FieldCard>
      <FieldCard field="text" value="T : T…">
        생성된 text code point
      </FieldCard>
      <FieldCard field="final-byte" value="u">
        final byte · 75
      </FieldCard>
    </div>

    <div className="my-3 flex items-center gap-2" aria-hidden="true">
      <div className="h-px flex-1 bg-foreground" />
      <div className="text-xs font-semibold text-foreground">
        Shift+A 공식 예시
      </div>
      <div className="h-px flex-1 bg-foreground" />
    </div>

    <div
      aria-label="Shift+A가 CSI-u에서 97, modifier 2, text 65로 분리되는 예"
      className="grid grid-cols-3 gap-2"
      role="img"
    >
      <FieldCard field="example-key" value="97">
        primary key · a
      </FieldCard>
      <FieldCard field="example-modifier" value="2">
        Shift
      </FieldCard>
      <FieldCard field="example-text" value="65">
        text · A
      </FieldCard>
    </div>

    <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-center font-mono text-sm text-foreground">
      ESC[97;2;65u · bytes 1B 5B 39 37 3B 32 3B 36 35 75
    </div>
  </DiagramFigure>
);
