import type { CardKind } from '../domain/types'

export const cardKinds = {
  memory: { label: '기억', backLabel: '개인 기억', description: '각 인물만 알고 시작하는 행동과 비밀. 해당 인물의 손패에서 시작합니다.' },
  rumor: { label: '소문', backLabel: '공용 소문', description: '궁정에 떠도는 이야기. 사람과 장소를 조사할 실마리가 됩니다.' },
  evidence: { label: '물증', backLabel: '장소 조사', description: '현장에서 확보하는 문서와 흔적. 다른 단서와 맞춰 해석합니다.' },
  testimony: { label: '증언', backLabel: 'NPC 탐문', description: '목격자가 직접 보거나 들은 내용. 관찰 범위와 시간을 확인하세요.' },
} satisfies Record<CardKind, { label: string; backLabel: string; description: string }>
