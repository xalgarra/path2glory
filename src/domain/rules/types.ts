// ── Versioning ────────────────────────────────────────────────────────────────

export const APP_DATA_FORMAT_VERSION = 1
export const USER_DATA_SCHEMA_VERSION = 1

export interface RulesMeta {
  appDataFormatVersion: number
  generatedAt: string
  notes?: string
}

export interface FactionMeta {
  factionId: string
  factionRulesVersion: string
  factionRulesUpdatedAt: string
  factionRulesNotes?: string
}

// ── Restrictions ──────────────────────────────────────────────────────────────

export type Restriction =
  | { type: 'minLevel'; value: number }
  | { type: 'requiresSkillIds'; ids: string[] }
  | { type: 'excludesSkillIds'; ids: string[] }
  | { type: 'requiresArchetypeId'; id: string }
  | { type: 'requiresHeroOptionIds'; ids: string[] }
  | { type: 'maxPerHero'; value: number }
  | { type: 'custom'; description: string }

// ── Base rule entry ───────────────────────────────────────────────────────────

export interface RuleEntry {
  id: string
  name: string
  description: string
  ruleText: string
  tags: string[]
  restrictions: Restriction[]
  needsManualReview: boolean
}

// ── Rules types ───────────────────────────────────────────────────────────────

export type GrandAlliance = 'order' | 'chaos' | 'death' | 'destruction'

export interface Faction extends FactionMeta {
  name: string
  grandAlliance: GrandAlliance
  lore?: string
}

export interface HeroOption extends RuleEntry {
  baseDestinyCost: number
  allowedArchetypeIds: string[]
  allowedBattleSkillTableIds: string[]
  destinyBudgetByLevel?: Record<number, number>
}

export interface Archetype extends RuleEntry {
  destinyCost?: number
}
export interface Origin extends RuleEntry {
  destinyCost?: number
}
export interface Flaw extends RuleEntry {
  destinyCost?: number
}

export interface BattleSkill extends RuleEntry {
  destinyCost: number
}

export interface BattleSkillTable {
  id: string
  name: string
  skills: BattleSkill[]
  requiresSkillFromTableId?: string
}

export interface LoadedRuleset {
  meta: RulesMeta
  factions: Faction[]
  archetypes: Archetype[]
  origins: Origin[]
  flaws: Flaw[]
  archetypesByFactionId: Record<string, Archetype[]>
  originsByFactionId: Record<string, Origin[]>
  flawsByFactionId: Record<string, Flaw[]>
  heroOptionsByFactionId: Record<string, HeroOption[]>
  battleSkillTablesByFactionId: Record<string, BattleSkillTable[]>
}
