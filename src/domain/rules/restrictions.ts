import type { Hero, ValidationIssue } from '../hero/types'
import type { RuleEntry, LoadedRuleset } from './types'

/**
 * Evaluates all restrictions on a rule entry against the current hero state.
 * - Known restriction types are enforced automatically.
 * - `custom` restrictions always produce MANUAL_REVIEW_PENDING.
 * - `needsManualReview: true` on the entry also produces MANUAL_REVIEW_PENDING
 *   (deduplicated if a custom restriction already did so).
 *
 * `_ruleset` is included for forward-compatibility with future restriction types
 * that may require cross-ruleset lookups.
 */
export function evaluateRestrictions(
  hero: Hero,
  entry: RuleEntry,
  _ruleset: LoadedRuleset,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  for (const restriction of entry.restrictions) {
    switch (restriction.type) {
      case 'minLevel':
        if (hero.level < restriction.value) {
          issues.push({
            code: 'RESTRICTION_FAILED',
            message: `Requires level ${restriction.value} (hero is level ${hero.level})`,
            ruleEntryId: entry.id,
          })
        }
        break

      case 'requiresSkillIds':
        for (const requiredId of restriction.ids) {
          if (!hero.battleSkillIds.includes(requiredId)) {
            issues.push({
              code: 'RESTRICTION_FAILED',
              message: `Requires battle skill '${requiredId}'`,
              ruleEntryId: entry.id,
            })
          }
        }
        break

      case 'excludesSkillIds':
        for (const excludedId of restriction.ids) {
          if (hero.battleSkillIds.includes(excludedId)) {
            issues.push({
              code: 'RESTRICTION_FAILED',
              message: `Incompatible with battle skill '${excludedId}'`,
              ruleEntryId: entry.id,
            })
          }
        }
        break

      case 'requiresArchetypeId':
        if (hero.archetypeId !== restriction.id) {
          issues.push({
            code: 'RESTRICTION_FAILED',
            message: `Requires archetype '${restriction.id}'`,
            ruleEntryId: entry.id,
          })
        }
        break

      case 'requiresHeroOptionIds':
        if (!restriction.ids.includes(hero.heroOptionId)) {
          issues.push({
            code: 'RESTRICTION_FAILED',
            message: `Not available for this hero type`,
            ruleEntryId: entry.id,
          })
        }
        break

      case 'maxPerHero': {
        const count = hero.battleSkillIds.filter(id => id === entry.id).length
        if (count > restriction.value) {
          issues.push({
            code: 'RESTRICTION_FAILED',
            message: `Can only be taken ${restriction.value} time(s) per hero`,
            ruleEntryId: entry.id,
          })
        }
        break
      }

      case 'custom':
        issues.push({
          code: 'MANUAL_REVIEW_PENDING',
          message: restriction.description,
          ruleEntryId: entry.id,
        })
        break
    }
  }

  // needsManualReview triggers a warning if not already covered by a custom restriction
  if (
    entry.needsManualReview &&
    !issues.some(i => i.code === 'MANUAL_REVIEW_PENDING' && i.ruleEntryId === entry.id)
  ) {
    issues.push({
      code: 'MANUAL_REVIEW_PENDING',
      message: `'${entry.name}' requires manual review`,
      ruleEntryId: entry.id,
    })
  }

  return issues
}
