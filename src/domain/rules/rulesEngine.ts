import type { Hero, Campaign, ValidationIssue } from '../hero/types'
import type { LoadedRuleset } from './types'

/**
 * Derives the authoritative destiny budget for a hero.
 *
 * Resolution order (from CLAUDE.md §10):
 *  1. campaign.destinyBudgetOverride (house rule)
 *  2. heroOption.destinyBudgetByLevel at exact hero.level
 *  3. heroOption.destinyBudgetByLevel at the last defined level ≤ hero.level
 *  4. MISSING_RULE_DATA if none of the above resolve
 */
export function deriveDestinyBudget(
  hero: Hero,
  ruleset: LoadedRuleset,
  campaign: Campaign,
): number | ValidationIssue {
  if (campaign.destinyBudgetOverride !== undefined) {
    return campaign.destinyBudgetOverride
  }

  const heroOptions = ruleset.heroOptionsByFactionId[hero.factionId] ?? []
  const heroOption = heroOptions.find(o => o.id === hero.heroOptionId)

  if (!heroOption) {
    return {
      code: 'MISSING_RULE_DATA',
      message: `Hero option '${hero.heroOptionId}' not found for faction '${hero.factionId}'`,
      fieldPath: 'heroOptionId',
    }
  }

  if (!heroOption.destinyBudgetByLevel) {
    return {
      code: 'MISSING_RULE_DATA',
      message: `No destiny budget defined for hero option '${hero.heroOptionId}'`,
      fieldPath: 'heroOptionId',
    }
  }

  const eligible = Object.keys(heroOption.destinyBudgetByLevel)
    .map(Number)
    .filter(l => l <= hero.level)
    .sort((a, b) => b - a)

  if (eligible.length === 0) {
    return {
      code: 'MISSING_RULE_DATA',
      message: `No destiny budget defined for level ${hero.level} on hero option '${hero.heroOptionId}'`,
      fieldPath: 'level',
    }
  }

  return heroOption.destinyBudgetByLevel[eligible[0]] ?? 0
}
