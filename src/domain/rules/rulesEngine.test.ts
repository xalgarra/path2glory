// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { deriveDestinyBudget } from './rulesEngine'
import {
  makeRuleset,
  makeHero,
  makeCampaign,
  FACTION_ID,
  HERO_OPTION_ID,
} from '../../test/domain-fixtures'

describe('deriveDestinyBudget', () => {
  it('uses campaign.destinyBudgetOverride when present', () => {
    const campaign = makeCampaign({ destinyBudgetOverride: 20 })
    const result = deriveDestinyBudget(makeHero(), makeRuleset(), campaign)
    expect(result).toBe(20)
  })

  it('returns 0 as a campaign override (falsy override is still valid)', () => {
    const campaign = makeCampaign({ destinyBudgetOverride: 0 })
    const result = deriveDestinyBudget(makeHero(), makeRuleset(), campaign)
    expect(result).toBe(0)
  })

  it('derives budget at exact hero level', () => {
    const hero = makeHero({ level: 2 })
    const result = deriveDestinyBudget(hero, makeRuleset(), makeCampaign())
    expect(result).toBe(8)
  })

  it('falls back to last defined level when hero level exceeds the table', () => {
    const hero = makeHero({ level: 99 })
    const result = deriveDestinyBudget(hero, makeRuleset(), makeCampaign())
    expect(result).toBe(10) // level 3 is highest defined
  })

  it('returns MISSING_RULE_DATA when hero level is below every defined level', () => {
    const ruleset = makeRuleset({
      heroOptionsByFactionId: {
        [FACTION_ID]: [
          {
            id: HERO_OPTION_ID,
            name: 'Hero',
            description: '',
            ruleText: 'Rule text.',
            tags: [],
            restrictions: [],
            needsManualReview: false,
            baseDestinyCost: 4,
            allowedArchetypeIds: [],
            allowedBattleSkillTableIds: [],
            destinyBudgetByLevel: { 2: 8 },
          },
        ],
      },
    })
    const hero = makeHero({ level: 1 })
    const result = deriveDestinyBudget(hero, ruleset, makeCampaign())
    expect(typeof result).toBe('object')
    if (typeof result === 'object') {
      expect(result.code).toBe('MISSING_RULE_DATA')
    }
  })

  it('returns MISSING_RULE_DATA when hero option is not found', () => {
    const hero = makeHero({ heroOptionId: 'unknown' })
    const result = deriveDestinyBudget(hero, makeRuleset(), makeCampaign())
    expect(typeof result).toBe('object')
    if (typeof result === 'object') {
      expect(result.code).toBe('MISSING_RULE_DATA')
    }
  })

  it('returns MISSING_RULE_DATA when destinyBudgetByLevel is undefined', () => {
    const ruleset = makeRuleset({
      heroOptionsByFactionId: {
        [FACTION_ID]: [
          {
            id: HERO_OPTION_ID,
            name: 'Hero',
            description: '',
            ruleText: 'Rule text.',
            tags: [],
            restrictions: [],
            needsManualReview: false,
            baseDestinyCost: 4,
            allowedArchetypeIds: [],
            allowedBattleSkillTableIds: [],
            // destinyBudgetByLevel intentionally omitted
          },
        ],
      },
    })
    const result = deriveDestinyBudget(makeHero(), ruleset, makeCampaign())
    expect(typeof result).toBe('object')
    if (typeof result === 'object') {
      expect(result.code).toBe('MISSING_RULE_DATA')
    }
  })

  it('campaign override takes precedence over missing hero option', () => {
    const hero = makeHero({ heroOptionId: 'unknown' })
    const campaign = makeCampaign({ destinyBudgetOverride: 5 })
    // Even with an unknown option, the override should win
    expect(deriveDestinyBudget(hero, makeRuleset(), campaign)).toBe(5)
  })
})
