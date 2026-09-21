import Ajv2020 from 'ajv/dist/2020'
import type { DeductionAuditDocument, NpcGroupsDocument, Scenario, ValidationIssue } from './types'
import scenarioSchema from '../../schemas/scenario.schema.json'
import charactersSchema from '../../schemas/characters.schema.json'
import cardsSchema from '../../schemas/cards.schema.json'
import locationsSchema from '../../schemas/locations.schema.json'
import rulesSchema from '../../schemas/rules.schema.json'
import issueGroupsSchema from '../../schemas/issue-groups.schema.json'
import npcGroupsSchema from '../../schemas/npc-groups.schema.json'
import deductionAuditSchema from '../../schemas/deduction-audit.schema.json'

const ajv = new Ajv2020({ allErrors: true })

export function validateDocuments(documents: Record<string, unknown>): ValidationIssue[] {
  const definitions = [
    ['scenario.json', scenarioSchema, documents.scenario],
    ['characters.json', charactersSchema, documents.characters],
    ['cards.json', cardsSchema, documents.cards],
    ['locations.json', locationsSchema, documents.locations],
    ['rules.json', rulesSchema, documents.rules],
    ['issue-groups.json', issueGroupsSchema, documents.issueGroups],
    ['npc-groups.json', npcGroupsSchema, documents.npcGroups],
    ['deduction-audit.json', deductionAuditSchema, documents.deductionAudit],
  ] as const
  const issues: ValidationIssue[] = []
  for (const [file, schema, data] of definitions) {
    const validate = ajv.compile(schema)
    if (!validate(data)) {
      for (const error of validate.errors ?? []) {
        issues.push({ path: `${file}${error.instancePath || '/'}`, message: error.message ?? '잘못된 값', severity: 'error' })
      }
    }
  }
  return issues
}

export function validateMeaning(scenario: Scenario): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const characterIds = new Set(scenario.characters.map((item) => item.id))
  const cardIds = new Set(scenario.cards.map((item) => item.id))
  const locationIds = new Set(scenario.locations.map((item) => item.id))
  const claimIds = new Set(scenario.claims.map((item) => item.id))

  for (const card of scenario.cards) {
    if (card.initialOwnerId && !characterIds.has(card.initialOwnerId)) issues.push({ path: `cards.json/${card.id}/initialOwnerId`, message: `존재하지 않는 인물 ${card.initialOwnerId}`, severity: 'error' })
    if (card.locationId && !locationIds.has(card.locationId)) issues.push({ path: `cards.json/${card.id}/locationId`, message: `존재하지 않는 장소 ${card.locationId}`, severity: 'error' })
    if (card.claimId && !claimIds.has(card.claimId)) issues.push({ path: `cards.json/${card.id}/claimId`, message: `존재하지 않는 주장 ${card.claimId}`, severity: 'error' })
    if (!card.initialOwnerId && !card.locationId) issues.push({ path: `cards.json/${card.id}`, message: '초기 소유자와 장소가 없어 도달할 수 없는 카드', severity: 'warning' })
  }
  for (const location of scenario.locations) {
    for (const cardId of location.cardIds) if (!cardIds.has(cardId)) issues.push({ path: `locations.json/${location.id}/cardIds`, message: `존재하지 않는 카드 ${cardId}`, severity: 'error' })
  }
  return issues
}

export function validateDesignerMeaning(scenario: Scenario, npcGroups: NpcGroupsDocument, deduction: DeductionAuditDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const cardIds = new Set(scenario.cards.map((card) => card.id))
  const characterIds = new Set(scenario.characters.map((character) => character.id))
  const testimonyIds = new Set(scenario.cards.filter((card) => card.kind === 'testimony').map((card) => card.id))
  const groupedTestimony = npcGroups.npcs.flatMap((npc) => npc.cardIds)
  for (const npc of npcGroups.npcs) {
    if (!characterIds.has(npc.pairedCharacterId)) issues.push({ path: `npc-groups.json/${npc.id}/pairedCharacterId`, message: `존재하지 않는 인물 ${npc.pairedCharacterId}`, severity: 'error' })
    for (const id of npc.cardIds) if (!testimonyIds.has(id)) issues.push({ path: `npc-groups.json/${npc.id}/cardIds`, message: `존재하지 않거나 증언이 아닌 카드 ${id}`, severity: 'error' })
  }
  for (const id of testimonyIds) if (!groupedTestimony.includes(id)) issues.push({ path: 'npc-groups.json/npcs', message: `NPC 덱에 없는 증언 ${id}`, severity: 'error' })

  const references = [...deduction.alibis.flatMap((item) => item.cardIds), ...deduction.culprit.axes.flatMap((axis) => axis.paths.flat())]
  for (const id of references) if (!cardIds.has(id)) issues.push({ path: 'deduction-audit.json', message: `존재하지 않는 카드 ${id}`, severity: 'error' })
  for (const alibi of deduction.alibis) if (!characterIds.has(alibi.characterId)) issues.push({ path: `deduction-audit.json/alibis/${alibi.characterId}`, message: `존재하지 않는 인물 ${alibi.characterId}`, severity: 'error' })
  if (!characterIds.has(deduction.culprit.characterId)) issues.push({ path: 'deduction-audit.json/culprit/characterId', message: `존재하지 않는 인물 ${deduction.culprit.characterId}`, severity: 'error' })
  return issues
}
