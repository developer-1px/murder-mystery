# 탐문 카드 연결표 — 제작자 전용

루시엔을 제외한 NPC마다 **소문 특정 1장 / 행적 추론 2장 / 진실 암시 1장**을 둔다. 플레이어에게 역할 이름을 붙여 정답을 알려 주지 않고, 카드의 장면과 물건으로 차이를 드러낸다. 두 장 중 무엇을 가져가느냐에 따라 다음에 확인할 카드가 달라져야 한다.

소문은 얼굴·신분을 숨긴다. 탐문은 같은 시간대와 행동을 짚으며 이름을 붙인다. 행적은 목격이나 물건의 변화까지만 제시한다. 진실 암시는 문서의 일부나 수상한 부탁만 드러내고, 진실 카드의 전체 내용과 대가를 해설하지 않는다.

아래 카드 ID는 `testimony.` 접두사를 생략했다.

| NPC | 역할 | 카드 | 맞춰 볼 카드와 추론 |
| --- | --- | --- | --- |
| 마르타 | 소문 특정 | apothecary-counter · 붉은 끈을 감춘 손 | `rumor.queen-luggage`의 기도 뒤 계단·붉은 끈·병을 감싼 두 손 → 엘레노라. `evidence.belladonna-ledger`의 서명자는 운반을 넘겨준 마르타다. |
| 마르타 | 행적 ① | marta-recall · 문턱에 남은 술 쟁반 | `evidence.recall-slip` → 중지 쪽지가 나온 경위. 쟁반을 멈추고 쪽지만 전달한 사실을 보여 준다. 쪽지의 내용과 원래 투약 목적은 말하지 않는다. |
| 마르타 | 행적 ② | recall-messenger · 빈 반환함과 그을린 손끝 | `evidence.coronation-book` + `rumor.anonymous-west-curtain` → 사라진 병과 지하 화로를 연결. 정확한 체류 시각은 `memory.queen-recall`의 전표가 필요하다. |
| 마르타 | 진실 암시 | marta-order · 회신을 기다린 세 봉투 | `evidence.queen-summons-copy` + `memory.queen-summons` → 의원 셋에게 받은 회신의 목적. 봉투 안의 계승 요청은 말하지 않는다. |
| 니콜 | 소문 특정 | dinner-steward · 돌아보지 않고 나간 왕자 | `rumor.old-portrait`의 만찬 뒤 충돌음·손을 감싸고 나온 사람 → 카시안. |
| 니콜 | 행적 ① | study-servant · 서재로 향한 술잔 | `evidence.second-glass`의 금테 없는 잔 → 첫 방문 때 서재로 들어간 술. 이 카드는 시종이 길에서 본 다른 방문자의 동선이며, 얼굴을 특정하지 않는다. |
| 니콜 | 행적 ② | bell-attendant · 종소리 사이의 닫힌 문 | `evidence.isabel-letter` → 카시안의 폐예배실 행선지. `evidence.bell-register` → 서재 호출과 생존 소리. 22시 56분 예배실의 답변을 확인한다. 그 사이를 계속 지킨 것은 아니며 기다린 상대도 특정하지 않는다. |
| 니콜 | 진실 암시 | page-sighting · 봉투에서 뺀 서명 원본 | `memory.cassian-sedative` + `evidence.isabel-letter` → 서명 원본과 봉투 속 사본의 관계. 사양서 내용·수신인·연정은 말하지 않는다. |
| 엘리안 | 소문 특정 | archive-copyist · 옷깃 안으로 접은 종이 | `rumor.princess-pages`의 기도 뒤 쪽문·접힌 종이 → 세라핀. |
| 엘리안 | 행적 ① | isabel-attendant · 돌아온 조약서의 매듭 | `evidence.marriage-treaty` + `evidence.succession-leaf` → 붓꽃 향분과 끊어진 붉은 끈이 서재 방문을 연결한다. |
| 엘리안 | 행적 ② | foreign-envoy · 북쪽 탑의 열쇠 | `rumor.anonymous-archive-knock` + `evidence.tower-seal` → 열쇠에 감긴 탄 붉은 실과 화로의 끈·보관표를 맞춘다. `memory.seraphine-ledger`의 보관증이 정확한 시각을 고정한다. |
| 엘리안 | 진실 암시 | archivist · 지워 달라는 한 줄 | `memory.seraphine-ledger` + `evidence.last-will` → 열람 번호 27-4로 감춘 원문을 찾는다. 누가 기록을 긁었는지, 어떤 조항을 숨겼는지는 말하지 않는다. |
| 오스윈 | 소문 특정 | night-attendant · 동쪽 복도에서 부른 이름 | `rumor.night-sewing`의 서재 출구·좌우를 살핀 사람·동쪽 복도 → 베네딕트. |
| 오스윈 | 행적 ① | wardrobe-keeper · 소매에서 사라진 세 잎 | `evidence.black-cloth` + `evidence.repaired-coat` → 사라진 자수와 바늘구멍으로 서재의 천 조각이 정복에서 떨어졌음을 추론한다. |
| 오스윈 | 행적 ② | tailor · 문서함을 들고 간 복도 | `evidence.minister-dispatch` + `rumor.anonymous-council-room` → 종 뒤 동쪽 기록고 행선지. 접수·소각의 내용과 시각은 증언만으로 확정하지 않는다. |
| 오스윈 | 진실 암시 | minister-clerk · 일곱 번째 목록 | `memory.benedict-will-clause` + `evidence.burnt-will` → 낭독에서 제외하려 한 문서를 찾게 한다. 유언의 내용은 공개하지 않는다. |
| 아녜스 | 소문 특정 | agnes-locked-door · 문을 잠근 왕세자비 | `rumor.heir-calendar`의 밤등 뒤 서재에서 가족동으로 돌아온 사람 → 이사벨. |
| 아녜스 | 행적 ① | agnes-unanswered-calls · 대답 없는 방, 젖은 소매 | `evidence.mud-print` + `rumor.anonymous-family-corridor` → 방에 머물렀다는 설명과 젖은 계단 동선을 대조한다. |
| 아녜스 | 행적 ② | agnes-blue-cloak · 없어졌다 돌아온 망토 | `evidence.broken-seal` → 사라진 망토 고리와 서재의 푸른 실이 재방문을 연결한다. |
| 아녜스 | 진실 암시 | agnes-wet-sleeve · 평소보다 가벼운 약갑 | `memory.isabel-petition` + `evidence.sedative-prescription` → 평소보다 많이 비어 있는 약. 무엇에 넣었고 왜 그랬는지는 진실을 보아야 한다. |
| 루시엔 | 의료 가설 ① | physician-limits · 서로 다른 두 약 | `evidence.belladonna-ledger` + `evidence.sedative-prescription` → 과민반응이 있던 진정액과 수면제를 구분한다. 실제 투약자·용량·사인은 확정하지 않는다. |
| 루시엔 | 의료 가설 ② | head-examination · 되풀이된 두통 | `evidence.physician-log` + 로웬의 검시 → 과거 후두부 병력과 새 외상을 대조한다. 가격한 사람이나 치명성은 증언만으로 정하지 않는다. |
| 루시엔 | 의료 가설 ③ | residue-examination · 붓꽃 향의 기억 | `evidence.marriage-treaty` + `testimony.isabel-attendant` → 향분 노출과 방 안 체류를 조사한다. 향만으로 사망을 단정하지 않는다. |
| 루시엔 | 반증 | old-midwife · 진료부의 친자 표기 | `evidence.physician-log` + `evidence.royal-birth-register` → 법적 등록과 혈연을 구분한다. 아드리안의 불임도 진료부로 확정할 수 없다. |

## 집필·배치 주의

- 기존 카드 ID를 유지한다. `isabel-attendant`는 엘리안의 세라핀 증언이고, `agnes-wet-sleeve`는 이제 약갑 증언이다. 젖은 소매 목격은 `agnes-unanswered-calls`로 옮겼다.
- 니콜의 술잔 목격은 첫 방문이다. 최종 재방문·현장 직물의 연결에는 아녜스의 망토 증언을 쓴다. 타임라인과 추론 연결표에도 구분했다.
- 카시안·이사벨 관계를 한 공개 카드로 특정하지 않는다. 폐예배실의 기다림과 약갑은 서로 다른 진실을 향한다.
- 소문의 태그도 본문에서 들을 수 있는 범위만 담는다. 이름이나 아직 추론하지 않은 목적지를 태그로 노출하지 않는다.
- NPC를 연속 감시자로 만들지 않는다. 진실·접수증·전표로 기록된 순간의 위치를 확인한다. 이동 소요표를 이용해 연속 알리바이까지 자동 확정하지 않는다.
- 루시엔은 의료 가설 3장·반증 1장으로 나눈다. 약물·외상·향분의 가설을 각각 검시와 대조하며 사인을 미리 해설하지 않는다.
- 여섯 NPC에게 네 장씩 배분한다. 탐문은 두 장을 보고 한 장을 선택하며 모든 플레이어가 참여한다.
- 22시 56분 예배실 답변은 `bell-attendant`에만 둔다. `page-sighting`은 서명 문서 단서이며 시간 증명이 아니다.

## 목격 장소와 시간

- 니콜은 22:35 예배실 출발 → 22:39 가족동 전달 → 22:43 예배실 보고 → 회랑에서 출궁 문의 → 22:52 서재 호출 확인 → 22:56 예배실 답변 확인 순으로 움직인다. 서명 원본은 발송 전에 예배실에서 보았다.
- 엘리안은 22:52 탑 아래 관리대에서 열쇠를 건네고, 23:00 같은 곳에서 돌려받는다. 열람대에서 탑으로 순간 이동하는 목격이 아니다.
- 마르타의 검은 손끝 목격은 22:56 소각 뒤 지하 화로 출입문 앞이다. 아녜스의 젖은 소매 목격은 23:00 귀환 뒤 옷을 갈아입기 전이다.
- 탐문은 NPC 덱에서 얻는다. 카드의 locationId는 조사 구역 연결이며 그 NPC가 모든 장면을 목격한 단일 방을 뜻하지 않는다.
