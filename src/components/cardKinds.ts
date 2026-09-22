import type { CardKind } from '../domain/types'

export const cardKinds = {
  memory: { label: '묻어야 하는 진실', backLabel: '묻어야 하는 진실', description: '각 인물이 두 장씩 받습니다. 같은 뒷면으로 교환하며, 마지막에 하나는 밝히고 하나는 묻습니다.' },
  rumor: { label: '소문', backLabel: '공용 소문', description: '궁정에 떠도는 이야기. 사람과 장소를 조사할 실마리가 됩니다.' },
  evidence: { label: '물증', backLabel: '장소 조사', description: '현장에서 확보하는 문서와 흔적. 다른 단서와 맞춰 해석합니다.' },
  testimony: { label: '증언', backLabel: 'NPC 탐문', description: '목격자가 직접 보거나 들은 내용. 관찰 범위와 시간을 확인하세요.' },
  inspection: { label: '검시', backLabel: '검시 요청', description: '로웬이 검시관에게 항목을 요청한 뒤 받는 소견입니다.' },
} satisfies Record<CardKind, { label: string; backLabel: string; description: string }>
