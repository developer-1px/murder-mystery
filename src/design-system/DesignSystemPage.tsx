import { Icon, iconNames } from './Icon'
import { useState } from 'react'
import { Button, Input, Select, Disclosure, DisclosureSummary, Anchor } from './controls'
import { CardView } from '../components/CardView'
import { scenario } from '../scenario/load'

/** Live Usage: imports the same controls and card renderer as the game. */
export function DesignSystemPage() {
  const [selected, setSelected] = useState('증거')
  const [status, setStatus] = useState('카드를 선택하면 다음 행동을 진행할 수 있습니다.')
  return <article className="design-system">
    <header><span className="eyebrow">왕관재판 · 공용 디자인</span><h2>읽고, 선택하고, 결정하기</h2><p>짙은 녹색 테이블 위에 종이 카드를 놓고, 금색으로 다음 행동과 현재 선택을 표시합니다.</p></header>
    <section><h3>행동</h3><div className="design-system__controls">
      <Button variant="primary" onClick={() => setStatus('증거를 제출했습니다.')}>이 증거 제출하기 <Icon name="arrowRight" /></Button>
      <Button onClick={() => setStatus('선택한 카드를 다시 살펴봅니다.')}>다시 살펴보기</Button>
      <Button variant="ghost" onClick={() => setStatus('이번 선택을 취소했습니다.')}>취소</Button>
      <Button disabled>선택 후 진행</Button>
      <Button size="compact" aria-label="이전 선택으로 되돌리기" onClick={() => setStatus('카드를 선택하면 다음 행동을 진행할 수 있습니다.')}><Icon name="undo" />되돌리기</Button>
    </div><p className="ui-notice" role="status">{status}</p></section>
    <section><h3>선택과 입력</h3><div className="design-system__controls" role="group" aria-label="카드 종류 예시">{['소문', '증거', '탐문'].map(kind => <Button key={kind} variant="choice" aria-pressed={selected === kind} onClick={() => setSelected(kind)}>{kind}</Button>)}</div>
      <div className="design-system__controls"><label>카드 검색<Input type="search" placeholder="인물 · 장소 · 단서" /></label><label>라운드<Select defaultValue="1"><option value="1">첫 번째 라운드</option><option value="2">두 번째 라운드</option></Select></label></div>
    </section>
    <section className="design-system__surfaces"><div className="ui-panel"><h3>진행 패널</h3><p>버튼과 상태를 모으는 녹색 패널입니다.</p><p className="ui-notice" data-tone="warning">아직 제출할 카드를 선택하지 않았습니다.</p></div><div className="ui-paper"><h3>이야기를 읽는 종이</h3><p>“평의회가 오기 전에, 이 사건은 제 손으로 끝내겠습니다.”</p></div></section>
    <section><h3>목차와 접기·펼치기</h3><Anchor href="#icons">아이콘 목록으로</Anchor><Disclosure><DisclosureSummary>공개된 인물 정보</DisclosureSummary><p>키보드와 마우스로 열 수 있으며, 열림 상태는 화면의 주소와 연결할 수도 있습니다.</p></Disclosure></section>
    <section id="icons"><h3>SVG 아이콘</h3><p>Lucide · 18px 기본 크기 · 1.75 선 굵기 · 주변 글자색을 따릅니다. <a href="/licenses/lucide.txt">라이선스 고지</a></p><div className="design-system__icons">{iconNames.map(name => <div key={name}><Icon name={name} size={24} /><span>{name}</span></div>)}</div></section>
    <section><h3>단서 카드</h3><p>게임과 같은 CardView를 사용합니다. 종류별 색, 앞뒷면과 본문 맞춤은 카드 모듈이 담당합니다.</p><div className="design-system__cards">{(['memory','rumor','evidence','testimony'] as const).map(kind => { const card = scenario.cards.find(card => card.kind === kind)!; return <CardView key={kind} card={card} /> })}</div></section>
  </article>
}
