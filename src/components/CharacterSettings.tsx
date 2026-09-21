import { Link, useParams } from 'react-router'
import type { CharacterSetting } from '../domain/types'
import { MissingRoute, SectionLink, sectionId, segment } from '../routing'

interface CharacterSettingsProps {
  settings: CharacterSetting[]
}

export function CharacterSettings({ settings }: CharacterSettingsProps) {
  const { characterId: selectedId } = useParams()
  const selected = settings.find((setting) => setting.id === selectedId)

  if (selectedId && !selected) return <MissingRoute message={`인물 “${selectedId}”을 찾을 수 없습니다.`} to="/characters" label="인물 목록으로" />

  if (!selected) return (
    <section className="character-settings character-settings--locked">
      <span className="eyebrow">PRIVATE CHARACTER FILES</span>
      <h2>비공개 인물 설정서</h2>
      <p>자신이 맡은 인물만 선택하십시오. 설정서를 연 뒤에는 다른 플레이어에게 화면을 보여주지 마십시오.</p>
      <div className="character-setting-picker">
        {settings.map((setting) => (
          <Link key={setting.id} to={`/characters/${segment(setting.id)}`}>
            <strong>{setting.name}</strong><span>{setting.role}</span>
          </Link>
        ))}
      </div>
    </section>
  )

  return (
    <article className="character-settings">
      <header className="character-setting__hero">
        <div>
          <span className="eyebrow">이 설정서는 다른 플레이어에게 보여주지 마십시오</span>
          <h2>{selected.name}</h2>
          <p>{selected.role}</p>
        </div>
        <Link className="button-link" to="/characters">설정서 닫기</Link>
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
          <span><SectionLink id="objective">지금 원하는 것</SectionLink></span>
          <strong>{selected.objective}</strong>
        </section>
        <section className="character-setting__scores" id="scores">
          <header><span>+</span><h3><SectionLink id="scores">승리와 파멸</SectionLink></h3></header>
          <p>{selected.scoreGuide}</p>
          <div className="character-setting__score-columns">
            <ScoreTable title="내가 만들고 싶은 미래" conditions={selected.victoryConditions} />
            <ScoreTable title="반드시 피해야 할 파멸" conditions={selected.ruinConditions} />
          </div>
        </section>
        <section className="character-setting__actions" id="final-actions">
          <header><span>→</span><h3><SectionLink id="final-actions">마지막 진실 결정</SectionLink></h3></header>
          <p>최종 기소 직전, 가진 타인의 진실 중 하나는 세상에 밝히고 하나는 끝까지 묻습니다. 자신의 진실을 되돌려 받았거나 기소되면 보호하려던 진실은 모두 밝혀집니다.</p>
          <p>최종 재판이 끝나면 아래 행동 중 하나를 언제든 선택해 뒷면으로 냅니다. 모두가 선택한 뒤 동시에 공개하며, 기소와 진실이 이 행동을 어디로 이끄는지는 선택하기 전에 설명하지 않습니다.</p>
          <div>
            {selected.finalActions.map((action) => <article key={action.title}>
              <span>운명의 선택</span><h4>{action.title}</h4><p>{action.intent}</p><blockquote>“{action.omen}”</blockquote>
            </article>)}
          </div>
        </section>
      </div>
    </article>
  )
}

function ScoreTable({ title, conditions }: { title: string; conditions: CharacterSetting['victoryConditions'] }) {
  return <div><h4>{title}</h4><table><tbody>{conditions.map((condition) => <tr key={condition.result}><td>{condition.result}</td><th>{condition.score > 0 ? '+' : ''}{condition.score}</th></tr>)}</tbody></table></div>
}
