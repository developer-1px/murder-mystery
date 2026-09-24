# 탐문 카드 연결표 — 제작자 전용

탐문 대상 선택은 의심하는 인물을 간접적으로 드러낸다. 다섯 측근의 세 카드는 담당 인물의 **이해관계 / 당일 행적 / 진술의 빈틈**을 각각 조사한다. 관찰한 언행만 쓰며 의도·범행·극비 관계를 증인이 해설하지 않는다. 역할 이름은 제작자 화면에만 표시한다.

루시엔은 아드리안의 NPC다. 로웬 전담 NPC는 없다. 총 여섯 NPC × 3장 = 18장이다. 두 장 중 하나를 획득하고 나머지는 덱에 돌려놓는다. 한 장만 남으면 그 장을 획득한다.

아래 ID는 `testimony.` 접두사를 생략했다.

| 조사 대상 / NPC | 이해관계 | 당일 행적 | 진술의 빈틈 |
| --- | --- | --- | --- |
| 엘레노라 / 마르타 | marta-order: 카시안의 지위와 의원들의 회신 | marta-recall: 붉은 병을 받았다가 술 쟁반을 멈춤 | recall-messenger: 반환함의 병이 사라지고 화로 앞 손끝이 검음 |
| 카시안 / 니콜 | dinner-steward: 왕관 이야기를 피한 태도와 형의 서재에서 생긴 충돌 | bell-attendant: 서재의 생존 소리, 22:56 예배실에서 들은 답변 | page-sighting: 서명한 원본을 보관하고 사본만 보내며 접수 보류 |
| 세라핀 / 엘리안 | isabel-attendant: 혼인 조건을 묻고 끊긴 조약서 봉인끈을 그대로 둠 | foreign-envoy: 북쪽 탑 열쇠 대여와 반환 | archivist: 접힌 종이와 긁힌 계승법 열람 기록 |
| 베네딕트 / 오스윈 | minister-clerk: 자신의 자리가 걸린 봉투와 비워 둔 낭독 날짜 | night-attendant: 종 전에 서재를 나와 종 뒤 기록고로 향함 | wardrobe-keeper: 문에 걸렸다는 설명과 사라진 소매 자수 |
| 이사벨 / 아녜스 | agnes-wet-sleeve: 아이와 떨어질 걱정, 첫 방문 뒤 비어 있는 약갑 | agnes-unanswered-calls: 첫 귀환 뒤 부재, 경보 전 젖은 소매로 응답 | agnes-blue-cloak: 없어졌다 돌아온 망토와 뜯긴 고리 자리 |

## 증거와의 연결

- 마르타: `evidence.queen-summons-copy`로 회신 목적을, `evidence.belladonna-ledger`와 `evidence.recall-slip`으로 약의 반출·취소를, `evidence.coronation-book`으로 병의 행방을 대조한다.
- 니콜: `evidence.stopped-watch`와 `evidence.royal-recognition`으로 충돌을, `evidence.bell-register`와 `evidence.isabel-letter`로 생존·예배실 답변을, `evidence.royal-birth-register`로 서명 문서의 성격을 조사한다. 기다리는 상대·편지 수신인·연정은 증언에 쓰지 않는다.
- 엘리안: `evidence.marriage-treaty`와 `evidence.succession-leaf`로 조약서와 향분을, `evidence.tower-seal`로 탑의 흔적을, `evidence.last-will`로 감춘 계승 문서를 조사한다. 기록을 긁는 장면은 목격하지 않았다.
- 오스윈: `evidence.burnt-will`로 일곱 번째 봉투를, `evidence.minister-dispatch`로 기록고 방문을, `evidence.black-cloth`와 `evidence.repaired-coat`로 소매 조각을 대조한다. 문서함을 맡기거나 태우는 장면은 보지 않았다.
- 아녜스: `evidence.annulment-draft`로 모자 분리 우려를, `evidence.second-glass`와 `evidence.sedative-prescription`으로 약갑을, `evidence.mud-print`로 늦은 이동을, `evidence.broken-seal`로 망토의 고리를 대조한다. 술에 약을 넣거나 살해하는 장면은 보지 않았다.

## 루시엔의 세 카드

| 카드 | 역할 | 대조 |
| --- | --- | --- |
| physician-limits | 붉은 진정액과 백색 수면제의 구분 | 약제 반출 장부·수면제 처방전·독성 검시 |
| head-examination | 과거 후두부 병력과 새 외상의 구분 | 진료부·현장 충돌 자국·외표 검시 |
| residue-examination | 붓꽃 향에 대한 과거 반응 | 혼인조약서·향분 표본·기도 검시 |

의료 증언은 병력으로 조사할 가능성을 제시한다. 사망 시점과 사인을 단독 확정하지 않는다. 법적 출생 등록은 혈연 판정이 아니며 불임 진단도 없다는 정보는 진료부 증거로 옮겼다.

## 정리한 여섯 카드

| 제외한 원본 | 정리 이유 / 남긴 정보 |
| --- | --- |
| apothecary-counter | 병을 받은 인물 식별을 marta-recall에 통합 |
| study-servant | 카시안 탐문의 초점을 벗어나는 이사벨 첫 방문 목격. 투약 경로는 약갑·술잔·처방전으로 유지 |
| archive-copyist | 종이를 접어 넣은 목격을 archivist에 통합 |
| tailor | 종 뒤 기록고 행적을 night-attendant에 통합 |
| agnes-locked-door | 첫 귀환을 agnes-unanswered-calls에 통합 |
| old-midwife | 의료 사건 조사와 떨어진 등록 해석을 evidence.physician-log로 이관 |

## 목격 범위와 선택 규칙

- 니콜의 22:56 답변은 그 시점만 보증한다. 계속 문 앞에 있지는 않았다.
- 엘리안은 22:52 탑 아래 관리대에서 열쇠를 건네고 23:00 같은 곳에서 돌려받는다.
- 마르타는 22:56 소각 뒤 화로 출입문 앞에서 손끝을 본다. 아녜스는 23:00 귀환 뒤 옷을 갈아입기 전에 젖은 소매를 본다.
- locationId는 조사 구역 연결이지 모든 목격이 일어난 한 방이 아니다.
- 현재 같은 라운드 NPC 중복 금지와 개인 재방문 금지는 유지되어 있다. 의심 대상의 자유 선택을 위해 이 규칙은 별도로 재설계할 쟁점이다.
