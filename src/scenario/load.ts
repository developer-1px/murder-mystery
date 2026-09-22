import scenarioDocument from '../../scenarios/crown-trial/scenario.json'
import charactersDocument from '../../scenarios/crown-trial/characters.json'
import cardsDocument from '../../scenarios/crown-trial/cards.json'
import locationsDocument from '../../scenarios/crown-trial/locations.json'
import rulesDocument from '../../scenarios/crown-trial/rules.json'
import issueGroupsDocument from '../../scenarios/crown-trial/issue-groups.json'
import npcGroupsDocument from '../../scenarios/crown-trial/npc-groups.json'
import memoryStagesDocument from '../../scenarios/crown-trial/memory-stages.json'
import timelineDocument from '../../scenarios/crown-trial/timeline.json'
import deductionAuditDocument from '../../scenarios/crown-trial/deduction-audit.json'
import commonSettingDocument from '../../scenarios/crown-trial/common-setting.json'
import characterSettingsDocument from '../../scenarios/crown-trial/character-settings.json'
import releasePlanDocument from '../../scenarios/crown-trial/release-plan.json'
import inspectionsDocument from '../../scenarios/crown-trial/inspections.json'
import cardRoleAuditDocument from '../../scenarios/crown-trial/card-role-audit.json'
import type { Card, CardRoleAuditDocument, CharacterSetting, CommonSettingDocument, DeductionAuditDocument, IssueGroupsDocument, MemoryStagesDocument, NpcGroupsDocument, ReleasePlanDocument, Scenario, TimelineDocument } from '../domain/types'
import { validateDesignerMeaning, validateDocuments, validateMeaning } from '../domain/validate'

export const documents = {
  scenario: scenarioDocument,
  characters: charactersDocument,
  cards: cardsDocument as Card[],
  locations: locationsDocument,
  rules: rulesDocument,
  issueGroups: issueGroupsDocument,
  npcGroups: npcGroupsDocument,
  deductionAudit: deductionAuditDocument,
}

export const scenario: Scenario = {
  meta: scenarioDocument,
  characters: charactersDocument,
  cards: cardsDocument as Card[],
  locations: locationsDocument,
  claims: rulesDocument.claims,
}

export const validationIssues = [...validateDocuments(documents), ...validateMeaning(scenario), ...validateDesignerMeaning(scenario, npcGroupsDocument as NpcGroupsDocument, deductionAuditDocument as DeductionAuditDocument)]

export const issueGroups = issueGroupsDocument as IssueGroupsDocument
export const npcGroups = npcGroupsDocument as NpcGroupsDocument
export const memoryStages = memoryStagesDocument as MemoryStagesDocument
export const timeline = timelineDocument as TimelineDocument
export const deductionAudit = deductionAuditDocument as DeductionAuditDocument
export const commonSetting = commonSettingDocument as CommonSettingDocument
export const characterSettings = characterSettingsDocument as CharacterSetting[]
export const releasePlan = releasePlanDocument as ReleasePlanDocument
export const inspectionCards = inspectionsDocument as Card[]
export const cardRoleAudit = cardRoleAuditDocument as CardRoleAuditDocument
