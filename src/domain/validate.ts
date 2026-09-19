import Ajv2020 from 'ajv/dist/2020'
import type { Scenario, ValidationIssue } from './types'
import scenarioSchema from '../../schemas/scenario.schema.json'
import charactersSchema from '../../schemas/characters.schema.json'
import cardsSchema from '../../schemas/cards.schema.json'
import locationsSchema from '../../schemas/locations.schema.json'
import rulesSchema from '../../schemas/rules.schema.json'

const ajv = new Ajv2020({ allErrors: true })

export function validateDocuments(documents: Record<string, unknown>): ValidationIssue[] {
  const definitions = [
    ['scenario.json', scenarioSchema, documents.scenario],
    ['characters.json', charactersSchema, documents.characters],
    ['cards.json', cardsSchema, documents.cards],
    ['locations.json', locationsSchema, documents.locations],
    ['rules.json', rulesSchema, documents.rules],
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
