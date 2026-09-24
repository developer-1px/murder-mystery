import { Link, useParams } from 'react-router'
import type { CharacterSetting } from '../domain/types'
import { MissingRoute, SectionLink, sectionId, segment } from '../routing'
import { scenario } from '../scenario/load'
import './character-settings.css'
import type { ReactNode } from 'react'
import { CardView } from './CardView'

interface CharacterSettingsProps {
  settings: CharacterSetting[]
  characterId?: string
  onBack?: () => void
  footer?: ReactNode
}

export function CharacterSettings({ settings, characterId, onBack, footer }: CharacterSettingsProps) {
  const { characterId: routeCharacterId } = useParams()
  const selectedId = characterId ?? routeCharacterId
  const selected = settings.find((setting) => setting.id === selectedId)
  const publicCharacter = scenario.characters.find((character) => character.id === selectedId)

  if (selectedId && !selected) return <MissingRoute message={`인물 “${selectedId}”을 찾을 수 없습니다.`} to="/characters" label="인물 목록으로" />

  if (!selected) return (
    <section className="character-settings character-settings--locked">
      <header className="character-gallery-heading">
        <span className="eyebrow">왕관재판 · 등장인물</span>
        <h2>왕관을 둘러싼 여섯 사람</h2>
        <p>같은 왕을 맞이할 예정이었던 이들. 이제 서로의 지난밤을 물어야 한다.</p>
      </header>
      <p className="character-gallery-note">소개는 함께 읽으셔도 좋습니다. 설정서는 자신이 맡은 인물만 열어 주세요.</p>
      <div className="character-setting-picker">
        {settings.map((setting, index) => {
          const character = scenario.characters.find(item => item.id === setting.id)
          return <Link className="character-setting-picker__card" key={setting.id} to={`/characters/${segment(setting.id)}`}>
            <header><span className="character-number">{String(index + 1).padStart(2, '0')}</span></header>
            <h3>{character?.name ?? setting.name}</h3>
            <p className="character-setting-picker__role">{character?.title}</p>
            <blockquote>“{character?.publicQuote}”</blockquote>
            <footer><span className="character-open">설정서 읽기 <span aria-hidden="true">↗</span></span></footer>
          </Link>
        })}
      </div>
    </section>
  )

  return (
    <article className="character-settings">
      <nav className="character-detail-nav">{onBack ? <button type="button" onClick={onBack}>← 다른 인물 선택</button> : <Link to="/characters">← 인물 소개로</Link>}<span>비공개 설정서 · 자신이 맡은 인물만 읽어 주세요</span></nav>
      <header className="character-setting__hero">
        <div className="character-setting__hero-copy">
          <span className="eyebrow">왕관재판 · 인물 설정</span>
          <blockquote>“{publicCharacter?.publicQuote}”</blockquote>
          <h2>{publicCharacter?.name ?? selected.name}</h2>
          <p>{publicCharacter?.title}</p>
        </div>
      </header>

      <div className="character-setting__body">
        {selected.sections.map((section, index) => (
          <section key={section.title} id={sectionId('section', section.title)}>
            <header><span>{String(index + 1).padStart(2, '0')}</span><h3><SectionLink id={sectionId('section', section.title)}>{section.title}</SectionLink></h3></header>
            {section.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraph} id={`${sectionId('section', section.title)}-p${paragraphIndex + 1}`}>{paragraph}<SectionLink id={`${sectionId('section', section.title)}-p${paragraphIndex + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}
            {section.relations && <dl>
              {section.relations.map((relation) => <div key={relation.name} id={sectionId('relation', relation.name)}>
                <dt><SectionLink id={sectionId('relation', relation.name)}>{relation.name}</SectionLink></dt><dd>{relation.description}</dd>
              </div>)}
            </dl>}
            {section.points && <ul>{section.points.map((point, pointIndex) => <li key={point} id={`${sectionId('section', section.title)}-point${pointIndex + 1}`}>{point}<SectionLink id={`${sectionId('section', section.title)}-point${pointIndex + 1}`}><span className="sr-only">항목 링크</span></SectionLink></li>)}</ul>}
          </section>
        ))}
        <section className="character-setting__objective" id="objective">
          <span><SectionLink id="objective">당신이 지키려는 것</SectionLink></span>
          <strong>{selected.objective}</strong>
        </section>
        <section className="character-setting__scores" id="scores">
          <header><span>◇</span><h3><SectionLink id="scores">당신의 신념</SectionLink></h3></header>
          <p>{selected.belief}</p>
          <ul>{selected.goals.map(goal => <li key={goal}>{goal}</li>)}</ul>
          <p>모두의 공통 목표는 실제 진범을 알아내는 것입니다. 당신의 선택이 지키려던 것을 지켰는지는 그와 별개로 남습니다.</p>
        </section>
        <section className="character-setting__actions" id="final-actions">
          <header><span>→</span><h3><SectionLink id="final-actions">묻어야 할 진실</SectionLink></h3></header>
          <p>당신의 두 진실이 모두 공개되면 ‘발각’되어 가장 두려워한 대가를 치릅니다. 그래도 지키려던 것까지 잃는지는 아직 정해지지 않았습니다.</p>
          <p>자기 진실은 직접 묻을 수 없습니다. 뒷면으로 한 장씩 교환해 맡기면, 공개할지는 받은 사람이 정합니다.</p>
          <div>
            {selected.finalActions.map((action) => {
              const card = scenario.cards.find(card => card.id === action.id)
              return <article className="character-setting__truth" key={action.id}>
                {card ? <CardView card={card} /> : <h4>{action.title}</h4>}<p>{action.intent}</p>
              </article>
            })}
          </div>
        </section>
      </div>
      {footer}
    </article>
  )
}
