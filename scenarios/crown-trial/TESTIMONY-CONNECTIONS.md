# 탐문 카드 연결표 — 제작자 전용

루시엔을 제외한 NPC마다 **소문 특정 1장 / 행적 추론 2장 / 진실 암시 1장**을 둔다. 플레이어에게 역할 이름을 붙여 정답을 알려 주지 않고, 카드의 장면과 물건으로 차이를 드러낸다. 두 장 중 무엇을 가져가느냐에 따라 다음에 확인할 카드가 달라져야 한다.

소문은 얼굴·신분을 숨긴다. 탐문은 같은 시간대와 행동을 짚으며 이름을 붙인다. 행적은 목격이나 물건의 변화까지만 제시한다. 진실 암시는 문서의 일부나 수상한 부탁만 드러내고, 진실 카드의 전체 내용과 대가를 해설하지 않는다.

아래 카드 ID는 `testimony.` 접두사를 생략했다.

| NPC | 역할 | 카드 | 맞춰 볼 카드와 추론 |
| --- | --- | --- | --- |
| 마르타 | 소문 특정 | apothecary-counter · 붉은 끈을 감춘 손 | `rumor.queen-luggage`의 기도 뒤 계단·붉은 끈·병을 감싼 두 손 → 엘레노라. `evidence.belladonna-ledger`의 서명자는 운반을 넘겨준 마르타다. |
| 마르타 | 행적 ① | marta-recall · 문턱에 남은 술 쟁반 | `evidence.recall-slip` → 중지 쪽지가 나온 경위. 왕비는 안쪽 방으로 돌아가고 쟁반과 쪽지는 시녀에게 남는다. |
| 마르타 | 행적 ② | recall-messenger · 빈 상자와 그을린 손끝 | `evidence.coronation-book` + `rumor.anonymous-west-curtain` → 사라진 병과 지하 화로를 연결. 정확한 체류 시각은 `memory.queen-recall`의 전표가 필요하다. |
| 마르타 | 진실 암시 | marta-order · 두 번째 술의 지시 | `memory.queen-recall` → 술과 내일의 즉위식이 무슨 관계인지 질문하게 한다. 투약량·치명성·실제 실행은 말하지 않는다. |
| 니콜 | 소문 특정 | dinner-steward · 손을 감싸 쥔 왕자 | `rumor.old-portrait`의 만찬 뒤 충돌음·손을 감싸고 나온 사람 → 카시안. |
| 니콜 | 행적 ① | study-servant · 서재로 향한 술잔 | `evidence.second-glass`의 금테 없는 잔 → 첫 방문 때 서재로 들어간 술. 이 카드는 시종이 길에서 본 다른 방문자의 동선이며, 얼굴을 특정하지 않는다. |
| 니콜 | 행적 ② | bell-attendant · 종소리 사이의 닫힌 문 | `evidence.isabel-letter` → 카시안의 폐예배실 행선지. `evidence.bell-register` → 서재 호출과 생존 소리. 문을 계속 지킨 증언이 아니므로 종 뒤 알리바이를 완성하지 않는다. |
| 니콜 | 진실 암시 | page-sighting · 세 번 되돌아온 쪽지 | `memory.cassian-sedative`의 세 쪽지·답란 인장 → 기다린 사람을 감추는 이유. 상대의 이름과 관계는 밝히지 않는다. |
| 엘리안 | 소문 특정 | archive-copyist · 옷깃 안으로 접은 종이 | `rumor.princess-pages`의 기도 뒤 쪽문·접힌 종이 → 세라핀. |
| 엘리안 | 행적 ① | isabel-attendant · 돌아온 조약서의 매듭 | `evidence.marriage-treaty` + `evidence.succession-leaf` → 붓꽃 향분과 끊어진 붉은 끈이 서재 방문을 연결한다. |
| 엘리안 | 행적 ② | foreign-envoy · 북쪽 탑의 열쇠 | `rumor.anonymous-archive-knock` + `evidence.corridor-plan` → 탑으로 향한 이유와 귀환 가능 시간을 질문한다. `memory.seraphine-ledger`의 보관증이 정확한 시각을 고정한다. |
| 엘리안 | 진실 암시 | archivist · 지워 달라는 한 줄 | `memory.seraphine-ledger` → 지워진 출입 기록과 감춘 열람. 누가 긁었는지 직접 목격하지 않는다. |
| 오스윈 | 소문 특정 | night-attendant · 동쪽 복도에서 부른 이름 | `rumor.night-sewing`의 서재 출구·좌우를 살핀 사람·동쪽 복도 → 베네딕트. |
| 오스윈 | 행적 ① | wardrobe-keeper · 소매에서 사라진 세 잎 | `evidence.black-cloth` + `evidence.repaired-coat` → 사라진 자수와 바늘구멍으로 서재의 천 조각이 정복에서 떨어졌음을 추론한다. |
| 오스윈 | 행적 ② | tailor · 문서함을 들고 간 복도 | `evidence.minister-dispatch` + `rumor.anonymous-council-room` → 종 뒤 동쪽 기록고 행선지. 접수·소각의 내용과 시각은 증언만으로 확정하지 않는다. |
| 오스윈 | 진실 암시 | minister-clerk · 일곱 번째 목록 | `memory.benedict-will-clause` + `evidence.burnt-will` → 낭독에서 제외하려 한 문서를 찾게 한다. 유언의 내용은 공개하지 않는다. |
| 아녜스 | 소문 특정 | agnes-locked-door · 문을 잠근 왕세자비 | `rumor.heir-calendar`의 밤등 뒤 서재에서 가족동으로 돌아온 사람 → 이사벨. |
| 아녜스 | 행적 ① | agnes-unanswered-calls · 대답 없는 방, 젖은 소매 | `evidence.mud-print` + `rumor.anonymous-family-corridor` → 방에 머물렀다는 설명과 젖은 계단 동선을 대조한다. |
| 아녜스 | 행적 ② | agnes-blue-cloak · 없어졌다 돌아온 망토 | `evidence.broken-seal` → 사라진 망토 고리와 서재의 푸른 실이 재방문을 연결한다. |
| 아녜스 | 진실 암시 | agnes-wet-sleeve · 봉인하지 않은 청원 | `memory.isabel-petition` → 단독 후견을 원했던 준비. 누구의 계승을 막으려 했는지는 진실을 보아야 한다. |

## 집필·배치 주의

- 기존 카드 ID를 유지한다. `isabel-attendant`는 엘리안의 세라핀 증언이고, `agnes-wet-sleeve`는 이제 청원 증언이다. 젖은 소매 목격은 `agnes-unanswered-calls`로 옮겼다.
- 니콜의 술잔 목격은 첫 방문이다. 최종 재방문·현장 직물의 연결에는 아녜스의 망토 증언을 쓴다. 타임라인과 추론 연결표에도 구분했다.
- 카시안·이사벨 관계를 한 공개 카드로 특정하지 않는다. 폐예배실의 기다림과 청원은 서로 다른 진실을 향한다.
- 소문의 태그도 본문에서 들을 수 있는 범위만 담는다. 이름이나 아직 추론하지 않은 목적지를 태그로 노출하지 않는다.
- NPC를 연속 감시자로 만들지 않는다. 정확한 시각이 있는 진실·접수증·전표와 이동 거리를 합쳐야 알리바이가 완성된다.
- 루시엔 네 장과 카드 수, 탐문 선택 방식은 유지한다.
