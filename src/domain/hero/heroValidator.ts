import type { Hero, Campaign, HeroCostBreakdown, ValidationIssue } from './types'
import type { LoadedRuleset } from '../rules/types'
import {
  calculateDestinyCost,
  findArchetypeForFaction,
  findOriginForFaction,
  findFlawForFaction,
} from '../rules/destinyCost'
import { deriveDestinyBudget } from '../rules/rulesEngine'
import { evaluateRestrictions } from '../rules/restrictions'

/**
 * Full hero validation. Combines cost calculation, authoritative budget
 * derivation (including campaign override), and restriction evaluation
 * for every selected rule entry.
 */
export function validateHero(
  hero: Hero,
  ruleset: LoadedRuleset,
  campaign: Campaign,
): HeroCostBreakdown {
  const costBreakdown = calculateDestinyCost(hero, ruleset)
  const violations: ValidationIssue[] = [...costBreakdown.violations]

  // Derive the authoritative budget (may differ from costBreakdown.budget
  // when campaign.destinyBudgetOverride is set)
  const budgetResult = deriveDestinyBudget(hero, ruleset, campaign)
  let budget: number
  let budgetDerived: boolean

  if (typeof budgetResult === 'number') {
    budget = budgetResult
    budgetDerived = true
  } else {
    violations.push(budgetResult)
    budget = 0
    budgetDerived = false
  }

  if (budgetDerived && costBreakdown.total > budget) {
    violations.push({
      code: 'DESTINY_BUDGET_EXCEEDED',
      message: `Destiny cost ${costBreakdown.total} exceeds budget of ${budget}`,
    })
  }

  // Evaluate restrictions on every selected rule entry
  const heroOptions = ruleset.heroOptionsByFactionId[hero.factionId] ?? []
  const heroOption = heroOptions.find(o => o.id === hero.heroOptionId)
  if (heroOption) {
    violations.push(...evaluateRestrictions(hero, heroOption, ruleset))
  }

  const archetype = findArchetypeForFaction(ruleset, hero.factionId, hero.archetypeId)
  if (archetype) {
    violations.push(...evaluateRestrictions(hero, archetype, ruleset))
  }

  const origin = findOriginForFaction(ruleset, hero.factionId, hero.originId)
  if (origin) {
    violations.push(...evaluateRestrictions(hero, origin, ruleset))
  }

  const flaw = findFlawForFaction(ruleset, hero.factionId, hero.flawId)
  if (flaw) {
    violations.push(...evaluateRestrictions(hero, flaw, ruleset))
  }

  const allSkills = (ruleset.battleSkillTablesByFactionId[hero.factionId] ?? []).flatMap(
    t => t.skills,
  )
  for (const skillId of [...new Set(hero.battleSkillIds)]) {
    const skill = allSkills.find(s => s.id === skillId)
    if (skill) {
      violations.push(...evaluateRestrictions(hero, skill, ruleset))
    }
  }

  return {
    base: costBreakdown.base,
    battleSkills: costBreakdown.battleSkills,
    archetypeOriginFlaw: costBreakdown.archetypeOriginFlaw,
    total: costBreakdown.total,
    budget,
    isValid: violations.length === 0,
    violations,
  }
}
