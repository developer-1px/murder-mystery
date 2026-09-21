import type { CommonSettingDocument } from '../domain/types'
import { SectionLink, sectionId } from '../routing'

interface CommonSettingProps {
  document: CommonSettingDocument
}

export function CommonSetting({ document }: CommonSettingProps) {
  return (
    <article className="common-setting">
      <header className="common-setting__hero" id="setting-intro">
        <span className="eyebrow">{document.eyebrow}</span>
        <h2><SectionLink id="setting-intro">{document.title}</SectionLink></h2>
        <div>{document.lead.map((paragraph, index) => <p key={paragraph} id={`setting-intro-p${index + 1}`}>{paragraph}<SectionLink id={`setting-intro-p${index + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}</div>
      </header>

      <nav className="common-setting__contents" aria-label="공통 설정 목차">
        {document.sections.map((section, index) => (
          <a key={section.id} href={`#setting-${section.id}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>{section.title}
          </a>
        ))}
      </nav>

      <div className="common-setting__body">
        {document.sections.map((section, index) => (
          <section id={`setting-${section.id}`} className="setting-section" key={section.id}>
            <header>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div><h3><SectionLink id={`setting-${section.id}`}>{section.title}</SectionLink></h3><p>{section.summary}</p></div>
            </header>
            {section.entries && <div className="setting-entries">
              {section.entries.map((entry) => <article key={entry.title} id={sectionId(`setting-${section.id}`, entry.title)}>
                <small>{entry.subtitle}</small>
                <h4><SectionLink id={sectionId(`setting-${section.id}`, entry.title)}>{entry.title}</SectionLink></h4>
                {entry.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraph} id={`${sectionId(`setting-${section.id}`, entry.title)}-p${paragraphIndex + 1}`}>{paragraph}<SectionLink id={`${sectionId(`setting-${section.id}`, entry.title)}-p${paragraphIndex + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}
              </article>)}
            </div>}
            {section.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraph} id={`setting-${section.id}-p${paragraphIndex + 1}`}>{paragraph}<SectionLink id={`setting-${section.id}-p${paragraphIndex + 1}`}><span className="sr-only">문단 링크</span></SectionLink></p>)}
            {section.questions && <div className="setting-questions">
              {section.questions.map((question, questionIndex) => <strong key={question} id={`setting-${section.id}-q${questionIndex + 1}`}><SectionLink id={`setting-${section.id}-q${questionIndex + 1}`}>{question}</SectionLink></strong>)}
            </div>}
          </section>
        ))}
      </div>
    </article>
  )
}
