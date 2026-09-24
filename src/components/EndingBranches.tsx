import { Button } from '../design-system/controls'
import { useRef, useState } from 'react'
import { endingStories } from './endingStories'
import './ending-branches.css'

export function EndingBranches() {
  const [selectedId, setSelectedId] = useState(endingStories[0].id)
  const storyRef = useRef<HTMLElement>(null)
  const selected = endingStories.find(story => story.id === selectedId) ?? endingStories[0]

  function chooseStory(id: string) {
    setSelectedId(id)
    requestAnimationFrame(() => storyRef.current?.scrollIntoView({ block: 'start' }))
  }

  return <article className="ending-branches">
    <header className="ending-branches__hero ui-panel">
      <span className="eyebrow">왕관재판 · 제작자용 엔딩북</span>
      <h2>왕관재판의 여덟 결말</h2>
      <p>재판이 끝나면 궁에는 새 왕을 맞을 준비가 시작됩니다. 누군가는 왕관을 받고, 누군가는 평생 쥐었던 인장을 내려놓습니다. 그 밤에 드러난 진실과 끝내 하지 않은 말은 여섯 사람의 삶에 남습니다. 이 책은 그들이 맞이한 여덟 번의 봄을 기록합니다.</p>
      <div className="ending-branches__counts" aria-label="집필된 엔딩 세계선">
        <div><strong>{endingStories.length}</strong><span>완결된 세계선</span></div>
        <div><strong>{endingStories.filter(story => story.accused === '이사벨').length}</strong><span>진범 기소 뒤의 계승</span></div>
        <div><strong>{endingStories.filter(story => story.accused !== '이사벨').length}</strong><span>오기소 뒤의 결말</span></div>
      </div>
      <p className="ending-branches__count-note">여덟 편은 모든 카드 조합의 경우의 수가 아니라, 실제 선택과 결과를 끝까지 서술한 대표 엔딩입니다. 여기서 ‘발각’은 그 인물 자신의 진실 두 장이 모두 공개된 경우입니다. 각 편에는 성립 조건과 여섯 사람의 그 뒤가 함께 적혀 있습니다.</p>
      <p className="ending-branches__count-note">선왕의 숨긴 본문은 세라핀의 심의권을 보장할 뿐 즉위 순위를 정하지 않습니다. 각 세계선의 평의회는 후보의 자격과 동의, 아이의 법적 대리, 통치 협약을 확인한 뒤 왕위 또는 섭정을 확정합니다. 오기소가 뒤에 바로잡혀도 그날의 기소와 그때 잃은 자리는 사라지지 않습니다.</p>
    </header>

    <div className="ending-branches__layout">
      <nav className="ending-branches__chapters" aria-label="엔딩 세계선 선택">
        <h3>세계선 목차</h3>
        {endingStories.map(story => <Button variant="choice"
          type="button"
          key={story.id}
          className="ending-branches__chapter"
          aria-pressed={selected.id === story.id}
          aria-controls="ending-branches-story"
          onClick={() => chooseStory(story.id)}
        >
          <span className="ending-branches__chapter-number">{story.number}</span>
          <span className="ending-branches__chapter-body"><strong>{story.title}</strong><small>{story.subtitle}</small><em>기소 {story.accused} · 발각 {story.discovered}</em><em>왕위 {story.crown}</em></span>
        </Button>)}
      </nav>

      <section ref={storyRef} id="ending-branches-story" className="ending-branches__story ui-paper" aria-live="polite" aria-label={`${selected.title} 엔딩`}>
        <header className="ending-branches__story-head">
          <span className="eyebrow">엔딩 {selected.number}</span>
          <h3>{selected.title}</h3>
          <p>{selected.subtitle}</p>
          <div className="ending-branches__verdicts">
            <span>기소 <strong>{selected.accused}</strong></span>
            <span>발각 <strong>{selected.discovered}</strong></span>
            <span>왕위 <strong>{selected.crown}</strong></span>
          </div>
        </header>

        <div className="ending-branches__premise">
          <div><h4>기록에 남은 사실</h4><ul>{selected.publicRecord.map(item => <li key={item}>{item}</li>)}</ul></div>
          <div><h4>그 뒤에 내린 선택</h4><ul>{selected.decisions.map(item => <li key={item}>{item}</li>)}</ul></div>
        </div>

        <div className="ending-branches__narrative">
          <section><h4>그날 밤</h4>{selected.opening.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>
          <section><h4>왕관 앞에서</h4>{selected.turningPoint.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>
          <section><h4>그다음 해</h4>{selected.aftermath.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>
        </div>

        <div className="ending-branches__people">
          <h4>여섯 사람의 그 뒤</h4>
          <dl>{selected.people.map(person => <div key={person.name}><dt>{person.name}</dt><dd>{person.ending}</dd></div>)}</dl>
        </div>
        <blockquote>{selected.lastLine}</blockquote>
      </section>
    </div>
  </article>
}
