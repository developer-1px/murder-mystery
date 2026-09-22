import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation } from 'react-router'
import { CardLibrary } from './components/CardLibrary'
import { CharacterSettings } from './components/CharacterSettings'
import { CommonSetting } from './components/CommonSetting'
import { IssueBoard } from './components/IssueBoard'
import { TablePage } from './components/TablePage'
import { PlayTablePage } from './components/PlayTablePage'
import { TimelineBoard } from './components/TimelineBoard'
import { DeductionAudit } from './components/DeductionAudit'
import { CourtSimulator } from './components/CourtSimulator'
import { MissingRoute, RouteTools } from './routing'
import { cardRoleAudit, characterSettings, commonSetting, deductionAudit, inspectionCards, issueGroups, memoryStages, npcGroups, releasePlan, scenario, timeline, validationIssues } from './scenario/load'

export function WorkbenchRoutes() {
  const { pathname } = useLocation()
  const playing = pathname === '/table' || pathname.startsWith('/table/play/')
  const health = <span className={`health ${validationIssues.some((issue) => issue.severity === 'error') ? 'health--error' : ''}`}><i />{validationIssues.length ? `검증 ${validationIssues.length}건` : '시나리오 정상'}</span>
  const navigation = <nav className="workspace-tabs" aria-label="작업 공간">
          <NavLink to="/setting">공통 설정</NavLink>
          <NavLink to="/characters">인물 설정</NavLink>
          <NavLink to="/table">게임 테이블</NavLink>
          <NavLink to="/library">카드 라이브러리</NavLink>
          <NavLink to="/issues">쟁점 연결</NavLink>
          <NavLink to="/timeline">타임라인</NavLink>
          <NavLink to="/deduction">추리 검증</NavLink>
          <NavLink to="/court-simulator">재판 시뮬레이터</NavLink>
        </nav>
  return <main className={`app-shell app-shell--workbench${playing ? ' app-shell--play' : ''}`}>
    <div className="workbench-float">
      <h1 className="sr-only">{scenario.meta.title}</h1>
      <button className="workbench-launcher" popoverTarget="workbench-menu" aria-label="작업 공간 메뉴"><span aria-hidden="true">♛</span>{scenario.meta.title}<span aria-hidden="true">⌄</span></button>
      <div id="workbench-menu" className="workbench-menu" popover="auto">
        <header><span className="eyebrow">WORKBENCH</span>{health}</header>
        {navigation}<RouteTools />
      </div>
    </div>
    <Routes>
      <Route path="/" element={<Navigate replace to="/table" />} />
      <Route path="/setting" element={<CommonSetting document={commonSetting} />} />
      <Route path="/characters/:characterId?" element={<CharacterSettings settings={characterSettings} />} />
      <Route path="/library" element={<CardLibrary scenario={scenario} issues={validationIssues} npcGroups={npcGroups} memoryStages={memoryStages} />} />
      <Route path="/library/cards/:cardId" element={<CardLibrary scenario={scenario} issues={validationIssues} npcGroups={npcGroups} memoryStages={memoryStages} />} />
      <Route path="/issues/:groupId?" element={<IssueBoard scenario={scenario} document={issueGroups} deduction={deductionAudit} inspectionCards={inspectionCards} />} />
      <Route path="/issues/:groupId/cards/:cardId" element={<IssueBoard scenario={scenario} document={issueGroups} deduction={deductionAudit} inspectionCards={inspectionCards} />} />
      <Route path="/timeline" element={<TimelineBoard scenario={scenario} document={timeline} />} />
      <Route path="/timeline/cards/:cardId" element={<TimelineBoard scenario={scenario} document={timeline} />} />
      <Route path="/deduction" element={<DeductionAudit scenario={scenario} document={deductionAudit} npcGroups={npcGroups} releasePlan={releasePlan} memoryStages={memoryStages} inspectionCards={inspectionCards} />} />
      <Route path="/court-simulator" element={<CourtSimulator scenario={scenario} npcGroups={npcGroups} memoryStages={memoryStages} inspectionCards={inspectionCards} roleAudit={cardRoleAudit} />} />
      <Route path="/table" element={<PlayTablePage />} />
      <Route path="/table/play/:branchId/steps/:step" element={<PlayTablePage />} />
      <Route path="/table/play/:branchId" element={<PlayTablePage />} />
      <Route path="/table/archive" element={<TablePage />} />
      <Route path="/table/:branchId" element={<TablePage />} />
      <Route path="/table/:branchId/steps/:step" element={<TablePage />} />
      <Route path="*" element={<MissingRoute />} />
    </Routes>
  </main>
}

export default function App() {
  return <BrowserRouter><WorkbenchRoutes /></BrowserRouter>
}
