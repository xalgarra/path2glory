import type { Hero, HeroCostBreakdown, ValidationIssue } from '../hero/types'
import type { LoadedRuleset, Archetype, Origin, Flaw } from './types'

// ── Faction-aware lookups ─────────────────────────────────────────────────────

export function findArchetypeForFaction(
  ruleset: LoadedRuleset,
  factionId: string,
  archetypeId: string,
): Archetype | undefined {
  const pool = ruleset.archetypesByFactionId[factionId] ?? ruleset.archetypes
  return pool.find((a) => a.id === archetypeId)
}

export function findOriginForFaction(
  ruleset: LoadedRuleset,
  factionId: string,
  originId: string | null,
): Origin | undefined {
  if (!originId) return undefined
  const pool = ruleset.originsByFactionId[factionId] ?? ruleset.origins
  return pool.find((o) => o.id === originId)
}

export function findFlawForFaction(
  ruleset: LoadedRuleset,
  factionId: string,
  flawId: string | null,
): Flaw | undefined {
  if (!flawId) return undefined
  const pool = ruleset.flawsByFactionId[factionId] ?? ruleset.flaws
  return pool.find((f) => f.id === flawId)
}

// ── Cost calculation ──────────────────────────────────────────────────────────

export function calculateDestinyCost(
  hero: Hero,
  ruleset: LoadedRuleset,
): HeroCostBreakdown {
  const violations: ValidationIssue[] = []

  // Validate faction exists
  if (!ruleset.factions.some(f => f.factionId === hero.factionId)) {
    violations.push({
      code: 'UNKNOWN_FACTION',
      message: `Unknown faction '${hero.factionId}'`,
      fieldPath: 'factionId',
    })
  }

  // Find hero option — required to compute base cost; return early if missing
  const heroOptions = ruleset.heroOptionsByFactionId[hero.factionId] ?? []
  const heroOption = heroOptions.find(o => o.id === hero.heroOptionId)

  if (!heroOption) {
    violations.push({
      code: 'UNKNOWN_HERO_OPTION',
      message: `Unknown hero option '${hero.heroOptionId}' for faction '${hero.factionId}'`,
      fieldPath: 'heroOptionId',
    })
    return { base: 0, battleSkills: 0, archetypeOriginFlaw: 0, total: 0, budget: 0, isValid: false, violations }
  }

  const base = heroOption.baseDestinyCost

  // Validate archetype, origin, flaw using faction-aware lookups
  const archetype = findArchetypeForFaction(ruleset, hero.factionId, hero.archetypeId)
  if (!archetype) {
    violations.push({
      code: 'UNKNOWN_ARCHETYPE',
      message: `Unknown archetype '${hero.archetypeId}'`,
      fieldPath: 'archetypeId',
    })
  }

  const origin = findOriginForFaction(ruleset, hero.factionId, hero.originId)
  if (hero.originId && !origin) {
    violations.push({
      code: 'UNKNOWN_ORIGIN',
      message: `Unknown origin '${hero.originId}'`,
      fieldPath: 'originId',
    })
  }

  const flaw = findFlawForFaction(ruleset, hero.factionId, hero.flawId)
  if (hero.flawId && !flaw) {
    violations.push({
      code: 'UNKNOWN_FLAW',
      message: `Unknown flaw '${hero.flawId}'`,
      fieldPath: 'flawId',
    })
  }

  // Sum archetype/origin/flaw destiny costs (may be negative — they give PD back)
  const archetypeOriginFlaw =
    (archetype?.destinyCost ?? 0) +
    (origin?.destinyCost ?? 0) +
    (flaw?.destinyCost ?? 0)

  // Sum battle skill costs
  const allSkills = (ruleset.battleSkillTablesByFactionId[hero.factionId] ?? []).flatMap(
    t => t.skills,
  )
  let battleSkills = 0
  for (const skillId of hero.battleSkillIds) {
    const skill = allSkills.find(s => s.id === skillId)
    if (!skill) {
      violations.push({
        code: 'UNKNOWN_BATTLE_SKILL',
        message: `Unknown battle skill '${skillId}'`,
        fieldPath: 'battleSkillIds',
      })
    } else {
      battleSkills += skill.destinyCost
    }
  }

  const total = base + archetypeOriginFlaw + battleSkills
  const budget = budgetFromOption(heroOption.destinyBudgetByLevel, hero.level)

  return {
    base,
    battleSkills,
    archetypeOriginFlaw,
    total,
    budget,
    isValid: violations.length === 0 && total <= budget,
    violations,
  }
}

// Finds the last defined level ≤ hero.level; returns 0 if none found.
function budgetFromOption(
  byLevel: Record<number, number> | undefined,
  level: number,
): number {
  if (!byLevel) return 0
  const eligible = Object.keys(byLevel)
    .map(Number)
    .filter(l => l <= level)
    .sort((a, b) => b - a)
  if (eligible.length === 0) return 0
  return byLevel[eligible[0]] ?? 0
}
