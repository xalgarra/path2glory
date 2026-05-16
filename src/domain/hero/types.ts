// ── User data types ───────────────────────────────────────────────────────────

export type Uuid = string

export interface UserDataEnvelope {
  userDataSchemaVersion: number
  exportedAt?: string
  campaigns: Campaign[]
}

export interface Campaign {
  id: Uuid
  name: string
  createdAt: string
  updatedAt: string
  destinyBudgetOverride?: number
  heroes: Hero[]
}

export interface Hero {
  id: Uuid
  name: string
  factionId: string
  factionRulesVersionAtCreation: string
  heroOptionId: string
  archetypeId: string
  originId: string | null
  flawId: string | null
  level: number
  battleSkillIds: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

// ── Validation types ──────────────────────────────────────────────────────────

export interface HeroCostBreakdown {
  base: number
  battleSkills: number
  archetypeOriginFlaw: number
  total: number
  budget: number
  isValid: boolean
  violations: ValidationIssue[]
}

export interface ValidationIssue {
  code:
    | 'DESTINY_BUDGET_EXCEEDED'
    | 'RESTRICTION_FAILED'
    | 'MANUAL_REVIEW_PENDING'
    | 'MISSING_RULE_DATA'
    | 'UNKNOWN_HERO_OPTION'
    | 'UNKNOWN_BATTLE_SKILL'
    | 'UNKNOWN_ARCHETYPE'
    | 'UNKNOWN_ORIGIN'
    | 'UNKNOWN_FLAW'
    | 'UNKNOWN_FACTION'
  message: string
  ruleEntryId?: string
  fieldPath?: string
}
