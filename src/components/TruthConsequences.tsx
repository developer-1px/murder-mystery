import type { CharacterFinalAction } from '../domain/types'

export function TruthConsequences({ truth }: { truth: CharacterFinalAction }) {
  return <dl className="truth-consequences">
    {truth.plea && <div><dt>묻어 달라고 설득할 말</dt><dd>{truth.plea}</dd></div>}
    {truth.counterReading && <div><dt>다른 단서와 맞추면</dt><dd>{truth.counterReading}</dd></div>}
    <div><dt>공개된 뒤의 세계</dt><dd>{truth.omen}</dd></div>
    {truth.buriedOutcome && <div><dt>묻힌 뒤의 세계</dt><dd>{truth.buriedOutcome}</dd></div>}
  </dl>
}
