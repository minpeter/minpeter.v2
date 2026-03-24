# Next.js 16.x 미사용 최신 기능 적용

## TL;DR

> **Quick Summary**: Next.js 16.2.1 + React 19.2.4 프로젝트에서 아직 활용하지 않는 최신 기능들(View Transitions, loading/error boundaries, cacheComponents/PPR, after() API, instrumentation, Navigation Hooks)을 체계적으로 도입하여 UX, 안정성, 관측성을 개선한다.
> 
> **Deliverables**:
> - View Transitions 통합 (crossfade + 블로그 제목 Shared Element + 접근성)
> - loading.tsx 스켈레톤 UI (블로그, show 라우트 그룹)
> - error.tsx 에러 바운더리 (locale 전체 + 블로그 포스트)
> - cacheComponents: true 활성화 (PPR)
> - after() API (API 라우트 + Server Action 로깅)
> - instrumentation.ts (서버 관측성)
> - Navigation Hooks (타이핑 테스트 이탈 방지 + 링크 로딩 인디케이터)
> - 각 기능별 TDD 테스트
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: T1(instrumentation) → T4(error.tsx) → T7(cacheComponents) → T10(View Transitions) → Final

---

## Context

### Original Request
Next.js 최신 버전에서 적용할 수 있는 기술을 조사하고 적용 가치를 평가한 후 적용 계획을 세워달라.

### Interview Summary
**Key Discussions**:
- **적용 범위**: Tier 1 (높은 가치) + Tier 2 (중간 가치) 전체
- **cacheComponents**: 심층 분석 완료 — 코드 변경 없이 안전하게 활성화 가능. 단, `getTranslations()`와 `use cache` 비호환 → `use cache` 디렉티브는 번역 호출 없는 순수 데이터 함수에만 적용
- **View Transitions**: Level 1(crossfade) + Level 2(Shared Element) 적용. `experimental.viewTransition: true` + `<ViewTransition>` 컴포넌트
- **테스트 전략**: TDD 포함 — Vitest 4.1.1 인프라 활용

**Research Findings**:
- cacheComponents: true는 기존 `generateStaticParams` 패턴과 호환 (verified)
- View Transitions: Baseline 2025 (85%+ 브라우저 지원), graceful degradation
- `getTranslations()`가 내부적으로 `headers()` 호출 → `use cache` 스코프 내 사용 불가
- `after()`는 정적 페이지에서 빌드 타임에만 실행 → API 라우트/Server Action에만 적용
- `generateStaticParams`가 `params`를 동기적으로 받는 패턴 확인 → cacheComponents와 호환

### Metis Review
**Identified Gaps** (addressed):
- **`getTranslations()` + `use cache` 비호환**: `use cache`를 번역 호출 없는 순수 데이터 함수에만 적용하도록 스코프 제한
- **`after()` 정적 페이지 제한**: API 라우트와 Server Action에만 적용, 블로그 페이지에는 미적용
- **`onNavigate` 한계**: `<Link>` 클릭만 방지, 브라우저 뒤로가기/닫기는 `beforeunload` 보완
- **View Transitions + 다크모드**: `flushSync` 패턴 필수 (pitfall 문서화)
- **error.tsx `"use client"` 필수**: 에러 바운더리는 반드시 클라이언트 컴포넌트
- **Vitest `environment: 'node'` vs React 컴포넌트 테스트**: 파일별 `// @vitest-environment jsdom` 사용

---

## Work Objectives

### Core Objective
Next.js 16.x의 미활용 최신 기능들을 안전하게 도입하여 UX(View Transitions, loading states), 안정성(error boundaries), 관측성(instrumentation, after()), 성능(PPR/cacheComponents)을 개선한다.

### Concrete Deliverables
- `next.config.ts`: `cacheComponents: true`, `experimental.viewTransition: true` 추가
- `instrumentation.ts`: 서버 관측성 + `onRequestError` 에러 리포팅
- `app/[locale]/error.tsx`: 로케일 전체 에러 바운더리
- `app/[locale]/blog/[...slug]/error.tsx`: 블로그 포스트 에러 바운더리
- `app/[locale]/blog/loading.tsx`: 블로그 목록 스켈레톤
- `app/[locale]/blog/[...slug]/loading.tsx`: 블로그 포스트 스켈레톤
- `app/[locale]/show/loading.tsx`: 쇼케이스 스켈레톤
- View Transitions CSS + `<ViewTransition>` 컴포넌트 통합
- `after()` API 통합 (API 라우트, Server Action)
- Navigation Hooks 통합 (타이핑 테스트 이탈 방지)
- 각 기능별 Vitest 테스트

### Definition of Done
- [ ] `pnpm build` 성공, 에러 없음
- [ ] `pnpm check:types` (tsc --noEmit) 통과
- [ ] `pnpm test` 전체 통과
- [ ] 모든 페이지 정상 렌더링 확인 (Playwright)
- [ ] View Transitions 크로스페이드 동작 확인
- [ ] 에러 바운더리 트리거 시 복구 UI 표시 확인
- [ ] loading.tsx 스켈레톤 표시 확인

### Must Have
- `prefers-reduced-motion` 미디어 쿼리로 View Transitions 비활성화
- error.tsx에 "다시 시도" / "홈으로" 복구 버튼
- `after()` 콜백이 응답 시간에 영향 없음 확인
- cacheComponents 활성화 전후 빌드 출력 비교

### Must NOT Have (Guardrails)
- `getTranslations()` 호출하는 컴포넌트/페이지에 `"use cache"` 디렉티브 사용 금지
- `after()`를 정적 생성 블로그 페이지에 적용 금지 (빌드 타임에만 실행됨)
- `proxy.ts` (기존 middleware 패턴) 변경 금지
- `export const dynamic` 또는 `export const revalidate` 추가 금지 (cacheComponents와 무관)
- loading.tsx를 `[locale]/` 루트에 추가 금지 (홈페이지는 `"use client"`로 인라인 로딩 처리)
- `global-error.tsx` 추가 금지 (명시적 요청 없음)
- `view-transition-name` 중복 사용 금지 (같은 페이지 내 유일해야 함)
- 기존 Suspense 패턴 변경 금지 (PPR이 자동으로 활용)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest 4.1.1)
- **Automated tests**: TDD (RED → GREEN → REFACTOR)
- **Framework**: Vitest with per-file `// @vitest-environment jsdom` for React component tests
- **Additional**: `@testing-library/react` 설치 필요 (React 컴포넌트 테스트용)

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **Build verification**: Use Bash — `pnpm build`, compare output
- **Config changes**: Use Bash — `pnpm check:types`, `pnpm test`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation, zero-risk new files):
├── Task 1: instrumentation.ts 서버 관측성 [quick]
├── Task 2: @testing-library/react 설치 + jsdom 환경 설정 [quick]
├── Task 3: View Transitions CSS + 접근성 기반 작업 [quick]

Wave 2 (After Wave 1 — error/loading boundaries):
├── Task 4: error.tsx 에러 바운더리 + 테스트 [unspecified-high]
├── Task 5: loading.tsx 스켈레톤 UI + 테스트 [visual-engineering]
├── Task 6: after() API 통합 + 테스트 [quick]

Wave 3 (After Wave 2 — config changes + component modifications):
├── Task 7: cacheComponents: true 활성화 + 빌드 검증 [deep]
├── Task 8: Navigation Hooks (onNavigate + useLinkStatus) + 테스트 [quick]

Wave 4 (After Wave 3 — View Transitions 컴포넌트 통합):
├── Task 9: View Transitions 기본 crossfade (layout.tsx ViewTransition 래핑) [quick]
├── Task 10: View Transitions Shared Element (블로그 제목 모핑) [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
├── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | — | T4 (error reporting) |
| T2 | — | T4, T5, T6, T8 |
| T3 | — | T9, T10 |
| T4 | T1, T2 | T7 |
| T5 | T2 | T7 |
| T6 | T2 | T7 |
| T7 | T4, T5, T6 | T9 |
| T8 | T2 | — |
| T9 | T3, T7 | T10 |
| T10 | T9 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 3 tasks — T1 `quick`, T2 `quick`, T3 `quick`
- **Wave 2**: 3 tasks — T4 `unspecified-high`, T5 `visual-engineering`, T6 `quick`
- **Wave 3**: 2 tasks — T7 `deep`, T8 `quick`
- **Wave 4**: 2 tasks — T9 `quick`, T10 `visual-engineering`
- **FINAL**: 4 tasks — F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [x] 1. instrumentation.ts 서버 관측성 설정

  **What to do**:
  - TDD: `instrumentation.test.ts` 작성 — `register()` 함수가 export되는지, `onRequestError` 콜백이 에러 객체를 받아 로깅하는지 테스트
  - 프로젝트 루트에 `instrumentation.ts` 생성
  - `register()` 함수: 서버 시작 시 초기화 로깅 (`console.info('[instrumentation] Server initialized')`)
  - `onRequestError()` 함수: 에러 발생 시 구조화된 로깅 (에러 메시지, 요청 경로, 컨텍스트)
  - 최소한의 구현 — OpenTelemetry 등 복잡한 SDK 추가하지 않음

  **Must NOT do**:
  - OpenTelemetry, Sentry 등 외부 SDK 추가 금지
  - `src/` 디렉토리에 파일 생성 금지 (프로젝트 루트에 배치)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 단일 파일 생성 + 간단한 export 함수 구현
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 서버 사이드 관측성이므로 브라우저 테스트 불필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4 (error.tsx에서 onRequestError와 연동)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `app/api/search/route.test.ts` — 기존 Vitest 테스트 패턴 참조 (assertion style, describe/it 구조)
  - `proxy.test.ts` — 프로젝트 루트 레벨 테스트 파일 패턴

  **API/Type References**:
  - Next.js `instrumentation.ts` 공식 API: `export async function register()` + `export async function onRequestError(err, request, context)`

  **External References**:
  - 공식 문서: https://nextjs.org/docs/app/guides/instrumentation

  **WHY Each Reference Matters**:
  - `route.test.ts`: Vitest assertion 스타일(expect, describe)과 환경 설정 패턴을 복사하기 위해
  - 공식 문서: `onRequestError`의 정확한 시그니처와 `context` 객체 구조 확인

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test file created: `instrumentation.test.ts`
  - [ ] `pnpm test instrumentation.test.ts` → PASS

  **QA Scenarios:**

  ```
  Scenario: instrumentation.ts가 올바르게 export하는지 확인
    Tool: Bash (pnpm test)
    Preconditions: instrumentation.ts 파일이 프로젝트 루트에 존재
    Steps:
      1. `pnpm test instrumentation.test.ts` 실행
      2. register()와 onRequestError() 함수가 export되는지 assertion 확인
    Expected Result: 모든 테스트 PASS
    Failure Indicators: "FAIL" 또는 "export not found" 에러
    Evidence: .sisyphus/evidence/task-1-instrumentation-test.txt

  Scenario: 빌드 성공 확인
    Tool: Bash
    Preconditions: instrumentation.ts 추가 후
    Steps:
      1. `pnpm build 2>&1 | tail -20` 실행
      2. 빌드 에러 없음 확인
    Expected Result: "✓ Compiled successfully" 또는 동등한 성공 메시지
    Failure Indicators: "Error:", "Failed to compile"
    Evidence: .sisyphus/evidence/task-1-build-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(infra): add instrumentation.ts for server observability`
  - Files: `instrumentation.ts`, `instrumentation.test.ts`
  - Pre-commit: `pnpm test instrumentation.test.ts`

- [x] 2. 테스트 인프라 확장 — @testing-library/react + jsdom 설정

  **What to do**:
  - `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` devDependency 설치
  - `vitest.config.ts`에서 React 컴포넌트 테스트를 위한 설정 확인/업데이트
  - 파일별 `// @vitest-environment jsdom` 주석으로 환경 전환 가능하도록 문서화
  - 간단한 스모크 테스트 작성: React 컴포넌트 렌더링 확인

  **Must NOT do**:
  - 기존 `environment: 'node'` 설정 변경 금지 (기존 테스트 깨질 수 있음)
  - 글로벌 jsdom 환경으로 전환 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 패키지 설치 + 설정 파일 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4, 5, 6, 8 (React 컴포넌트 테스트 의존)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `vitest.config.ts` — 현재 Vitest 설정 (environment: 'node', vite-tsconfig-paths)
  - `package.json` — 현재 devDependencies 구성

  **External References**:
  - Vitest 환경 설정: https://vitest.dev/guide/environment.html

  **WHY Each Reference Matters**:
  - `vitest.config.ts`: 기존 설정을 깨뜨리지 않으면서 jsdom 환경을 파일별로 사용할 수 있게 확장

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Smoke test file created: `__tests__/setup-smoke.test.tsx`
  - [ ] `pnpm test __tests__/setup-smoke.test.tsx` → PASS

  **QA Scenarios:**

  ```
  Scenario: @testing-library/react + jsdom 설치 확인
    Tool: Bash
    Preconditions: pnpm install 완료
    Steps:
      1. `pnpm list @testing-library/react jsdom` 실행
      2. 두 패키지 모두 버전 출력 확인
    Expected Result: @testing-library/react 및 jsdom 버전 출력
    Failure Indicators: "ERR_PNPM_NO_MATCHING_VERSION" 또는 패키지 미존재
    Evidence: .sisyphus/evidence/task-2-pkg-installed.txt

  Scenario: jsdom 환경에서 React 렌더링 스모크 테스트
    Tool: Bash
    Preconditions: @testing-library/react 설치됨
    Steps:
      1. `pnpm test __tests__/setup-smoke.test.tsx` 실행
      2. React 컴포넌트 렌더링 성공 확인
    Expected Result: PASS — "renders without crashing"
    Failure Indicators: "FAIL", "ReferenceError: document is not defined"
    Evidence: .sisyphus/evidence/task-2-smoke-test.txt
  ```

  **Commit**: YES
  - Message: `feat(test): add @testing-library/react, jsdom and test config`
  - Files: `package.json`, `pnpm-lock.yaml`, `__tests__/setup-smoke.test.tsx`
  - Pre-commit: `pnpm test`

- [x] 3. View Transitions CSS 기반 작업 + 접근성

  **What to do**:
  - TDD: CSS가 올바르게 포함되는지 확인하는 테스트 (파일 존재 + 내용 검증)
  - `app/globals.css`에 View Transitions 기반 CSS 추가:
    - 기본 crossfade 애니메이션 속도 설정 (`::view-transition-old(root)`, `::view-transition-new(root)`)
    - `@media (prefers-reduced-motion: reduce)` 핸들러 — 모든 transition 비활성화
    - Shared Element transition용 기본 스타일 (blog title morph)
    - `transitionTypes` 기반 방향 슬라이드 CSS (`slide-forward`, `slide-back`)
    - `@keyframes` 정의 (slide-out-left, slide-in-right, slide-out-right, slide-in-left)
  - `next.config.ts`에 `experimental.viewTransition: true` 추가

  **Must NOT do**:
  - `<ViewTransition>` 컴포넌트는 아직 추가하지 않음 (Task 9, 10에서 추가)
  - 기존 CSS 변수/테마 변경 금지
  - 기존 애니메이션 (stagger-fade-in 등) 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: CSS 추가 + config 수정
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 9, 10 (View Transitions 컴포넌트 통합)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `app/globals.css` — 현재 Tailwind v4 설정, 테마 변수, 기존 애니메이션 패턴 확인
  - `next.config.ts:12-23` — 현재 experimental 설정 블록 (추가할 위치)

  **External References**:
  - MDN view-transition-name: https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name
  - Vercel 예제: https://github.com/vercel/next-view-transition-example

  **WHY Each Reference Matters**:
  - `globals.css`: 기존 CSS 구조를 존중하며 View Transition 스타일 삽입 위치 결정
  - `next.config.ts`: experimental 블록 내 정확한 위치에 플래그 추가

  **Acceptance Criteria**:

  **TDD:**
  - [ ] CSS 내용 검증 테스트 작성
  - [ ] `pnpm check:types` → PASS (config 변경 후)

  **QA Scenarios:**

  ```
  Scenario: View Transitions CSS가 globals.css에 포함됨
    Tool: Bash (grep)
    Preconditions: globals.css 수정됨
    Steps:
      1. `grep "view-transition" app/globals.css` 실행
      2. `grep "prefers-reduced-motion" app/globals.css` 실행
    Expected Result: 두 grep 모두 매칭되는 줄 출력
    Failure Indicators: 빈 출력 (매칭 없음)
    Evidence: .sisyphus/evidence/task-3-css-verify.txt

  Scenario: next.config.ts에 viewTransition 플래그 존재
    Tool: Bash (grep)
    Preconditions: next.config.ts 수정됨
    Steps:
      1. `grep "viewTransition" next.config.ts` 실행
    Expected Result: `viewTransition: true` 출력
    Failure Indicators: 빈 출력
    Evidence: .sisyphus/evidence/task-3-config-verify.txt

  Scenario: 빌드 성공
    Tool: Bash
    Steps:
      1. `pnpm build 2>&1 | tail -20` 실행
    Expected Result: 빌드 성공
    Failure Indicators: 에러 메시지
    Evidence: .sisyphus/evidence/task-3-build.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add view transitions CSS foundation with a11y`
  - Files: `app/globals.css`, `next.config.ts`
  - Pre-commit: `pnpm check:types`

- [x] 4. error.tsx 에러 바운더리 + 테스트

  **What to do**:
  - TDD: 에러 바운더리 컴포넌트가 에러 메시지와 복구 버튼을 렌더링하는지 테스트 (jsdom 환경)
  - `app/[locale]/error.tsx` 생성 — 로케일 전체 catch-all 에러 바운더리
    - `"use client"` 필수
    - `error.message` 표시 (dev 환경에서만 상세)
    - "다시 시도" 버튼 (`reset()` 콜백 호출)
    - "홈으로 돌아가기" 링크
    - 기존 디자인 시스템 (Tailwind 클래스, 기존 스타일) 따르기
  - `app/[locale]/blog/[...slug]/error.tsx` 생성 — 블로그 포스트 전용 에러 바운더리
    - 블로그 목록으로 돌아가는 링크 포함
  - 에러 발생 시 `console.error`로 로깅 (instrumentation.ts의 onRequestError와 보완적)

  **Must NOT do**:
  - `global-error.tsx` 생성 금지
  - error.tsx를 서버 컴포넌트로 만들기 금지 (`"use client"` 필수)
  - 외부 에러 트래킹 SDK (Sentry 등) 추가 금지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 에러 바운더리 패턴 + React 컴포넌트 테스트 + UX 고려
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 7 (cacheComponents 활성화 전 에러 핸들링 필요)
  - **Blocked By**: Task 1 (instrumentation), Task 2 (test infra)

  **References**:

  **Pattern References**:
  - `app/[locale]/not-found.tsx` — 기존 에러 페이지 UI 패턴 (스타일, 레이아웃)
  - `app/[locale]/blog/[...slug]/not-found.tsx` — 블로그 전용 에러 페이지 패턴
  - `components/header.tsx` — Header 컴포넌트 API (link prop 패턴)

  **API/Type References**:
  - Next.js error.tsx 시그니처: `export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void })`

  **External References**:
  - 공식 문서: https://nextjs.org/docs/app/api-reference/file-conventions/error

  **WHY Each Reference Matters**:
  - `not-found.tsx`: 동일한 시각적 패턴으로 error.tsx를 만들어 UI 일관성 유지
  - 공식 문서: `error` 객체의 `digest` 프로퍼티와 `reset` 함수의 정확한 동작 확인

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test files created: `app/[locale]/__tests__/error.test.tsx`, `app/[locale]/blog/[...slug]/__tests__/error.test.tsx`
  - [ ] `pnpm test error.test` → PASS

  **QA Scenarios:**

  ```
  Scenario: error.tsx가 에러 메시지와 복구 버튼을 렌더링
    Tool: Bash (pnpm test)
    Preconditions: @testing-library/react 설치됨, error.tsx 파일 존재
    Steps:
      1. `pnpm test error.test` 실행
      2. "renders error message" 테스트 PASS 확인
      3. "reset button calls reset callback" 테스트 PASS 확인
    Expected Result: 모든 에러 바운더리 테스트 PASS
    Failure Indicators: "FAIL"
    Evidence: .sisyphus/evidence/task-4-error-test.txt

  Scenario: error.tsx 파일이 올바른 위치에 존재
    Tool: Bash
    Steps:
      1. `ls 'app/[locale]/error.tsx' 'app/[locale]/blog/[...slug]/error.tsx'` 실행
    Expected Result: 두 파일 모두 존재
    Failure Indicators: "No such file"
    Evidence: .sisyphus/evidence/task-4-files-exist.txt

  Scenario: error.tsx가 "use client" 디렉티브 포함
    Tool: Bash (grep)
    Steps:
      1. `head -1 'app/[locale]/error.tsx'` 실행
    Expected Result: `"use client"` 출력
    Failure Indicators: 다른 내용
    Evidence: .sisyphus/evidence/task-4-use-client.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add error.tsx boundaries with recovery UI`
  - Files: `app/[locale]/error.tsx`, `app/[locale]/blog/[...slug]/error.tsx`, test files
  - Pre-commit: `pnpm test error.test`

- [x] 5. loading.tsx 스켈레톤 UI + 테스트

  **What to do**:
  - TDD: 스켈레톤 컴포넌트가 올바른 DOM 구조를 렌더링하는지 테스트 (jsdom 환경)
  - `app/[locale]/blog/loading.tsx` — 블로그 목록 스켈레톤
    - 기존 `BlogListFallback` 컴포넌트 패턴 참고하되, `loading.tsx` 규격으로 재구현
    - 기존 `Skeleton` UI 컴포넌트 (`components/ui/skeleton.tsx`) 활용
    - 블로그 카드 3-5개의 반복 스켈레톤
  - `app/[locale]/blog/[...slug]/loading.tsx` — 블로그 포스트 스켈레톤
    - 제목 스켈레톤 (h1 크기)
    - 날짜/설명 스켈레톤 (작은 텍스트)
    - 본문 영역 스켈레톤 (여러 줄 텍스트)
  - `app/[locale]/show/loading.tsx` — 쇼케이스 스켈레톤
    - 그리드 레이아웃의 카드 스켈레톤

  **Must NOT do**:
  - `app/[locale]/loading.tsx` (루트) 추가 금지 — 홈페이지는 `"use client"`로 인라인 로딩 처리
  - `app/[locale]/typing/loading.tsx` 추가 금지 — 타이핑 페이지는 자체 로딩 처리
  - 기존 `BlogListFallback` 컴포넌트 수정/삭제 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: 스켈레톤 UI는 시각적 결과물이 중요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2 (test infra)

  **References**:

  **Pattern References**:
  - `app/[locale]/blog/list.tsx:BlogListFallback` — 기존 블로그 목록 fallback UI (스타일, 구조 참고)
  - `components/ui/skeleton.tsx` — 기존 Skeleton 컴포넌트 API
  - `components/header.tsx` — Header 컴포넌트 높이/레이아웃 (스켈레톤에서 매칭)

  **API/Type References**:
  - Next.js loading.tsx: `export default function Loading()` — props 없음, React 컴포넌트

  **External References**:
  - 공식 문서: https://nextjs.org/docs/app/api-reference/file-conventions/loading

  **WHY Each Reference Matters**:
  - `BlogListFallback`: 이미 블로그 목록의 fallback UI를 정의해놓음 — loading.tsx가 동일한 레이아웃을 써야 시각적 일관성 유지
  - `skeleton.tsx`: 기존 프로젝트의 Skeleton 컴포넌트를 재사용하여 스타일 통일

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Test files for each loading.tsx
  - [ ] `pnpm test loading.test` → PASS

  **QA Scenarios:**

  ```
  Scenario: loading.tsx 파일이 올바른 위치에 존재
    Tool: Bash
    Steps:
      1. `ls 'app/[locale]/blog/loading.tsx' 'app/[locale]/blog/[...slug]/loading.tsx' 'app/[locale]/show/loading.tsx'`
    Expected Result: 3개 파일 모두 존재
    Failure Indicators: "No such file"
    Evidence: .sisyphus/evidence/task-5-files-exist.txt

  Scenario: loading.tsx가 Skeleton 컴포넌트를 사용
    Tool: Bash (grep)
    Steps:
      1. `grep -rl "Skeleton" 'app/[locale]/blog/loading.tsx' 'app/[locale]/blog/[...slug]/loading.tsx' 'app/[locale]/show/loading.tsx'`
    Expected Result: 3개 파일 모두 매칭
    Failure Indicators: 매칭 없는 파일 존재
    Evidence: .sisyphus/evidence/task-5-skeleton-usage.txt

  Scenario: 빌드 성공 + 스켈레톤 렌더 테스트
    Tool: Bash
    Steps:
      1. `pnpm test loading.test` 실행
      2. `pnpm build 2>&1 | tail -20` 실행
    Expected Result: 테스트 PASS + 빌드 성공
    Failure Indicators: "FAIL" 또는 빌드 에러
    Evidence: .sisyphus/evidence/task-5-test-build.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add loading.tsx skeleton states`
  - Files: `app/[locale]/blog/loading.tsx`, `app/[locale]/blog/[...slug]/loading.tsx`, `app/[locale]/show/loading.tsx`, test files
  - Pre-commit: `pnpm test loading.test`

- [x] 6. after() API 통합 + 테스트

  **What to do**:
  - TDD: after() 콜백이 호출되는지 확인하는 테스트
  - `app/api/search/route.ts`에 `after()` 추가 — 검색 요청 후 검색어 로깅
    - `import { after } from 'next/server'`
    - 응답 반환 후 `after(() => { console.info('[search]', { query, locale, timestamp }) })` 실행
  - `app/[locale]/typing/action.ts`에 `after()` 추가 — AI 문장 생성 후 latency 로깅
    - 응답 반환 후 `after(() => { console.info('[typing-action]', { locale, duration, timestamp }) })` 실행
  - `app/[locale]/blog/rss.xml/route.ts`에 `after()` 추가 — RSS 요청 후 로깅

  **Must NOT do**:
  - 블로그 포스트 페이지에 `after()` 추가 금지 (정적 페이지 — 빌드 타임에만 실행됨)
  - `after()` 내에서 외부 API 호출 금지 (단순 console.info만)
  - 기존 라우트 핸들러의 반환값/로직 변경 금지

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 파일에 import + 함수 호출 추가
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 2 (test infra)

  **References**:

  **Pattern References**:
  - `app/api/search/route.ts` — 기존 검색 API 라우트 구조 (createFromSource 패턴)
  - `app/[locale]/typing/action.ts` — 기존 Server Action 구조 ("use server" + generateText)
  - `app/[locale]/blog/rss.xml/route.ts` — RSS 라우트 구조

  **API/Type References**:
  - `import { after } from 'next/server'` — after() 시그니처: `after(callback: () => void | Promise<void>): void`

  **External References**:
  - 공식 문서: https://nextjs.org/docs/app/api-reference/functions/after

  **WHY Each Reference Matters**:
  - 기존 라우트 파일: after() 호출을 삽입할 정확한 위치 파악 (응답 반환 전)
  - 공식 문서: after() 콜백의 실행 타이밍과 제약사항 (Serverless 환경에서의 동작)

  **Acceptance Criteria**:

  **TDD:**
  - [ ] after() 통합 테스트 작성
  - [ ] `pnpm test after.test` → PASS

  **QA Scenarios:**

  ```
  Scenario: after()가 API 라우트에 올바르게 통합됨
    Tool: Bash (grep)
    Preconditions: 라우트 파일 수정됨
    Steps:
      1. `grep -rl "after(" app/api/search/route.ts 'app/[locale]/typing/action.ts' 'app/[locale]/blog/rss.xml/route.ts'`
    Expected Result: 3개 파일 모두 매칭
    Failure Indicators: 매칭 없는 파일
    Evidence: .sisyphus/evidence/task-6-after-integration.txt

  Scenario: after() 콜백이 응답을 차단하지 않음 확인
    Tool: Bash (curl + dev server)
    Preconditions: `pnpm dev` 실행 중
    Steps:
      1. `curl -w "\n%{time_total}" -o /dev/null -s "http://localhost:3000/api/search?query=test&locale=ko"` 실행
      2. 응답 시간(time_total) 기록
      3. dev 서버 터미널에서 `[search]` 로그 메시지 출력 확인
      4. 응답 시간이 2초 미만인지 확인
    Expected Result: 응답 시간 < 2s, 서버 로그에 `[search]` 메시지 출력 (응답 이후)
    Failure Indicators: 응답 시간 > 5s (after 콜백이 응답을 차단), 서버 로그에 메시지 없음
    Evidence: .sisyphus/evidence/task-6-after-nonblocking.txt

  Scenario: 기존 테스트 깨지지 않음
    Tool: Bash
    Steps:
      1. `pnpm test` 실행
    Expected Result: 기존 + 신규 테스트 모두 PASS
    Failure Indicators: "FAIL" on any test
    Evidence: .sisyphus/evidence/task-6-all-tests.txt
  ```

  **Commit**: YES
  - Message: `feat(api): integrate after() for post-response logging`
  - Files: `app/api/search/route.ts`, `app/[locale]/typing/action.ts`, `app/[locale]/blog/rss.xml/route.ts`, test files
  - Pre-commit: `pnpm test`

- [x] 7. cacheComponents: true 활성화 + 빌드 검증

  **What to do**:
  - **사전 작업**: `pnpm build 2>&1` 출력을 파일로 저장 (before 스냅샷)
  - `next.config.ts` 수정: `cacheComponents: false` → `cacheComponents: true`
  - `pnpm build 2>&1` 다시 실행, 출력 저장 (after 스냅샷)
  - before/after 빌드 출력 비교 — 페이지 렌더링 모드(Static/Dynamic/PPR) 차이 확인
  - 모든 기존 테스트 통과 확인
  - 타입 체크 통과 확인
  - **주의**: `"use cache"` 디렉티브는 이 태스크에서 추가하지 않음 — PPR만 활성화

  **Must NOT do**:
  - `"use cache"` 디렉티브 추가 금지 (이 태스크는 설정 변경만)
  - `getTranslations()` 호출하는 파일에 어떤 캐싱 디렉티브도 추가 금지
  - `export const dynamic` 또는 `export const revalidate` 추가 금지
  - 기존 `generateStaticParams`, `generateMetadata` 수정 금지

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 빌드 출력 비교 분석 + 전체 프로젝트 영향 범위 파악 필요
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential — build comparison)
  - **Blocks**: Tasks 9, 10 (View Transitions는 cacheComponents 활성화 후)
  - **Blocked By**: Tasks 4, 5, 6

  **References**:

  **Pattern References**:
  - `next.config.ts:10` — `cacheComponents: false` (변경 대상)
  - `app/[locale]/blog/[...slug]/page.tsx:22-30` — generateStaticParams 패턴 (영향 확인)
  - `app/[locale]/blog/page.tsx:45-47` — Suspense 바운더리 (PPR 경계가 됨)

  **External References**:
  - 공식 문서: https://nextjs.org/docs/app/getting-started/cache-components

  **WHY Each Reference Matters**:
  - `next.config.ts`: 정확히 한 줄만 변경하면 됨
  - 기존 Suspense 패턴: cacheComponents 활성화 후 PPR 경계로 자동 전환되는지 확인

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: cacheComponents 변경 전후 빌드 성공 + 출력 비교
    Tool: Bash
    Steps:
      1. `pnpm build 2>&1 | tee .sisyphus/evidence/task-7-build-before.txt` (변경 전)
      2. next.config.ts 수정: cacheComponents: false → true
      3. `pnpm build 2>&1 | tee .sisyphus/evidence/task-7-build-after.txt` (변경 후)
      4. 두 파일 비교 — 에러 없음 확인
      5. 페이지 렌더링 모드 변경 여부 기록 (변경 있든 없든 문서화)
    Expected Result: 양쪽 모두 빌드 성공 (에러 0). Suspense 바운더리가 있는 페이지(blog list, home)가 PPR(◐) 표시로 변경될 수 있음 — 이는 정상 동작이며 에러가 아님. 기존 정적(○) 페이지가 동적(ƒ)으로 변경되면 regression으로 간주.
    Failure Indicators: "Error:", "Failed to compile", 또는 기존 정적 페이지가 동적으로 변경됨
    Evidence: .sisyphus/evidence/task-7-build-before.txt, .sisyphus/evidence/task-7-build-after.txt

  Scenario: 타입 체크 통과
    Tool: Bash
    Steps:
      1. `pnpm check:types` 실행
    Expected Result: 0 errors
    Failure Indicators: 타입 에러
    Evidence: .sisyphus/evidence/task-7-typecheck.txt

  Scenario: 전체 테스트 통과
    Tool: Bash
    Steps:
      1. `pnpm test` 실행
    Expected Result: 모든 테스트 PASS
    Failure Indicators: "FAIL"
    Evidence: .sisyphus/evidence/task-7-tests.txt
  ```

  **Commit**: YES
  - Message: `feat(perf): enable cacheComponents for PPR`
  - Files: `next.config.ts`
  - Pre-commit: `pnpm build && pnpm test`

- [x] 8. Navigation Hooks (onNavigate + useLinkStatus) + 테스트

  **What to do**:
  - TDD: Navigation Hook 동작 테스트 (jsdom 환경)
  - 타이핑 테스트 이탈 방지:
    - `components/header.tsx`의 back link에 `onNavigate` prop 추가 가능하도록 인터페이스 확장
    - 타이핑 페이지(`app/[locale]/typing/page.tsx`)에서 Header로 `onNavigate` 핸들러 전달
    - 타이핑 중일 때 네비게이션 방지 (`e.preventDefault()`)
    - `beforeunload` 이벤트 리스너도 추가 (브라우저 뒤로가기/닫기 대응)
  - 블로그 링크 로딩 인디케이터:
    - 블로그 포스트 내 이전/다음 네비게이션 링크에 `useLinkStatus` 적용
    - pending 상태일 때 로딩 인디케이터 표시

  **Must NOT do**:
  - Header 컴포넌트의 기존 인터페이스 breaking change 금지 (optional prop으로 추가)
  - 모든 Link에 무차별적으로 Navigation Hook 적용 금지 (타이핑 + 블로그 네비게이션에만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 기존 컴포넌트에 optional prop 추가 + 이벤트 핸들러
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 7)
  - **Blocks**: None
  - **Blocked By**: Task 2 (test infra)

  **References**:

  **Pattern References**:
  - `components/header.tsx` — Header 컴포넌트 현재 인터페이스 (link prop: `{ href, text }`)
  - `app/[locale]/typing/page.tsx` — 타이핑 페이지 구조 (Header 사용 패턴, hook 사용 패턴)
  - `app/[locale]/blog/[...slug]/page.tsx:240-262` — 이전/다음 포스트 링크 UI

  **API/Type References**:
  - `onNavigate`: `<Link onNavigate={(e) => { e.preventDefault() }}>` — NavigateEvent 시그니처
  - `useLinkStatus`: `import { useLinkStatus } from 'next/link'` — `{ pending: boolean }`

  **External References**:
  - 공식 문서: https://nextjs.org/docs/app/api-reference/components/link#onnavigate
  - 공식 문서: https://nextjs.org/docs/app/api-reference/functions/use-link-status

  **WHY Each Reference Matters**:
  - `header.tsx`: link prop 인터페이스에 `onNavigate`를 optional로 추가할 위치 파악
  - 블로그 포스트: 이전/다음 링크에 `useLinkStatus` 적용할 정확한 위치

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Navigation Hook 테스트 파일 작성
  - [ ] `pnpm test navigation` → PASS

  **QA Scenarios:**

  ```
  Scenario: Header에 onNavigate prop이 optional로 추가됨
    Tool: Bash (grep)
    Steps:
      1. `grep 'onNavigate' components/header.tsx` 실행
    Expected Result: onNavigate 관련 코드 출력
    Failure Indicators: 빈 출력
    Evidence: .sisyphus/evidence/task-8-header-prop.txt

  Scenario: 타이핑 페이지에 beforeunload 리스너 존재
    Tool: Bash (grep)
    Steps:
      1. `grep 'beforeunload' 'app/[locale]/typing/page.tsx'` 실행
    Expected Result: beforeunload 이벤트 리스너 코드
    Failure Indicators: 빈 출력
    Evidence: .sisyphus/evidence/task-8-beforeunload.txt

  Scenario: 빌드 + 타입 체크 통과
    Tool: Bash
    Steps:
      1. `pnpm check:types && pnpm test` 실행
    Expected Result: 0 에러
    Failure Indicators: 에러 메시지
    Evidence: .sisyphus/evidence/task-8-verify.txt
  ```

  **Commit**: YES
  - Message: `feat(ux): add navigation hooks for typing test`
  - Files: `components/header.tsx`, `app/[locale]/typing/page.tsx`, `app/[locale]/blog/[...slug]/page.tsx`, test files
  - Pre-commit: `pnpm test`

- [x] 9. View Transitions 기본 crossfade (layout ViewTransition 래핑)

  **What to do**:
  - `app/[locale]/layout.tsx`에 `<ViewTransition>` 래핑 추가
    - `import { ViewTransition } from 'react'`
    - `{children}`을 `<ViewTransition>{children}</ViewTransition>`으로 감싸기
    - next-intl의 `NextIntlClientProvider` 내부에 배치
  - 기본 크로스페이드 동작 확인 — 모든 `<Link>` 네비게이션에 자동 적용

  **Must NOT do**:
  - Root layout (`app/layout.tsx`) 수정 금지 — locale layout에만 적용
  - 기존 `NextProvider`, `ThemeProvider`, `NuqsAdapter` 래핑 순서 변경 금지
  - Shared Element 전환은 이 태스크에서 구현하지 않음 (Task 10)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: layout 파일에 import 1줄 + 컴포넌트 래핑 1줄
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (sequential after Wave 3)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 3, 7

  **References**:

  **Pattern References**:
  - `app/[locale]/layout.tsx:33-47` — 현재 LocaleLayout 구조 (NextIntlClientProvider 래핑)
  - Vercel 예제: https://github.com/CarelessInternet/Ticketer — next-intl + ViewTransition 함께 사용

  **API/Type References**:
  - `import { ViewTransition } from 'react'` — React 19.2 ViewTransition 컴포넌트

  **WHY Each Reference Matters**:
  - `layout.tsx`: ViewTransition을 삽입할 정확한 위치 (NextIntlClientProvider 내부, children 감싸기)
  - Ticketer 레포: next-intl과 ViewTransition을 함께 사용하는 검증된 패턴

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: ViewTransition이 locale layout에 래핑됨
    Tool: Bash (grep)
    Steps:
      1. `grep 'ViewTransition' 'app/[locale]/layout.tsx'` 실행
    Expected Result: import문 + JSX 사용 매칭
    Failure Indicators: 빈 출력
    Evidence: .sisyphus/evidence/task-9-viewtransition.txt

  Scenario: 빌드 성공
    Tool: Bash
    Steps:
      1. `pnpm build 2>&1 | tail -20` 실행
    Expected Result: 빌드 성공
    Failure Indicators: 에러 메시지
    Evidence: .sisyphus/evidence/task-9-build.txt

  Scenario: 브라우저에서 crossfade 동작 확인
    Tool: Playwright
    Steps:
      1. `http://localhost:3000/` 접속
      2. 블로그 링크 클릭
      3. 페이지 전환 시 crossfade 발생 확인 (또는 instant — 미지원 시)
      4. 스크린샷 캡처
    Expected Result: 에러 없이 페이지 전환 완료
    Failure Indicators: JavaScript 에러, 빈 화면
    Evidence: .sisyphus/evidence/task-9-crossfade.png
  ```

  **Commit**: YES
  - Message: `feat(ux): add view transitions crossfade`
  - Files: `app/[locale]/layout.tsx`
  - Pre-commit: `pnpm build`

- [ ] 10. View Transitions Shared Element (블로그 제목 모핑)

  **What to do**:
  - 블로그 목록 페이지(`app/[locale]/blog/list.tsx`)에서:
    - 각 블로그 포스트 제목을 `<ViewTransition name={`blog-title-${slug}`}>` 래핑
    - 날짜도 `<ViewTransition name={`blog-date-${slug}`}>` 래핑
    - Safari 호환: 링크에 `className="inline-block"` 추가
  - 블로그 포스트 페이지(`app/[locale]/blog/[...slug]/page.tsx`)에서:
    - Header의 title을 `<ViewTransition name={`blog-title-${slug}`}>` 래핑
    - 발행일을 `<ViewTransition name={`blog-date-${slug}`}>` 래핑
  - 이전/다음 포스트 링크에 `transitionTypes` prop 추가:
    - 다음 포스트: `transitionTypes={['slide-forward']}`
    - 이전 포스트: `transitionTypes={['slide-back']}`
  - TDD: ViewTransition name이 올바르게 설정되는지 테스트

  **Must NOT do**:
  - `view-transition-name` 중복 사용 금지 (각 slug별 고유 이름)
  - 홈페이지의 3D 컴포넌트(Lickitung)에 view-transition-name 적용 금지 (WebGL 컨텍스트 문제)
  - 로케일 전환 링크에 transitionTypes 적용 금지

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Shared Element Transition은 시각적 결과 확인이 핵심
  - **Skills**: [`playwright`]
    - `playwright`: 전환 효과를 브라우저에서 직접 확인하고 스크린샷 캡처

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (after Task 9)
  - **Blocks**: F1-F4 (Final Verification)
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `app/[locale]/blog/list.tsx` — 블로그 리스트 컴포넌트 (각 포스트 제목/날짜 렌더링 위치)
  - `app/[locale]/blog/[...slug]/page.tsx:110-120` — 포스트 헤더 렌더링 (Header 컴포넌트 + 제목)
  - `app/[locale]/blog/[...slug]/page.tsx:240-262` — 이전/다음 링크 (transitionTypes 적용 위치)
  - `components/header.tsx` — Header 컴포넌트 내부 구조 (title 렌더링 방식)

  **External References**:
  - Vercel 공식 예제: https://github.com/vercel/next-view-transition-example/blob/main/app/blog/page.tsx
  - Safari 호환 주의사항: inline-block 필수 (Vercel 예제 코드 주석)

  **WHY Each Reference Matters**:
  - `list.tsx`: 블로그 카드의 정확한 제목/날짜 마크업 위치를 파악하여 ViewTransition 래핑
  - `[...slug]/page.tsx`: 포스트 헤더의 제목이 Header 컴포넌트 내부에 있는지, 직접 렌더링인지 확인
  - Vercel 예제: 실제 작동하는 Shared Element 패턴의 구체적 코드

  **Acceptance Criteria**:

  **TDD:**
  - [ ] Shared Element name 설정 테스트
  - [ ] `pnpm test viewtransition` → PASS

  **QA Scenarios:**

  ```
  Scenario: 블로그 리스트 → 포스트 네비게이션 시 Shared Element 확인
    Tool: Playwright
    Preconditions: dev 서버 실행 중
    Steps:
      1. `http://localhost:3000/blog` 접속
      2. 첫 번째 블로그 포스트 클릭
      3. 페이지 전환 중 제목 요소가 morph하는지 확인 (또는 crossfade)
      4. 뒤로가기 버튼 클릭
      5. 포스트 → 목록 전환 확인
      6. 스크린샷 캡처
    Expected Result: 에러 없이 전환 완료, JavaScript 콘솔에 에러 없음
    Failure Indicators: JavaScript 에러, 빈 화면, "view-transition-name" 중복 에러
    Evidence: .sisyphus/evidence/task-10-shared-element.png

  Scenario: prefers-reduced-motion에서 전환 비활성화
    Tool: Playwright
    Steps:
      1. `page.emulateMedia({ reducedMotion: 'reduce' })` 설정
      2. 블로그 목록 → 포스트 네비게이션
      3. 전환 애니메이션이 즉시(instant)인지 확인
    Expected Result: 애니메이션 없이 즉시 전환
    Failure Indicators: 애니메이션 발생
    Evidence: .sisyphus/evidence/task-10-reduced-motion.png

  Scenario: view-transition-name 고유성 확인
    Tool: Bash (grep)
    Steps:
      1. `grep -n 'blog-title-' 'app/[locale]/blog/list.tsx'` — slug별 고유 이름
      2. `grep -n 'blog-title-' 'app/[locale]/blog/[...slug]/page.tsx'` — 동일 패턴
    Expected Result: slug 변수를 사용한 동적 name 설정
    Failure Indicators: 하드코딩된 동일 name
    Evidence: .sisyphus/evidence/task-10-unique-names.txt
  ```

  **Commit**: YES
  - Message: `feat(ux): add shared element transitions for blog`
  - Files: `app/[locale]/blog/list.tsx`, `app/[locale]/blog/[...slug]/page.tsx`, `components/header.tsx` (필요시), test files
  - Pre-commit: `pnpm build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `pnpm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (View Transitions + loading states, error boundaries + instrumentation). Test edge cases: empty state, invalid routes, rapid navigation. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Order | Commit | Files | Pre-commit |
|-------|--------|-------|------------|
| 1 | `feat(infra): add instrumentation.ts for server observability` | `instrumentation.ts`, test file | `pnpm test` |
| 2 | `feat(test): add @testing-library/react and jsdom config` | `package.json`, `vitest.config.ts` | `pnpm test` |
| 3 | `feat(ui): add view transitions CSS foundation with a11y` | `app/globals.css` | `pnpm check:types` |
| 4 | `feat(ui): add error.tsx boundaries with recovery UI` | `error.tsx` files, test files | `pnpm test` |
| 5 | `feat(ui): add loading.tsx skeleton states` | `loading.tsx` files, test files | `pnpm test` |
| 6 | `feat(api): integrate after() for post-response logging` | API routes, action.ts, test files | `pnpm test` |
| 7 | `feat(perf): enable cacheComponents for PPR` | `next.config.ts` | `pnpm build` |
| 8 | `feat(ux): add navigation hooks for typing test` | component files, test files | `pnpm test` |
| 9 | `feat(ux): add view transitions crossfade` | layout files | `pnpm build` |
| 10 | `feat(ux): add shared element transitions for blog` | blog page files, test files | `pnpm build` |

---

## Success Criteria

### Verification Commands
```bash
pnpm build                    # Expected: 0 errors, all pages generated
pnpm check:types              # Expected: 0 errors
pnpm test                     # Expected: all tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] View Transitions crossfade works on page navigation
- [ ] Blog title Shared Element morph works list ↔ post
- [ ] Error boundaries render recovery UI on error
- [ ] Loading skeletons show during route transitions
- [ ] after() executes without blocking response
- [ ] instrumentation.ts register() fires on server startup
- [ ] prefers-reduced-motion disables all transitions
- [ ] Build output: 기존 정적(○) 페이지가 동적(ƒ)으로 변경되지 않음 (Suspense 있는 페이지가 PPR(◐)로 변경되는 것은 정상)
