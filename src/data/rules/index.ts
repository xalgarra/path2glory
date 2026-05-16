import type { LoadedRuleset, Faction } from '../../domain/rules/types'
import {
  parseRulesMeta,
  parseFactionMeta,
  parseFactionJson,
  parseHeroOptions,
  parseBattleSkillTables,
  parseArchetypes,
  parseOrigins,
  parseFlaws,
} from './schemas'

import metaJson from './_meta.json'
import archetypesJson from './shared/archetypes.json'
import originsJson from './shared/origins.json'
import flawsJson from './shared/flaws.json'
import idonethMetaJson from './factions/idoneth-deepkin/meta.json'
import idonethFactionJson from './factions/idoneth-deepkin/faction.json'
import idonethHeroesJson from './factions/idoneth-deepkin/heroes.json'
import idonethBattleSkillsJson from './factions/idoneth-deepkin/battle-skills.json'
import idonethArchetypesJson from './factions/idoneth-deepkin/archetypes.json'
import idonethOriginsJson from './factions/idoneth-deepkin/origins.json'
import idonethFlawsJson from './factions/idoneth-deepkin/flaws.json'
import stormcastMetaJson from './factions/stormcast-eternals/meta.json'
import stormcastFactionJson from './factions/stormcast-eternals/faction.json'
import stormcastHeroesJson from './factions/stormcast-eternals/heroes.json'
import stormcastBattleSkillsJson from './factions/stormcast-eternals/battle-skills.json'

// ── Faction registry ──────────────────────────────────────────────────────────
// To add a new faction: import its JSON files and add an entry here.
// archetypesJson / originsJson / flawsJson are optional — omit to use the
// shared pools for that faction.

interface FactionBundle {
  metaJson: unknown
  factionJson: unknown
  heroesJson: unknown
  battleSkillsJson: unknown
  archetypesJson?: unknown
  originsJson?: unknown
  flawsJson?: unknown
}

const factionBundles: FactionBundle[] = [
  {
    metaJson: idonethMetaJson,
    factionJson: idonethFactionJson,
    heroesJson: idonethHeroesJson,
    battleSkillsJson: idonethBattleSkillsJson,
    archetypesJson: idonethArchetypesJson,
    originsJson: idonethOriginsJson,
    flawsJson: idonethFlawsJson,
  },
  {
    metaJson: stormcastMetaJson,
    factionJson: stormcastFactionJson,
    heroesJson: stormcastHeroesJson,
    battleSkillsJson: stormcastBattleSkillsJson,
  },
]

// ── Loader ────────────────────────────────────────────────────────────────────

export function loadRuleset(): LoadedRuleset {
  const meta = parseRulesMeta(metaJson)
  const archetypes = parseArchetypes(archetypesJson)
  const origins = parseOrigins(originsJson)
  const flaws = parseFlaws(flawsJson)

  const factions: Faction[] = []
  const heroOptionsByFactionId: LoadedRuleset['heroOptionsByFactionId'] = {}
  const battleSkillTablesByFactionId: LoadedRuleset['battleSkillTablesByFactionId'] = {}
  const archetypesByFactionId: LoadedRuleset['archetypesByFactionId'] = {}
  const originsByFactionId: LoadedRuleset['originsByFactionId'] = {}
  const flawsByFactionId: LoadedRuleset['flawsByFactionId'] = {}

  for (const bundle of factionBundles) {
    const factionMeta = parseFactionMeta(bundle.metaJson)
    const factionData = parseFactionJson(bundle.factionJson)
    const heroOptions = parseHeroOptions(bundle.heroesJson)
    const battleSkillTables = parseBattleSkillTables(bundle.battleSkillsJson)

    const faction: Faction = {
      factionId: factionMeta.factionId,
      factionRulesVersion: factionMeta.factionRulesVersion,
      factionRulesUpdatedAt: factionMeta.factionRulesUpdatedAt,
      factionRulesNotes: factionMeta.factionRulesNotes,
      name: factionData.name,
      grandAlliance: factionData.grandAlliance,
      lore: factionData.lore,
    }

    factions.push(faction)
    heroOptionsByFactionId[factionMeta.factionId] = heroOptions
    battleSkillTablesByFactionId[factionMeta.factionId] = battleSkillTables

    if (bundle.archetypesJson !== undefined) {
      archetypesByFactionId[factionMeta.factionId] = parseArchetypes(bundle.archetypesJson)
    }
    if (bundle.originsJson !== undefined) {
      originsByFactionId[factionMeta.factionId] = parseOrigins(bundle.originsJson)
    }
    if (bundle.flawsJson !== undefined) {
      flawsByFactionId[factionMeta.factionId] = parseFlaws(bundle.flawsJson)
    }
  }

  return {
    meta,
    factions,
    archetypes,
    origins,
    flaws,
    archetypesByFactionId,
    originsByFactionId,
    flawsByFactionId,
    heroOptionsByFactionId,
    battleSkillTablesByFactionId,
  }
}

// ── Lookup helpers ────────────────────────────────────────────────────────────

export function getFactionById(ruleset: LoadedRuleset, factionId: string) {
  return ruleset.factions.find((f) => f.factionId === factionId)
}

export function getHeroOptionsByFactionId(ruleset: LoadedRuleset, factionId: string) {
  return ruleset.heroOptionsByFactionId[factionId] ?? []
}

export function getBattleSkillTablesByFactionId(ruleset: LoadedRuleset, factionId: string) {
  return ruleset.battleSkillTablesByFactionId[factionId] ?? []
}

export function getAllBattleSkillsForFaction(ruleset: LoadedRuleset, factionId: string) {
  return getBattleSkillTablesByFactionId(ruleset, factionId).flatMap((t) => t.skills)
}

export function getArchetypesForFaction(ruleset: LoadedRuleset, factionId: string) {
  return ruleset.archetypesByFactionId[factionId] ?? ruleset.archetypes
}

export function getOriginsForFaction(ruleset: LoadedRuleset, factionId: string) {
  return ruleset.originsByFactionId[factionId] ?? ruleset.origins
}

export function getFlawsForFaction(ruleset: LoadedRuleset, factionId: string) {
  return ruleset.flawsByFactionId[factionId] ?? ruleset.flaws
}
