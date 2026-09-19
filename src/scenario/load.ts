import scenarioDocument from '../../scenarios/crown-trial/scenario.json'
import charactersDocument from '../../scenarios/crown-trial/characters.json'
import cardsDocument from '../../scenarios/crown-trial/cards.json'
import locationsDocument from '../../scenarios/crown-trial/locations.json'
import rulesDocument from '../../scenarios/crown-trial/rules.json'
import type { Card, Scenario } from '../domain/types'
import { validateDocuments, validateMeaning } from '../domain/validate'

export const documents = {
  scenario: scenarioDocument,
  characters: charactersDocument,
  cards: cardsDocument as Card[],
  locations: locationsDocument,
  rules: rulesDocument,
}

export const scenario: Scenario = {
  meta: scenarioDocument,
  characters: charactersDocument,
  cards: cardsDocument as Card[],
  locations: locationsDocument,
  claims: rulesDocument.claims,
}

export const validationIssues = [...validateDocuments(documents), ...validateMeaning(scenario)]
