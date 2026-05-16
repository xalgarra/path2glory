// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { calculateDestinyCost } from './destinyCost'
import {
  makeRuleset,
  makeHero,
  FACTION_ID,
  HERO_OPTION_ID,
  SKILL_1_ID,
  SKILL_2_ID,
} from '../../test/domain-fixtures'

describe('calculateDestinyCost', () => {
  it('returns base cost with no skills', () => {
    const result = calculateDestinyCost(makeHero(), makeRuleset())
    expect(result.base).toBe(4)
    expect(result.battleSkills).toBe(0)
    expect(result.total).toBe(4)
    expect(result.violations).toHaveLength(0)
  })

  it('sums base + skill costs', () => {
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID, SKILL_2_ID] })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.base).toBe(4)
    expect(result.battleSkills).toBe(3) // 1 + 2
    expect(result.total).toBe(7)
  })

  it('derives budget from destinyBudgetByLevel at exact level', () => {
    const hero = makeHero({ level: 1 })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.budget).toBe(6)
  })

  it('derives budget at level 2', () => {
    const hero = makeHero({ level: 2 })
    expect(calculateDestinyCost(hero, makeRuleset()).budget).toBe(8)
  })

  it('falls back to last defined level when hero level exceeds table', () => {
    const hero = makeHero({ level: 99 })
    // defined levels: 1, 2, 3 — fallback is level 3 → budget 10
    expect(calculateDestinyCost(hero, makeRuleset()).budget).toBe(10)
  })

  it('returns budget 0 when hero level is below every defined level', () => {
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
            destinyBudgetByLevel: { 2: 8 }, // min level is 2
          },
        ],
      },
    })
    const hero = makeHero({ level: 1 })
    expect(calculateDestinyCost(hero, ruleset).budget).toBe(0)
  })

  it('isValid is true when total ≤ budget', () => {
    // base=4, skills=1, total=5, budget=6 at level 1
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID] })
    expect(calculateDestinyCost(hero, makeRuleset()).isValid).toBe(true)
  })

  it('isValid is false when total > budget', () => {
    // base=4, skills=3, total=7, budget=6 at level 1
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID, SKILL_2_ID] })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.isValid).toBe(false)
    expect(result.total).toBeGreaterThan(result.budget)
  })

  it('returns UNKNOWN_FACTION violation for unknown faction', () => {
    const hero = makeHero({ factionId: 'unknown-faction' })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.violations.some(v => v.code === 'UNKNOWN_FACTION')).toBe(true)
  })

  it('returns UNKNOWN_HERO_OPTION and exits early', () => {
    const hero = makeHero({ heroOptionId: 'unknown-option' })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.violations.some(v => v.code === 'UNKNOWN_HERO_OPTION')).toBe(true)
    expect(result.base).toBe(0)
    expect(result.total).toBe(0)
  })

  it('returns UNKNOWN_ARCHETYPE for unknown archetype', () => {
    const hero = makeHero({ archetypeId: 'unknown-arch' })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.violations.some(v => v.code === 'UNKNOWN_ARCHETYPE')).toBe(true)
  })

  it('returns UNKNOWN_ORIGIN for unknown origin', () => {
    const hero = makeHero({ originId: 'unknown-origin' })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.violations.some(v => v.code === 'UNKNOWN_ORIGIN')).toBe(true)
  })

  it('returns UNKNOWN_FLAW for unknown flaw', () => {
    const hero = makeHero({ flawId: 'unknown-flaw' })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.violations.some(v => v.code === 'UNKNOWN_FLAW')).toBe(true)
  })

  it('returns UNKNOWN_BATTLE_SKILL for unknown skill id', () => {
    const hero = makeHero({ battleSkillIds: ['no-such-skill'] })
    const result = calculateDestinyCost(hero, makeRuleset())
    expect(result.violations.some(v => v.code === 'UNKNOWN_BATTLE_SKILL')).toBe(true)
  })

  it('accumulates multiple unknown-id violations', () => {
    const hero = makeHero({
      archetypeId: 'bad-arch',
      originId: 'bad-origin',
      flawId: 'bad-flaw',
    })
    const result = calculateDestinyCost(hero, makeRuleset())
    const codes = result.violations.map(v => v.code)
    expect(codes).toContain('UNKNOWN_ARCHETYPE')
    expect(codes).toContain('UNKNOWN_ORIGIN')
    expect(codes).toContain('UNKNOWN_FLAW')
  })
})
