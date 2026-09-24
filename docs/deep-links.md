# 페이지 라우트와 딥링크

모든 작업 공간은 실제 링크이며 주소를 직접 열거나 새로고침해 같은 콘텐츠를 확인할 수 있다. 브라우저 뒤로/앞으로, 링크 새 탭 열기를 지원한다. 상단과 카드 확대·후보 선택·조작법 창 안의 `현재 화면 링크 복사`는 현재 세부 상태의 URL을 복사한다. 제목·문단 옆 `↗`는 그 항목의 링크다.

## 주소 구조

| 대상 | 주소 예시 |
| --- | --- |
| 기본 진입 | `/` → `/table` → 이 브라우저의 마지막 테이블 기록 |
| 공통 설정 | `/setting` |
| 공통 설정 절 | `/setting#setting-night` |
| 설정 세부 인물 | `/setting#setting-royal-family-아드리안-왕세자` |
| 설정 문단·질문 | `/setting#setting-night-p1`, `/setting#setting-deadline-q1` |
| 인물 목록 | `/characters` |
| 인물 설정서 | `/characters/queen` |
| 인물 설정 절 | `/characters/queen#section-당신은-누구인가` |
| 인물 문단·항목 | `/characters/queen#section-당신은-누구인가-p1` |
| 인물 관계 | `/characters/queen#relation-카시안` |
| 인물 목표 | `/characters/queen#objective` |
| 전체 라이브러리 | `/library` |
| 종류·검색 | `/library?kind=memory&q=서재` |
| 장소·NPC·인물별 개인 진실 묶음 | `/library?group=all-rumors`, 드롭다운·묶음 제목 링크의 실제 ID 사용 |
| 뒷면·펼친 카드 | `/library?side=back&revealed=memory.queen-summons` |
| 여러 펼친 카드 | `revealed`를 카드 ID별로 반복 |
| 라이브러리 인물 요약 | `/library?profile=queen` (`profiles=1`은 전체 요약 영역만 펼침) |
| 카드 확대 | `/library/cards/memory.queen-summons` |
| 카드 설계 정보 | `/library/cards/memory.queen-summons?details=1` |
| 카드 확대 + 검색 문맥 | `/library/cards/memory.queen-summons?kind=memory&q=약병` |
| 쟁점 목록 진입 | `/issues` → 첫 쟁점의 고유 주소 |
| 특정 쟁점 | `/issues/issue.poison-chain` |
| 정보 조각 | `/issues/issue.poison-chain#fragment-poison-acquired` |
| 쟁점 안의 카드 | `/issues/issue.poison-chain/cards/evidence.belladonna-ledger#fragment-poison-acquired` |
| 전체 타임라인 | `/timeline` |
| 타임라인 카드 확대 | `/timeline/cards/evidence.queen-summons-copy` |
| 인물별 이야기 점검 | `/issues` (`/deduction`에서 자동 이동) |
| 1인칭 게임 플레이 | `/table/play/:branchId/steps/:step` |
| 플레이하는 내 인물 | `/table/play/:branchId/steps/:step?view=character` |
| 게임 공개 기록 | `/table/play/:branchId/steps/:step?view=record` |
| 게임 카드 읽기 | `/table/play/:branchId/steps/:step?card=:cardId` (내 손패·내 후보·공개 카드만) |
| 게임 이력 | `/table/play/:branchId/steps/:step?history=1` |
| 이전 자유 테이블 | `/table/archive` |
| 테이블 가지 | `/table/main` → 해당 가지의 마지막 확인 위치 또는 최신 기록 |
| 특정 기록 | `/table/main/steps/0` |
| 선택한 묶음 | `/table/main/steps/0?selected=deck-memory` (`selected` 반복으로 다중 선택) |
| 현재 면 확대 | `/table/main/steps/0?inspect=deck-memory` |
| 두 장·세 장 비교 | `/table/main/steps/0?pile=deck-memory&draw=2` (`draw=3`도 지원) |
| 기록 패널 | `/table/main/steps/0?history=1` |
| 조작법 | `/table/main/steps/0?help=1` |

`kind`는 `memory`, `rumor`, `evidence`, `testimony`다. 한글·공백·특수문자는 브라우저가 URL 인코딩한다. 인물·카드·쟁점·묶음은 데이터의 고유 ID를 사용한다. 절·인물 관계는 제목/이름에서 공백을 `-`로 바꾼 앵커를 사용하므로 제목이 바뀌면 주소도 바뀐다. 별도 ID가 없는 문단·질문·목록 항목은 `p1`, `q1`, `point1`처럼 1부터 시작하는 순번이며 순서를 바꾸면 대상도 바뀔 수 있다. 직접 URL을 조립하기보다 화면의 링크를 복사하는 편이 안전하다.

`/deduction`은 제거된 추리검증 화면의 이전 주소이며 `/issues`로 이동합니다. 인물별 기본 화면은 이야기 순서이고, `?category=testimony` 등으로 유형별 카드를 모아 봅니다.

## URL과 실행 상태

- URL은 화면·필터·읽는 카드·선택 후보·테이블 가지와 기록 위치를 결정한다. 드래그 중 좌표, 누르는 동안의 Space/Alt 확대, 맥락 메뉴, 포인터 위치는 일시적 입력이므로 주소에 넣지 않는다.
- 검색 입력은 현재 기록을 교체해 글자마다 뒤로 가기 기록을 만들지 않는다. 카드 열기·닫기·후보 선택·페이지 이동은 탐색 기록에 반영한다. 카드 상세를 닫아도 원래 종류·검색 조건을 유지한다.
- 획득·이동·뒤집기는 확정할 때 배치 기록 하나와 새 URL을 만든다. 드래그 중 임시 카드 ID는 주소에 쓰지 않는다. 과거 기록에서 조작하면 기존 가지를 보존하고 새 가지 주소로 이동한다.
- 카드 및 시나리오 문구 자체는 URL에 넣지 않는다. 인물 비공개 안내와 설계자용 정보 구분은 유지한다. 링크는 접근 권한이나 멀티플레이 비밀 보장 기능이 아니다.

## 테이블 기록의 로컬 보관

게임 테이블은 `murder-mystery:play:<scenarioId>:v1`에 별도 저장한다. 1인칭 플레이 인물은 URL의 임의 인물 ID가 아닌 해당 스냅샷의 `playerId`로 고정한다. 링크나 새로고침은 저장된 무작위 선택 결과를 그대로 복원하고 자동 진행은 멈춘 채 연다. 과거 스냅샷을 읽는 동안 봇이 자동으로 새로운 분기를 만들지 않는다.

테이블 기록은 `localStorage`의 `murder-mystery:table:<scenarioId>:v1`에 저장한다. 같은 브라우저·같은 origin에서는 새로고침·다른 페이지 방문·새 탭 뒤에도 복원할 수 있다. 포트가 다르거나 다른 기기인 경우 같은 저장소가 아니다. 링크만 공유해서 상대 기기에 배치 기록을 전송하지는 않는다.

존재하지 않는 페이지·인물·카드·쟁점·묶음·기록·선택 대상은 오류 화면과 돌아갈 링크를 보여준다. 다른 기기에 없는 가지를 기본 배치로 위장하지 않는다. 저장된 JSON이 손상되거나 사라진 카드 ID를 참조하면 저장 데이터를 자동으로 덮어쓰지 않고 복원 실패를 표시한다. 저장소 접근·용량 제한으로 저장이 실패하면 현재 조작을 유지하되 새로고침 복원이 불가능할 수 있다고 안내한다.

## 실행과 배포

개발 서버는 기존 `npm run dev`를 사용한다. Vite 개발 서버는 직접 입력한 세부 경로도 앱으로 연결한다. 정적 배포 서버에서는 `/setting`, `/characters/*`, `/library/*`, `/issues/*`, `/timeline/*`, `/table/*`의 요청을 `index.html`로 fallback하도록 구성해야 한다. 새 라우트를 추가했다고 서버 배포나 rewrite 설정이 자동 적용된 것은 아니다.

라우팅은 [React Router의 선언적 라우팅](https://reactrouter.com/start/declarative/routing)을 사용한다. 제품의 세부 주소 계약과 로컬 테이블 저장 정책은 이 문서에 정의한다.
