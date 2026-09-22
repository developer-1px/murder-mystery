# 카드 상호작용 정본

`CardTable.tsx`의 공개 `CardTable`, `CardTablePolicy`, `TableView`가 2D 카드 조작 API다. 별도 패키지·Story 사이트가 없는 이 앱에서는 제품 경로 자체가 Usage다.

## 책임과 API

| 정본 | 역할·지식·결정 | 변경 이유 / 수명주기 | 입력 → 출력 |
| --- | --- | --- | --- |
| `CardView.tsx` / `CardView` | 앞뒷면, 2:3, 텍스트 맞춤, 비밀 DOM 차단 | 카드 표현·크기·문구 | `Card`, 면, 표시 정보 → 카드 표면 |
| `CardView.tsx` / `CardReader` | 문서형 상세의 native dialog | 정적 카드 상세·메타데이터 | 카드, 닫기, 추가 내용 → 상세 창 |
| `CardTable.tsx` | 좌표, 선택, 확대, 포인터 캡처, 드롭, 입력 의미, 후보 선택 | 카드 조작 UX / press→preview→commit·cancel | `CardPile[]`, 선택적 정책 → 카드 의도 또는 자유 배치 |
| `cardHover.ts` / `useCardHover` | 연속 호버의 열림·교체·해제 | 인접 카드 이동의 읽기 안정성 | `show(id)`, `leave(id)` → 현재 미리보기 ID |
| `TableCardPiece.tsx` | 카드 이동·앞뒤·등장/퇴장 | 모션·접근성·표면 표현 | 위치, 카드, 표시 상태 → 움직이는 카드 |
| `tableInput.ts` | 물리 키→카드 조작, 입력/IME 제외 | 입력 장치·단축키 | 키 이벤트 → 의미 |
| `domain/table.ts` | 자유 배치, 순서·앞뒤·카드 수 보존 | 자유 테이블 모델 | 배치·명령 → 새 배치 |
| `domain/playTable.ts` | 게임 소유권·공개 범위의 화면 투영 | 게임 상태→카드 배치 번역 | 세션·에셋·가림 상태 → `CardPile[]` |
| `domain/playSession.ts` | 턴, 배분, 증거 제출·기소, 손패 순열 | 게임 규칙 | 세션·명령 → 다음 세션 |

카드 보기는 공유하지만 문서형 dialog와 테이블 안 확대는 서로 대체하지 않는다. 전자는 문서와 메타데이터의 top-layer, 후자는 같은 보드의 좌표·드래그·잠깐 읽기 수명주기다. 테이블 확대를 페이지에서 다시 구현하지 않는다.

`policy`가 없으면 기존 자유 배치 동작을 사용한다. `policy`가 있으면:

- `deckActions`: 덱별 허용 의도·비활성 이유·뒷면 표시. 장수와 룰은 호스트/도메인이 결정한다.
- `choice`: 이미 결정된 후보 N장, 원본 덱 ID, `onPick`, 안내 문구. 컴포넌트는 다시 추첨하지 않는다. 클릭과 손패 드롭은 같은 `onPick`으로 들어간다. 게임 후보는 취소로 재추첨할 수 없다.
- `play`: 손패 카드의 제출 가능 여부와 의도. 드롭·맥락 메뉴·확대 창 버튼이 같은 `run`을 사용한다.
- `reorderHand`: 정렬된 카드 ID 순열. 게임 엔진에서 소유 카드 보존을 재검증한다.
- `reader`: 선택적 URL 연결. `pileId`와 `onChange`만 받고 페이지는 확대 수명주기를 구현하지 않는다.

손패는 제자리에 남는다. 호버는 고정 키 `active-card-preview`의 별도 미리보기이며, 카드가 바뀌어도 DOM 노드와 확대 크기를 유지한다. 원본에 테두리만 표시하고, 인접 카드 사이 90ms 이내 간격은 닫힘으로 취급하지 않는다. 미리보기 자체를 잡아도 같은 드래그 경로를 탄다.

2장·3장 중 한 장 고르기의 후보는 이미 크게 펼쳐져 있으므로 호버 미리보기나 위로 들리는 모션을 사용하지 않는다. 후보의 크기와 위치를 유지하며 클릭·손패 드래그로 선택한다.

1인칭 플레이의 `playTablePiles`는 고정된 열람 인물(`viewerId`)의 손패를 투영하고, 행동 인물(`actorId`)이 같을 때만 비공개 덱 선택을 연다. `randomPlayerAction`은 기존 룰에서 허용되는 도메인 명령만 고르고 카드 UI를 소유하지 않는다. 다른 인물의 비공개 상태만 바뀌어 화면 배치가 같다면 `CardTable`은 진행 중인 호버·드래그를 초기화하지 않는다.

## 제품 Usage와 소스 등록

| 실제 Usage | 공개 API import | 소스 정본 |
| --- | --- | --- |
| `/table/play/:branchId/steps/:step` | `PlayTablePage` → `CardTable` + `CardTablePolicy` | `CardTable.tsx` → `TableCardPiece.tsx`, `cardHover.ts`, `tableInput.ts` |
| `/table/archive`, `/table/:branchId/steps/:step` | `TablePage` → `CardTable` | 동일 |
| `/library/cards/:cardId` | `CardLibrary` → `CardView`, `CardReader` | `CardView.tsx` |
| `/issues/:groupId/cards/:cardId` | `IssueBoard` → `CardView`, `CardReader` | `CardView.tsx` |
| `/timeline/cards/:cardId` | `TimelineBoard` → `CardReader` | `CardView.tsx` |

실제 Usage는 fixture가 아닌 세션/시나리오를 전달한다. 가짜 호스트나 전달만 하는 facade를 추가하지 않는다.

## 감사 범위와 판정

정본 열거자는 `App.tsx`의 경로 등록이다. 8개 페이지 구현(공통 설정, 인물 설정, 라이브러리, 쟁점, 타임라인, 추리 검증, 자유 테이블, 게임 테이블), 카드 렌더링/입력 의존 폐쇄, 기존 문서·관련 테스트를 읽었다. 카드 UI 책임 발생 15건을 고정했다. 분류는 변경 전 기준이며 각각 하나만 배정했다.

| 발생 위치 | 판정 | 조치 / 최종 소유자 |
| --- | --- | --- |
| `CardLibrary` 카드·상세 | canonical consumer | 유지 / `CardView` |
| `IssueBoard` 카드·상세 | canonical consumer | 유지 / `CardView` |
| `TimelineBoard` 상세 | canonical consumer | 유지 / `CardReader` |
| `TableCardPiece` 카드 표면 | canonical consumer | 유지 / `CardView` |
| `PlayTablePage` 공개 기록·인물·검사 카드 표면 | canonical consumer | 유지 / `CardView` |
| `TablePage` 세션·라우팅 연결 | Host composition | 유지 |
| `CardTable` 자유 입력만 받는 API | canonical API gap | `CardTablePolicy`로 규칙 기반 의도 확장 |
| `CardTable` 내부 선택 후보만 받는 API | canonical API gap | 외부 확정 후보 N장, 드래그 선택 지원 |
| `PlayTable` 손패 호버·모션 | duplicate implementation | 삭제 / `CardTable` |
| `PlayTable` 후보 배열·가져오기 | duplicate implementation | 삭제 / `CardTable` |
| `PlayTablePage.Deck` 덱 표현·조작 | duplicate implementation | 삭제 / `CardTable` |
| `PlayTablePage.CardDetail` 상세 dialog | duplicate implementation | 삭제 / `CardReader` |
| 사용처 없는 `CardChoice.tsx` | duplicate implementation | 파일·전용 CSS 삭제 / `CardTable` |
| `PlayTable` 별도 카드 화면 키 입력 | duplicate implementation | 삭제 / `tableInput` + `CardTable` |
| `PlayTable` 게임 손패·덱의 화면 변환 | missing canonical module | `domain/playTable.ts`에 정본 투영 |

합계: canonical consumer 5 + Host composition 1 + canonical API gap 2 + duplicate implementation 6 + missing canonical module 1 = 15. 감사 대상 사용처의 교체가 끝났다. 게임 규칙 엔진과 자유 배치 엔진, 서로 다른 이력 형식은 불변식이 달라 합치지 않았다. 외부 패키지·멀티플레이·정치/엔딩·시나리오 진상 수정은 범위 밖이다.

## 계약과 재발 방지

`CardTable.policy.test.tsx`는 공유 입력에서 허용된 의도만 호출되는 계약과 고정 미리보기 노드를, `cardHover.test.tsx`는 연속 호버의 수명주기를 기록한다. `domain/playTable.test.ts`는 비공개 투영과 손패 순열을 다룬다. `CardTable.ownership.test.ts`는 확인된 재발 경로인 게임 페이지의 자체 호버·드래그·선택/dialog 재도입을 감시한다.

현재 shared-worktree 실험에서는 계약 파일을 작성하되 자동 테스트·타입 검사·린트·빌드를 실행하지 않는다. 검증은 연결된 Chrome의 제품 Usage에서 직접 진행한다. 테스트 통과를 주장하지 않는다.

## 작업 화면 시각 정본

`App.tsx` 라우트 레지스트리의 9개 화면 가족(공통 설정, 인물 설정, 카드 라이브러리, 쟁점, 타임라인, 추리 검증, 재판 시뮬레이터, 자유 테이블, 게임 테이블)을 시각 정보의 감사 분모로 삼는다.

| 책임 | 정본 | 계약 |
| --- | --- | --- |
| 전역 색·표면·테두리·텍스트 토큰 | `styles.css`의 `:root --ui-*` | 작업 화면과 게임 테이블이 같은 녹색·금색 언어를 소비한다. 카드 종류별 종이 색은 `CardView`의 의미 표현으로 남는다. |
| 전역 작업 공간 탐색과 건강 표시 | `App.tsx`의 `workbench-float` | 모든 경로가 같은 런처와 popover 메뉴를 사용한다. |
| 화면별 문서·보드 레이아웃 | 각 route component | 정보 구조와 조합만 소유하고, 전역 셋·카드 표현·카드 조작을 재구현하지 않는다. |

기존의 갈색 `topbar`와 라우트별 색상 지정은 신 게임 테이블 셸을 우회하는 중복 구현이었다. `topbar` 렌더링과 전용 CSS를 제거하고, 9개 화면 가족 모두를 `workbench-float` 소비자로 이관했다. 게임 테이블의 `--play-*`도 `--ui-*`를 참조하며, 각 route에는 레이아웃과 필터·표·보드 구성 책임만 남는다.
