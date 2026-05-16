// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { evaluateRestrictions } from './restrictions'
import type { RuleEntry } from './types'
import { makeRuleset, makeHero, ARCHETYPE_ID, HERO_OPTION_ID, SKILL_1_ID } from '../../test/domain-fixtures'

function makeEntry(overrides: Partial<RuleEntry> = {}): RuleEntry {
  return {
    id: 'entry-1',
    name: 'Test Entry',
    description: 'Desc',
    ruleText: 'Rule text.',
    tags: [],
    restrictions: [],
    needsManualReview: false,
    ...overrides,
  }
}

describe('evaluateRestrictions', () => {
  const ruleset = makeRuleset()

  it('returns empty array for entry with no restrictions and needsManualReview false', () => {
    const issues = evaluateRestrictions(makeHero(), makeEntry(), ruleset)
    expect(issues).toHaveLength(0)
  })

  // ── minLevel ──────────────────────────────────────────────────────────────

  it('minLevel: fails when hero level is below required', () => {
    const entry = makeEntry({ restrictions: [{ type: 'minLevel', value: 3 }] })
    const hero = makeHero({ level: 2 })
    const issues = evaluateRestrictions(hero, entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('RESTRICTION_FAILED')
    expect(issues[0].ruleEntryId).toBe('entry-1')
  })

  it('minLevel: passes when hero level meets requirement', () => {
    const entry = makeEntry({ restrictions: [{ type: 'minLevel', value: 2 }] })
    const hero = makeHero({ level: 2 })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  it('minLevel: passes when hero level exceeds requirement', () => {
    const entry = makeEntry({ restrictions: [{ type: 'minLevel', value: 1 }] })
    const hero = makeHero({ level: 3 })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  // ── requiresSkillIds ──────────────────────────────────────────────────────

  it('requiresSkillIds: fails when required skill not selected', () => {
    const entry = makeEntry({ restrictions: [{ type: 'requiresSkillIds', ids: ['skill-x'] }] })
    const hero = makeHero({ battleSkillIds: [] })
    const issues = evaluateRestrictions(hero, entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('RESTRICTION_FAILED')
  })

  it('requiresSkillIds: passes when all required skills are selected', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'requiresSkillIds', ids: [SKILL_1_ID] }],
    })
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID] })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  // ── excludesSkillIds ──────────────────────────────────────────────────────

  it('excludesSkillIds: fails when conflicting skill is selected', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'excludesSkillIds', ids: [SKILL_1_ID] }],
    })
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID] })
    const issues = evaluateRestrictions(hero, entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('RESTRICTION_FAILED')
  })

  it('excludesSkillIds: passes when conflicting skill is not selected', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'excludesSkillIds', ids: [SKILL_1_ID] }],
    })
    const hero = makeHero({ battleSkillIds: [] })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  // ── requiresArchetypeId ───────────────────────────────────────────────────

  it('requiresArchetypeId: fails when archetype does not match', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'requiresArchetypeId', id: 'other-arch' }],
    })
    const hero = makeHero({ archetypeId: ARCHETYPE_ID })
    const issues = evaluateRestrictions(hero, entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('RESTRICTION_FAILED')
  })

  it('requiresArchetypeId: passes when archetype matches', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'requiresArchetypeId', id: ARCHETYPE_ID }],
    })
    const hero = makeHero({ archetypeId: ARCHETYPE_ID })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  // ── requiresHeroOptionIds ─────────────────────────────────────────────────

  it('requiresHeroOptionIds: fails when hero option not in allowed list', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'requiresHeroOptionIds', ids: ['other-option'] }],
    })
    const hero = makeHero({ heroOptionId: HERO_OPTION_ID })
    const issues = evaluateRestrictions(hero, entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('RESTRICTION_FAILED')
  })

  it('requiresHeroOptionIds: passes when hero option is in allowed list', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'requiresHeroOptionIds', ids: [HERO_OPTION_ID] }],
    })
    const hero = makeHero({ heroOptionId: HERO_OPTION_ID })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  // ── maxPerHero ────────────────────────────────────────────────────────────

  it('maxPerHero: fails when skill taken more times than allowed', () => {
    const entry = makeEntry({
      id: SKILL_1_ID,
      restrictions: [{ type: 'maxPerHero', value: 1 }],
    })
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID, SKILL_1_ID] })
    const issues = evaluateRestrictions(hero, entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('RESTRICTION_FAILED')
  })

  it('maxPerHero: passes when within the limit', () => {
    const entry = makeEntry({
      id: SKILL_1_ID,
      restrictions: [{ type: 'maxPerHero', value: 2 }],
    })
    const hero = makeHero({ battleSkillIds: [SKILL_1_ID, SKILL_1_ID] })
    expect(evaluateRestrictions(hero, entry, ruleset)).toHaveLength(0)
  })

  // ── custom restriction ────────────────────────────────────────────────────

  it('custom restriction produces MANUAL_REVIEW_PENDING with the description', () => {
    const entry = makeEntry({
      restrictions: [{ type: 'custom', description: 'Check campaign phase manually.' }],
    })
    const issues = evaluateRestrictions(makeHero(), entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('MANUAL_REVIEW_PENDING')
    expect(issues[0].message).toBe('Check campaign phase manually.')
  })

  // ── needsManualReview ─────────────────────────────────────────────────────

  it('needsManualReview: true produces MANUAL_REVIEW_PENDING', () => {
    const entry = makeEntry({ needsManualReview: true })
    const issues = evaluateRestrictions(makeHero(), entry, ruleset)
    expect(issues).toHaveLength(1)
    expect(issues[0].code).toBe('MANUAL_REVIEW_PENDING')
  })

  it('needsManualReview: does not duplicate when custom restriction already added one', () => {
    const entry = makeEntry({
      needsManualReview: true,
      restrictions: [{ type: 'custom', description: 'Manual check.' }],
    })
    const issues = evaluateRestrictions(makeHero(), entry, ruleset)
    const manualReviews = issues.filter(i => i.code === 'MANUAL_REVIEW_PENDING')
    expect(manualReviews).toHaveLength(1)
  })
})
