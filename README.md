# Murder Mystery Workbench

AI가 생성한 머더 미스터리 시나리오를 검증하고 카드 기반으로 시험하는 워크벤치입니다. Phase 1에는 《왕관재판》 한 라운드의 카드 라이브러리와 수동 테스트 실행이 포함됩니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://127.0.0.1:4173`을 엽니다.

## 시나리오 수정

정본 데이터는 `scenarios/crown-trial/`의 분할 JSON입니다. 파일을 수정하면 개발 서버가 화면을 다시 불러오며, `schemas/`의 JSON Schema와 의미 검증기가 잘못된 타입·참조·도달 불가 카드를 보고합니다.

```text
scenarios/crown-trial/
├── scenario.json
├── characters.json
├── cards.json
├── locations.json
└── rules.json
```

## 검증

```bash
npm run typecheck
npm test
npm run build
```
