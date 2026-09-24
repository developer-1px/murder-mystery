import { Anchor } from '../design-system/controls'
import { Icon } from '../design-system/Icon'
import { Link } from 'react-router'
import type { CardKind } from '../domain/types'
import { getCardGroups } from '../scenario/cardGroups'
import { inspectionCards, memoryStages, npcGroups, scenario } from '../scenario/load'
import { SectionLink } from '../routing'
import { CardView } from './CardView'
import './card-guide.css'

const descriptions: Array<{
  kind: CardKind
  title: string
  description: string
  caption: string
  rules: string[]
  emphasis?: string
}> = [
  {
    kind: 'rumor', title: '소문', description: '궁 안에 퍼진 소문입니다.',
    caption: '소문 덱',
    rules: ['매 라운드 3장을 읽고 1장을 손패로 가져갑니다. 고르지 않은 카드는 덱에 남습니다.', '소문도 교환하거나 재판에 제출할 수 있습니다.'],
  },
  {
    kind: 'testimony', title: '탐문', description: 'NPC의 증언입니다.',
    caption: '뒷면의 이름과 직책으로 증언자를 구분합니다.',
    rules: ['로웬을 포함한 전원이 매 라운드 NPC 1명을 골라 증언 2장 중 1장을 가져갑니다. 나머지는 덱에 남습니다.', '이번 라운드에 다른 사람이 고른 NPC와 자신이 이전에 만난 NPC는 고를 수 없습니다.'],
  },
  {
    kind: 'evidence', title: '증거', description: '장소 조사로 얻는 단서입니다.',
    caption: '뒷면의 조사 구역으로 덱을 구분합니다. 한 구역에는 여러 방과 수거물이 포함됩니다.',
    rules: ['장소마다 증거 8장이 있습니다. 자기 차례에 장소를 골라 혼자 2장을 보고 1장을 가져갑니다. 1장만 남으면 그 카드를 가져갑니다.', '고르지 않은 카드는 덱 아래로 넣습니다. 같은 장소를 골라도 각자 따로 조사하며, 획득한 증거는 재판에 제출하기 전까지 비공개입니다.'],
  },
  {
    kind: 'inspection', title: '검시', description: '로웬이 요청한 검시 결과입니다.',
    caption: '뒷면에 요청할 검시 항목이 적혀 있습니다.',
    rules: ['로웬이 매 라운드 1항목을 요청합니다. 첫 검시는 시신 전반이며, 이후에는 남은 항목 중에서 고릅니다.', '로웬이 먼저 읽고 해당 재판이 시작될 때 자동 공개합니다.', '개인 손패의 교환·제출 대상이 아닙니다. 로웬도 재판에는 별도의 일반 단서 1장을 제출합니다.'],
  },
  {
    kind: 'memory', title: '묻어야 할 진실', description: '각 인물의 비밀이 담긴 카드입니다.',
    caption: '모두 같은 뒷면입니다. 주인과 내용은 구분할 수 없습니다.',
    emphasis: '자신의 진실은 묻을 수 없습니다. 다른 사람과 1장씩 교환하세요.',
    rules: ['시작할 때 자신의 진실 2장을 받습니다. 재판에 제출하거나 일반 단서와 바꾸거나 일방적으로 넘길 수 없습니다.', '매 재판 뒤 차례대로 다른 한 사람과 뒷면으로 1:1 교환합니다. 내용은 교환 뒤 확인하며, 이번 교환은 건너뛸 수 있습니다.', '받은 진실은 다시 교환할 수 있습니다. 단, 로웬은 자신의 진실만 내보낼 수 있어 타인의 진실을 받으면 계속 보관합니다.', '세 번째 교환 뒤, 범인 지목 전에 밝힐 1장과 묻을 1장을 비공개로 정합니다.', '최종 기소 뒤, 기소된 사람이 가진 진실은 모두 공개합니다. 나머지는 미리 정한 선택을 따르되 자신의 진실이 자기 손에 있으면 반드시 공개합니다.'],
  },
]

export function CardGuide() {
  const groups = getCardGroups(scenario, npcGroups, memoryStages)
  return <article className="card-guide">
    <header className="card-guide__header">
      <span className="eyebrow">왕관재판 · 카드 안내</span>
      <h2>카드 설명</h2>
      <p>카드 종류별 획득·교환·공개 규칙입니다.</p>
      <Link to="/guide">전체 진행 순서 보기 <Icon name="arrowRight" /></Link>
    </header>
    <nav className="card-guide__contents" aria-label="카드 종류">
      {descriptions.map(({ kind, title }) => <Anchor key={kind} href={`#cards-${kind}`}>{title}</Anchor>)}
    </nav>
    <aside className="card-guide__common ui-panel" aria-labelledby="cards-common-rules">
      <h3 id="cards-common-rules">소문·탐문·증거의 공통 규칙</h3>
      <ol>
        <li>손패의 일반 단서는 자유롭게 교환할 수 있습니다. 장수 제한은 없습니다.</li>
        <li>매 재판에 각자 일반 단서 1장을 제출합니다. 제출한 카드는 손패에서 빠지고 공개 기록에 남습니다.</li>
        <li>첫째·둘째 재판에는 제출자가 상대를 정해 묻고 답합니다. 셋째 재판에는 카드만 제출합니다.</li>
      </ol>
    </aside>
    <div className="card-guide__kinds">
      {descriptions.map((entry) => {
        const group = groups.find(group => group.kind === entry.kind && group.cards.length > 0)
        const card = entry.kind === 'inspection' ? inspectionCards[0] : group?.cards[0]
        if (!card) return null
        return <section className="card-guide__kind" id={`cards-${entry.kind}`} key={entry.kind}>
          <figure>
            <CardView card={card} faceDown backTitle={entry.kind === 'inspection' ? '검시 요청' : group?.backTitle} backSubtitle={entry.kind === 'inspection' ? card.title : group?.backSubtitle} backLabel={`${entry.title} 카드 뒷면 예시`} />
            <figcaption>{entry.caption}</figcaption>
          </figure>
          <div>
            <h3><SectionLink id={`cards-${entry.kind}`}>{entry.title}</SectionLink></h3>
            <p className="card-guide__description">{entry.description}</p>
            {entry.emphasis && <p className="card-guide__emphasis ui-notice"><strong>{entry.emphasis}</strong></p>}
            <ol>{entry.rules.map(rule => <li key={rule}>{rule}</li>)}</ol>
          </div>
        </section>
      })}
    </div>
  </article>
}
