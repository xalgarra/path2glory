// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  loadRuleset,
  getFactionById,
  getHeroOptionsByFactionId,
  getBattleSkillTablesByFactionId,
  getAllBattleSkillsForFaction,
} from './index'
import {
  parseRulesMeta,
  parseFactionMeta,
  parseFactionJson,
  parseHeroOptions,
  parseBattleSkillTables,
  parseArchetypes,
  parseOrigins,
  parseFlaws,
} from './schemas'
import { APP_DATA_FORMAT_VERSION } from '../../domain/rules/types'

const IDONETH_ID = 'idoneth-deepkin'

// ── loadRuleset ───────────────────────────────────────────────────────────────

describe('loadRuleset', () => {
  it('loads without throwing', () => {
    expect(() => loadRuleset()).not.toThrow()
  })

  it('meta has the correct appDataFormatVersion', () => {
    const ruleset = loadRuleset()
    expect(ruleset.meta.appDataFormatVersion).toBe(APP_DATA_FORMAT_VERSION)
  })

  it('idoneth-deepkin faction is present', () => {
    const ruleset = loadRuleset()
    const faction = getFactionById(ruleset, IDONETH_ID)
    expect(faction).toBeDefined()
    expect(faction?.factionId).toBe(IDONETH_ID)
    expect(faction?.name).toBe('Idoneth Deepkin')
    expect(faction?.grandAlliance).toBe('order')
  })

  it('factionRulesVersion is present on idoneth', () => {
    const ruleset = loadRuleset()
    const faction = getFactionById(ruleset, IDONETH_ID)
    expect(typeof faction?.factionRulesVersion).toBe('string')
    expect(faction?.factionRulesVersion.length).toBeGreaterThan(0)
  })

  it('idoneth has at least one hero option', () => {
    const ruleset = loadRuleset()
    const options = getHeroOptionsByFactionId(ruleset, IDONETH_ID)
    expect(options.length).toBeGreaterThanOrEqual(1)
  })

  it('hero options have valid baseDestinyCost', () => {
    const ruleset = loadRuleset()
    const options = getHeroOptionsByFactionId(ruleset, IDONETH_ID)
    for (const opt of options) {
      expect(typeof opt.baseDestinyCost).toBe('number')
      expect(opt.baseDestinyCost).toBeGreaterThanOrEqual(0)
    }
  })

  it('hero options with destinyBudgetByLevel have numeric keys', () => {
    const ruleset = loadRuleset()
    const options = getHeroOptionsByFactionId(ruleset, IDONETH_ID)
    for (const opt of options) {
      if (opt.destinyBudgetByLevel !== undefined) {
        for (const key of Object.keys(opt.destinyBudgetByLevel)) {
          expect(Number.isNaN(Number(key))).toBe(false)
        }
      }
    }
  })

  it('idoneth has at least two battle skill tables', () => {
    const ruleset = loadRuleset()
    const tables = getBattleSkillTablesByFactionId(ruleset, IDONETH_ID)
    expect(tables.length).toBeGreaterThanOrEqual(2)
  })

  it('each battle skill table has at least one skill', () => {
    const ruleset = loadRuleset()
    const tables = getBattleSkillTablesByFactionId(ruleset, IDONETH_ID)
    for (const table of tables) {
      expect(table.skills.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('battle skills have valid destinyCost', () => {
    const ruleset = loadRuleset()
    const skills = getAllBattleSkillsForFaction(ruleset, IDONETH_ID)
    for (const skill of skills) {
      expect(typeof skill.destinyCost).toBe('number')
      expect(skill.destinyCost).toBeGreaterThanOrEqual(0)
    }
  })

  it('at least one skill has needsManualReview true', () => {
    const ruleset = loadRuleset()
    const skills = getAllBattleSkillsForFaction(ruleset, IDONETH_ID)
    expect(skills.some((s) => s.needsManualReview)).toBe(true)
  })

  it('at least one skill has a requiresSkillIds restriction', () => {
    const ruleset = loadRuleset()
    const skills = getAllBattleSkillsForFaction(ruleset, IDONETH_ID)
    expect(
      skills.some((s) => s.restrictions.some((r) => r.type === 'requiresSkillIds'))
    ).toBe(true)
  })

  it('at least one skill has a custom restriction', () => {
    const ruleset = loadRuleset()
    const skills = getAllBattleSkillsForFaction(ruleset, IDONETH_ID)
    expect(
      skills.some((s) => s.restrictions.some((r) => r.type === 'custom'))
    ).toBe(true)
  })

  it('shared archetypes are loaded', () => {
    const ruleset = loadRuleset()
    expect(ruleset.archetypes.length).toBeGreaterThanOrEqual(1)
  })

  it('shared origins are loaded', () => {
    const ruleset = loadRuleset()
    expect(ruleset.origins.length).toBeGreaterThanOrEqual(1)
  })

  it('shared flaws are loaded', () => {
    const ruleset = loadRuleset()
    expect(ruleset.flaws.length).toBeGreaterThanOrEqual(1)
  })

  it('unknown faction returns undefined', () => {
    const ruleset = loadRuleset()
    expect(getFactionById(ruleset, 'no-such-faction')).toBeUndefined()
  })

  it('unknown faction hero options returns empty array', () => {
    const ruleset = loadRuleset()
    expect(getHeroOptionsByFactionId(ruleset, 'no-such-faction')).toEqual([])
  })
})

// ── Schema validation ─────────────────────────────────────────────────────────

describe('schema validation rejects invalid data', () => {
  it('parseRulesMeta rejects missing appDataFormatVersion', () => {
    expect(() => parseRulesMeta({ generatedAt: '2026-01-01' })).toThrow()
  })

  it('parseFactionMeta rejects missing factionRulesVersion', () => {
    expect(() =>
      parseFactionMeta({ factionId: 'x', factionRulesUpdatedAt: '2026-01-01' })
    ).toThrow()
  })

  it('parseFactionJson rejects invalid grandAlliance', () => {
    expect(() =>
      parseFactionJson({ id: 'x', name: 'X', grandAlliance: 'neutral' })
    ).toThrow()
  })

  it('parseHeroOptions rejects hero option missing baseDestinyCost', () => {
    expect(() =>
      parseHeroOptions([
        {
          id: 'h1',
          name: 'Hero',
          description: '',
          ruleText: '',
          tags: [],
          restrictions: [],
          needsManualReview: false,
          allowedArchetypeIds: [],
          allowedBattleSkillTableIds: [],
        },
      ])
    ).toThrow()
  })

  it('parseBattleSkillTables rejects skill missing destinyCost', () => {
    expect(() =>
      parseBattleSkillTables({
        tables: [
          {
            id: 'tbl',
            name: 'Table',
            skills: [
              {
                id: 's1',
                name: 'Skill',
                description: '',
                ruleText: '',
                tags: [],
                restrictions: [],
                needsManualReview: false,
              },
            ],
          },
        ],
      })
    ).toThrow()
  })

  it('parseArchetypes rejects entry missing needsManualReview', () => {
    expect(() =>
      parseArchetypes([
        { id: 'a1', name: 'A', description: '', ruleText: '', tags: [], restrictions: [] },
      ])
    ).toThrow()
  })

  it('parseOrigins rejects entry missing id', () => {
    expect(() =>
      parseOrigins([
        {
          name: 'O',
          description: '',
          ruleText: '',
          tags: [],
          restrictions: [],
          needsManualReview: false,
        },
      ])
    ).toThrow()
  })

  it('parseFlaws rejects entry missing name', () => {
    expect(() =>
      parseFlaws([
        {
          id: 'f1',
          description: '',
          ruleText: '',
          tags: [],
          restrictions: [],
          needsManualReview: false,
        },
      ])
    ).toThrow()
  })
})
