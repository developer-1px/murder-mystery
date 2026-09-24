import type { CommonSettingDocument } from '../domain/types'
import { SectionLink, sectionId } from '../routing'

interface CommonSettingProps {
  document: CommonSettingDocument
  guide?: boolean
}

export function CommonSetting({ document, guide = false }: CommonSettingProps) {
  return (
    <article className={`common-setting${guide ? " common-setting--guide" : " common-setting--story"}`}>
      <header className="common-setting__hero" id="setting-intro">
        <span className="eyebrow">{document.eyebrow}</span>
        <h2><SectionLink id="setting-intro">{document.title}</SectionLink></h2>
        <div>{document.lead.map((paragraph, index) => <p key={paragraph} id={`setting-intro-p${index + 1}`}>{paragraph}<SectionLink id={`setting-intro-p${index + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}</div>
      </header>

      {document.sections.length > 0 && <nav className="common-setting__contents" aria-label={guide ? "게임 진행 목차" : "공통 설정 목차"}>
        {document.sections.map((section, index) => (
          <a key={section.id} href={`#setting-${section.id}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>{section.title}
          </a>
        ))}
      </nav>}

      <div className="common-setting__body">
        {document.sections.map((section, index) => (
          <section id={`setting-${section.id}`} className="setting-section" key={section.id}>
            <header>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><h3><SectionLink id={`setting-${section.id}`}>{section.title}</SectionLink></h3><p>{section.summary}</p></div>
            </header>
            {section.keyRules && <div className="setting-key-rules" aria-label="핵심 규칙">
              {section.keyRules.map((rule) => <p key={rule}><strong>{rule}</strong></p>)}
            </div>}
            {section.entries && <div className="setting-entries">
              {section.entries.map((entry) => <article key={entry.title} id={sectionId(`setting-${section.id}`, entry.title)}>
                <small>{entry.subtitle}</small>
                <h4><SectionLink id={sectionId(`setting-${section.id}`, entry.title)}>{entry.title}</SectionLink></h4>
                {entry.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraph} id={`${sectionId(`setting-${section.id}`, entry.title)}-p${paragraphIndex + 1}`}>{paragraph}<SectionLink id={`${sectionId(`setting-${section.id}`, entry.title)}-p${paragraphIndex + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}
              </article>)}
            </div>}
            {section.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraph} id={`setting-${section.id}-p${paragraphIndex + 1}`}>{paragraph}<SectionLink id={`setting-${section.id}-p${paragraphIndex + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}
            {section.rules && <aside className="setting-rules" aria-labelledby={`setting-${section.id}-rules`}>
              <h4 id={`setting-${section.id}-rules`}>규칙 요약</h4>
              <ol>{section.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
            </aside>}
            {section.questions && <div className="setting-questions">
              {section.questions.map((question, questionIndex) => <strong key={question} id={`setting-${section.id}-q${questionIndex + 1}`}><SectionLink id={`setting-${section.id}-q${questionIndex + 1}`}>{question}</SectionLink></strong>)}
            </div>}
          </section>
        ))}
      </div>
    </article>
  )
}
