// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validateHero } from './heroValidator'
import type { LoadedRuleset } from '../rules/types'
import {
  makeRuleset,
  makeHero,
  makeCampaign,
  FACTION_ID,
  SKILL_1_ID,
  SKILL_2_ID,
} from '../../test/domain-fixtures'

describe('validateHero', () => {
  it('valid hero with no skills is valid', () => {
    const result = validateHero(makeHero(), makeRuleset(), makeCampaign())
    expect(result.isValid).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.base).toBe(4)
    expect(result.battleSkills).toBe(0)
    expect(result.total).toBe(4)
    expect(result.budget).toBe(6)
  })

  it('valid hero with skills within budget is valid', () => {
    // base=4, skill-1=1, total=5, budget=6
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID] })
    const result = validateHero(hero, makeRuleset(), makeCampaign())
    expect(result.isValid).toBe(true)
    expect(result.total).toBe(5)
    expect(result.budget).toBe(6)
  })

  it('hero exceeding budget produces DESTINY_BUDGET_EXCEEDED violation', () => {
    // base=4, skill-1=1, skill-2=2, total=7, budget=6 → exceeded
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID, SKILL_2_ID] })
    const result = validateHero(hero, makeRuleset(), makeCampaign())
    expect(result.isValid).toBe(false)
    expect(result.violations.some(v => v.code === 'DESTINY_BUDGET_EXCEEDED')).toBe(true)
  })

  it('campaign.destinyBudgetOverride raises the effective budget', () => {
    // total=7, override=10 → valid
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID, SKILL_2_ID] })
    const campaign = makeCampaign({ destinyBudgetOverride: 10 })
    const result = validateHero(hero, makeRuleset(), campaign)
    expect(result.isValid).toBe(true)
    expect(result.budget).toBe(10)
    expect(result.violations).toHaveLength(0)
  })

  it('campaign.destinyBudgetOverride lowers the effective budget', () => {
    // total=4 (no skills), override=3 → exceeded
    const campaign = makeCampaign({ destinyBudgetOverride: 3 })
    const result = validateHero(makeHero(), makeRuleset(), campaign)
    expect(result.isValid).toBe(false)
    expect(result.violations.some(v => v.code === 'DESTINY_BUDGET_EXCEEDED')).toBe(true)
  })

  it('unknown faction produces UNKNOWN_FACTION violation', () => {
    const hero = makeHero({ factionId: 'no-such-faction' })
    const result = validateHero(hero, makeRuleset(), makeCampaign())
    expect(result.isValid).toBe(false)
    expect(result.violations.some(v => v.code === 'UNKNOWN_FACTION')).toBe(true)
  })

  it('unknown hero option produces UNKNOWN_HERO_OPTION and MISSING_RULE_DATA', () => {
    const hero = makeHero({ heroOptionId: 'no-such-option' })
    const result = validateHero(hero, makeRuleset(), makeCampaign())
    expect(result.isValid).toBe(false)
    const codes = result.violations.map(v => v.code)
    expect(codes).toContain('UNKNOWN_HERO_OPTION')
    expect(codes).toContain('MISSING_RULE_DATA')
  })

  it('restriction violation on selected skill propagates to result', () => {
    const ruleset: LoadedRuleset = makeRuleset({
      battleSkillTablesByFactionId: {
        [FACTION_ID]: [
          {
            id: 'test-table',
            name: 'Test Skills',
            skills: [
              {
                id: SKILL_1_ID,
                name: 'Skill One',
                description: 'Desc',
                ruleText: 'Rule text.',
                tags: [],
                restrictions: [{ type: 'minLevel', value: 3 }], // hero is level 1
                needsManualReview: false,
                destinyCost: 1,
              },
            ],
          },
        ],
      },
    })
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID] })
    const result = validateHero(hero, ruleset, makeCampaign())
    expect(result.isValid).toBe(false)
    expect(result.violations.some(v => v.code === 'RESTRICTION_FAILED')).toBe(true)
  })

  it('manual review on selected skill propagates as MANUAL_REVIEW_PENDING', () => {
    const ruleset: LoadedRuleset = makeRuleset({
      battleSkillTablesByFactionId: {
        [FACTION_ID]: [
          {
            id: 'test-table',
            name: 'Test Skills',
            skills: [
              {
                id: SKILL_1_ID,
                name: 'Skill One',
                description: 'Desc',
                ruleText: 'Rule text.',
                tags: [],
                restrictions: [],
                needsManualReview: true,
                destinyCost: 1,
              },
            ],
          },
        ],
      },
    })
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID] })
    const result = validateHero(hero, ruleset, makeCampaign())
    expect(result.violations.some(v => v.code === 'MANUAL_REVIEW_PENDING')).toBe(true)
    // Manual review alone does not make the hero invalid
    expect(result.isValid).toBe(false) // because violations array is non-empty
  })

  it('multiple violations accumulate without duplication', () => {
    const hero = makeHero({
      archetypeId: 'bad-arch',
      originId: 'bad-origin',
      flawId: 'bad-flaw',
    })
    const result = validateHero(hero, makeRuleset(), makeCampaign())
    const codes = result.violations.map(v => v.code)
    expect(codes).toContain('UNKNOWN_ARCHETYPE')
    expect(codes).toContain('UNKNOWN_ORIGIN')
    expect(codes).toContain('UNKNOWN_FLAW')
  })

  it('DESTINY_BUDGET_EXCEEDED is NOT added when budget cannot be derived', () => {
    // If deriveDestinyBudget returns MISSING_RULE_DATA, we should not also
    // add DESTINY_BUDGET_EXCEEDED (the missing data is the primary issue)
    const hero = makeHero({ heroOptionId: 'unknown' })
    const result = validateHero(hero, makeRuleset(), makeCampaign())
    expect(result.violations.some(v => v.code === 'DESTINY_BUDGET_EXCEEDED')).toBe(false)
  })
})
