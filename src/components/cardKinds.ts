import type { CardKind } from '../domain/types'

export const cardKinds = {
  memory: { label: '묻어야 하는 진실', backLabel: '묻어야 하는 진실', description: '각 인물이 두 장씩 받습니다. 같은 뒷면으로 교환하며, 마지막에 하나는 밝히고 하나는 묻습니다.' },
  rumor: { label: '소문', backLabel: '공용 소문', description: '카더라는 공개된 갈등에 붙은 뒷말, 수소문은 이름을 알 수 없는 목격자의 수상한 행동과 시간 단서입니다.' },
  evidence: { label: '증거', backLabel: '장소 조사', description: '장소에서 확보한 사물·문서·채취물의 상태를 기록합니다. 다른 단서와 맞춰 해석합니다.' },
  testimony: { label: '탐문', backLabel: 'NPC 탐문', description: '가까이서 섬긴 인물이 직접 보거나 들은 내용입니다. 관찰 범위와 시점을 확인하세요.' },
  inspection: { label: '검시', backLabel: '검시 요청', description: '로웬이 검시관에게 항목을 요청한 뒤 받는 소견입니다.' },
} satisfies Record<CardKind, { label: string; backLabel: string; description: string }>
