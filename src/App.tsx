import { Icon } from './design-system/Icon'
import { Button, NavigationLink } from './design-system/controls'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { DesignSystemPage } from './design-system/DesignSystemPage'
import { CardLibrary } from './components/CardLibrary'
import { CardGuide } from './components/CardGuide'
import { CharacterSettings } from './components/CharacterSettings'
import { CommonSetting } from './components/CommonSetting'
import { IssueBoard } from './components/IssueBoard'
import { TablePage } from './components/TablePage'
import { PlayTablePage } from './components/PlayTablePage'
import { TimelineBoard } from './components/TimelineBoard'
import { CourtSimulator } from './components/CourtSimulator'
import { EndingBranches } from './components/EndingBranches'
import { MissingRoute, RouteTools } from './routing'
import { cardRoleAudit, characterSettings, commonSetting, playGuide, inspectionCards, issueGroups, memoryStages, npcGroups, scenario, timeline, validationIssues } from './scenario/load'

export function WorkbenchRoutes() {
  const { pathname } = useLocation()
  const playing = pathname === '/table' || pathname.startsWith('/table/play/')
  const health = <span className={`health ${validationIssues.some((issue) => issue.severity === 'error') ? 'health--error' : ''}`}><i />{validationIssues.length ? `검증 ${validationIssues.length}건` : '시나리오 정상'}</span>
  const navigation = <nav className="workspace-tabs" aria-label="작업 공간">
          <NavigationLink to="/setting">공통 설정</NavigationLink>
          <NavigationLink to="/characters">인물 설정</NavigationLink>
          <NavigationLink to="/guide">게임 진행</NavigationLink>
          <NavigationLink to="/cards">카드 설명</NavigationLink>
          <NavigationLink to="/table">게임 테이블</NavigationLink>
          <NavigationLink to="/library">카드 라이브러리</NavigationLink>
          <NavigationLink to="/issues">인물별 카드 구성</NavigationLink>
          <NavigationLink to="/timeline">타임라인</NavigationLink>
          <NavigationLink to="/court-simulator">재판 시뮬레이터</NavigationLink>
          <NavigationLink to="/endings">엔딩 분기</NavigationLink>
          <NavigationLink to="/design-system">디자인 시스템</NavigationLink>
        </nav>
  return <main className={`app-shell app-shell--workbench${playing ? ' app-shell--play' : ''}`}>
    <div className="workbench-float">
      <h1 className="sr-only">{scenario.meta.title}</h1>
      <Button size="compact" className="workbench-launcher" popoverTarget="workbench-menu" aria-label="작업 공간 메뉴"><Icon name="crown" size={22} />{scenario.meta.title}<Icon name="chevronDown" size={16} /></Button>
      <div id="workbench-menu" className="workbench-menu ui-panel" popover="auto">
        <header><span className="eyebrow">WORKBENCH</span>{health}</header>
        {navigation}<RouteTools />
      </div>
    </div>
    <Routes>
      <Route path="/" element={<Navigate replace to="/table" />} />
      <Route path="/setting" element={<CommonSetting document={commonSetting} />} />
      <Route path="/guide" element={<CommonSetting document={playGuide} guide />} />
      <Route path="/cards" element={<CardGuide />} />
      <Route path="/characters/:characterId?" element={<CharacterSettings settings={characterSettings} />} />
      <Route path="/library" element={<CardLibrary scenario={scenario} issues={validationIssues} npcGroups={npcGroups} memoryStages={memoryStages} />} />
      <Route path="/library/cards/:cardId" element={<CardLibrary scenario={scenario} issues={validationIssues} npcGroups={npcGroups} memoryStages={memoryStages} />} />
      <Route path="/issues/:groupId?" element={<IssueBoard scenario={scenario} document={issueGroups} inspectionCards={inspectionCards} />} />
      <Route path="/issues/:groupId/cards/:cardId" element={<IssueBoard scenario={scenario} document={issueGroups} inspectionCards={inspectionCards} />} />
      <Route path="/timeline" element={<TimelineBoard scenario={scenario} document={timeline} />} />
      <Route path="/timeline/cards/:cardId" element={<TimelineBoard scenario={scenario} document={timeline} />} />
      <Route path="/deduction" element={<Navigate replace to="/issues" />} />
      <Route path="/court-simulator" element={<CourtSimulator scenario={scenario} npcGroups={npcGroups} memoryStages={memoryStages} inspectionCards={inspectionCards} roleAudit={cardRoleAudit} />} />
      <Route path="/design-system" element={<DesignSystemPage />} />
      <Route path="/endings" element={<EndingBranches />} />
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
