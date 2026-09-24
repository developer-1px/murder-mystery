# 왕관재판 디자인 시스템

## 기준

2026-09-24 확정된 게임 테이블을 기준으로 한다. 짙은 녹색은 조작 공간, 밝은 종이는 읽을 이야기, 금색은 진행 행동과 현재 선택이다. 본문은 18px, 일반 컨트롤은 16px/높이 44px, 테이블의 상시 도구는 14px/높이 36px를 사용한다. 본문을 작게 줄여 빈 공간을 만드는 방식으로 배치하지 않는다.

카드의 종류별 색, 2:3 비율, 앞뒷면, 본문 자동 맞춤과 드래그는 기존 `CardView`/`CardTable` 소유다. 카드 버튼을 일반 `Button`으로 감싸지 않는다. 인물 색·단서 색·게임 단계·잠금 이유·저장 기록은 디자인 시스템이 결정하지 않는다.

## 공개 API와 소스 등록

| 역할 | 정본 | 실제 사용 예시 |
| --- | --- | --- |
| 색·글꼴·크기·간격·모서리 | [tokens.css](tokens.css) | `main.tsx`가 한 번 로드, 모든 페이지 CSS가 참조 |
| 일반 행동·선택 버튼 | [controls.tsx](controls.tsx) `Button` | `PlayTablePage`, `CardLibrary`, `CourtSimulator`, `EndingBranches` |
| 입력과 셀렉트 | `controls.tsx` `Input`, `Select` | `CardLibrary`, `TablePage` |
| 경로 선택 | `controls.tsx` `ActionLink`, `NavigationLink` | `IssueBoard`, `App` |
| 컨트롤 상태·표면 | [system.css](system.css) | `ui-panel`, `ui-paper`, `ui-notice` |
| 단서 카드 | [CardView.tsx](../components/CardView.tsx) | 라이브러리·설정서·게임·이 사용 예시 |
| 테이블 상호작용 | [CardTable.tsx](../components/CardTable.tsx) | 게임 테이블·기존 자유 테이블 |
| 실행 가능한 Usage | [DesignSystemPage.tsx](DesignSystemPage.tsx) | `/design-system`, `App.tsx`에 등록 |

```tsx
import { Button, Input, Select, ActionLink } from './design-system/controls'

<Button variant="primary" disabled={!selected} onClick={submit}>증거 제출 →</Button>
<Button variant="choice" aria-pressed={selected} onClick={choose}>탐문</Button>
<Button variant="ghost" size="compact" aria-label="안내 닫기" onClick={close}>×</Button>
<label>카드 검색<Input type="search" value={query} onChange={changeQuery} /></label>
<ActionLink to="/issues" aria-current={active ? 'page' : undefined}>카드 구성</ActionLink>
```

- `Button`: `variant` = `primary | secondary | ghost | choice`, 기본 `secondary`. `size` = `regular | compact`, 기본 `regular`. `type` 기본값은 `button`이다. 네이티브 props/ref/popover 속성을 그대로 전달한다.
- `primary`: 해당 장면에서 진행할 결정. `secondary`: 보조 행동. `ghost`: 취소·닫기·상시 도구. `choice`: 여러 후보 중 고르기.
- 선택은 `aria-pressed` 또는 링크의 `aria-current=page`로 표현한다. 색만 바꾸지 않고 테두리와 밑줄도 제공한다.
- 네이티브 `disabled`는 실행 차단에 사용한다. 메뉴의 `aria-disabled`는 메뉴 소유자가 실행을 차단하며 키보드 이동을 유지한다.
- `ActionLink`는 Router `Link` 속성을 받는다. `NavigationLink`는 Router `NavLink`의 활성 경로 판정을 사용한다. 일반 본문 링크는 링크로 유지한다.
- `ui-panel`: 진행·메뉴 패널. `ui-paper`: 설정서·엔딩 종이. `ui-notice`: 안내, `data-tone="warning" | "error"`로 중요도를 구별한다. 이 클래스들은 공개 CSS 계약이다. 태그·역할·문구·배치는 소비자가 정한다.
- `className`은 폭·정렬·위치·반응형 배치를 위한 확장점이다. 색·테두리·폰트·hover·pressed·disabled·focus를 소비자에서 덮어쓰지 않는다. 필요한 변형은 정본 API에 추가한다.

## 책임 감사

범위의 분모는 `App.tsx`가 등록한 기존 11개 페이지 계열과 공유 컨트롤을 소비하는 기존 12개 모듈이다. 리디렉션과 카드 상세·기록 파라미터 경로는 같은 페이지 계열로 센다. 새 `/design-system`은 별도의 Usage다. 비주얼의 모든 CSS 선언이 같은 책임이라는 주장은 하지 않는다.

| 책임 | 지식·결정·변경 이유 | 상태·입출력 | 이전 판정 → 최종 판정 |
| --- | --- | --- | --- |
| 일반 컨트롤 외형 | 테마·크기·상태 대비. 디자인 변경 시 함께 변함 | 네이티브 props → DOM, 도메인 상태 없음 | missing canonical module → `controls.tsx`/`system.css` 정본 |
| 페이지별 버튼 스타일 | 위와 동일한 지식과 선택 상태 | 각 페이지별 class/aria → 서로 다른 외형 | duplicate implementation → canonical consumer |
| 폰트·색 토큰 | 전역 가독성과 테마 | CSS 변수 → 모든 소비자 | mislocated module(`styles.css`) → `tokens.css` |
| 종이·패널·안내 | 용도별 표면과 읽기 대비 | class/tone → 표면, 내부 상태 없음 | duplicate implementation → canonical consumer |
| 카드 표현·입력 | 카드 종류·앞뒤·본문 맞춤·선택/드래그 수명 | 카드 모델/정책 → 카드 UI | canonical consumer: 기존 카드 소유자 유지 |
| 페이지 배치·게임 규칙 | 화면별 순서·역할·장면·대상 | 게임/라우팅 상태 → props/배치 | Host composition |

기존 12개 컨트롤 소비 모듈의 최종 판정은 모두 **canonical consumer**다. 도메인 이벤트 핸들러는 각 소비자에 **Host composition**으로 남는다.

| 소비자 | 이관한 책임 |
| --- | --- |
| `App.tsx` | 메뉴 열기, 경로 선택, 메뉴 표면 |
| `routing.tsx` | 주소 복사 버튼 |
| `CardLibrary.tsx` | 종류·앞뒷면 선택, 검색, 묶음 선택, 오류 안내 |
| `CardView.tsx`의 `CardReader` | 닫기 버튼(카드 surface 자체는 제외) |
| `CardTable.tsx` | 펼치기·선택 취소·제출·조작법 버튼 |
| `TableContextMenu.tsx` | 메뉴 항목과 표면(방향키/초점 이동은 기존 소유) |
| `TablePage.tsx` | 이력 버튼, 가지 선택, 이전 기록 안내 |
| `PlayTablePage.tsx` | 단계 진행, HUD, 인물/진실 선택, 패널·경고 |
| `CharacterSettings.tsx` | 뒤로 가기, 종이 표면 |
| `CourtSimulator.tsx` | 새 판·재판 선택 |
| `EndingBranches.tsx` | 세계선 선택, 종이 표면 |
| `IssueBoard.tsx` | 인물·범주 링크 선택, 구성 안내 |

11개 페이지 계열: `/setting`, `/guide`, `/cards`, `/characters`, `/library`, `/issues`, `/timeline`, `/court-simulator`, `/endings`, `/table` 및 `/table/play/...`, `/table/archive` 및 자유 테이블 기록. 공통 설정·진행 안내·카드 설명·타임라인의 읽기 배치는 **Host composition**이고 글꼴·색은 공용 토큰을 사용한다.

범위 밖: 시나리오 내용, NPC/라운드 규칙, 카드 자동 맞춤·드래그 생명주기, 도메인 데이터 표의 정보별 강조, 저장 형식/이력 마이그레이션, 인물 고유 색, 이야기의 장식. 고유 장식과 카드별 색은 일반 버튼의 상태 정의를 대체하지 않는다.

## 검증과 재발 방지

프로젝트 `AGENTS.md`는 프로토타입 단계에 자동 테스트·타입체크·린트·정적 분석·빌드를 금지한다. 이 규칙이 스킬의 정본 계약 테스트 권고보다 우선한다. 새 자동 검사나 계약 테스트를 추가/실행하지 않았다.

실제 Chrome에서 공용 Usage의 실행·선택·비활성 표시, 게임 검시 화면, 진행 현황 열기/닫기, 라이브러리 필터와 카드 확대/닫기, 엔딩 변경을 확인했다. 설정·안내·인물·구성·타임라인·재판 시뮬레이터 경로도 열어 렌더링을 확인했다. 기존 자유 테이블은 저장된 데이터가 현재 시나리오와 맞지 않아 복원 안내만 표시됐다. 데이터를 수정하거나 삭제하지 않았으며 기존 기록 복원은 이번 변경의 확인 범위 밖이다. 같은 `CardTable` 컨트롤의 게임 경로는 확인했다. 작은 화면의 실제 기기 검증은 별도 필요하다.

재발 방지는 이 소유권 규칙과 실행 가능한 Usage를 기준으로 리뷰한다. 새 컨트롤은 페이지에 스타일을 복사하지 않고 이 모듈을 확장한다. 프로토타입 제한 해제 후 계약 테스트에는 네이티브 disabled 차단, ref 전달, popover 속성, pressed/current 표시, 키보드 focus, 테이블 카드 버튼의 독립성을 포함한다.

## SVG 아이콘

[Icon.tsx](Icon.tsx)가 Lucide React 1.48.0의 승인된 23개 아이콘, 18px 기본 크기, 1.75 선 굵기와 접근성 정책을 소유한다. 앱은 `lucide-react`를 직접 가져오지 않고 `Icon`을 사용한다. `name`은 `IconName`, `size`는 크기/비율, `label`은 독립적인 의미를 가진 아이콘에만 사용한다. 텍스트 옆 아이콘은 기본적으로 보조기술에서 숨기고, 아이콘만 있는 버튼에는 버튼의 `aria-label`로 행동 이름을 제공한다.

```tsx
import { Icon } from './design-system/Icon'
<Button aria-label="카드 닫기"><Icon name="close" /></Button>
<Button variant="primary">증거 제출 <Icon name="arrowRight" /></Button>
```

SVG는 패키지에 포함되어 로컬 번들로 제공된다. 런타임 외부 아이콘 CDN을 사용하지 않는다. `/design-system#icons`에 실제 같은 컴포넌트의 목록이 있다. 상업적 사용을 허용하는 ISC 라이선스이며 Feather 유래 아이콘의 MIT 고지를 포함한 원문을 `public/licenses/lucide.txt`에 보관한다. 배포 시 이 파일을 유지한다. 출처: https://lucide.dev/license 및 https://lucide.dev/guide/react .

## 전체 화면 적용 후속 정리

- 목차 링크는 `Anchor`, 경로를 바꾸는 기록 선택은 `ActionLink`를 사용한다. `aria-current="step"`도 공용 선택 표시를 사용한다.
- 접기·펼치기는 `Disclosure`와 `DisclosureSummary`가 외형과 SVG 표시를 소유한다. 네이티브 details/summary의 키보드 동작을 유지한다. 라이브러리의 URL 기반 열림 상태와 기록의 open 값은 소비자가 결정한다.
- `ui-panel`의 `data-elevation="floating"`, `data-tone="accent"`로 부유 패널과 강조 영역을 표현한다. 공용 CSS에서 특정 페이지의 클래스 이름을 참조하지 않는다.
- 설정·안내·엔딩의 주요 패널, 구성 화면, 인물 목표는 공용 표면을 소비한다. 종이 위의 본문과 보조 설명은 `ui-paper-ink`, `ui-paper-muted`를 사용한다.
- 서체 크기는 caption 12 / label 14 / control 16 / body 18 / subheading 22 / heading 24 / title 32 / display 42의 공용 척도를 사용한다. 카드 내부의 상대 크기와 장식 기호 크기는 카드/테이블 소유다.
- 새 소비자: `CommonSetting`, `CardGuide`의 목차; `CardLibrary`, `TablePage`, `PlayTablePage`, `IssueBoard`의 disclosure. 공개 Usage에도 같은 컴포넌트를 추가했다.

후속 확인: Chrome에서 공용 disclosure 열기와 라이브러리 공개 인물 목록의 URL 기반 열기를 실행했다. 설정·진행 안내·카드 안내·인물 목록/로웬·구성·타임라인·재판·엔딩을 열어 렌더링을 확인했다. 엔딩의 종이 대비는 스크린샷으로 확인했다. 자동 테스트·타입체크·린트·빌드는 실행하지 않았다.
