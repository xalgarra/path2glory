import type { Hero, Campaign, UserDataEnvelope } from '../domain/hero/types'
import type { LoadedRuleset } from '../domain/rules/types'
import { USER_DATA_SCHEMA_VERSION } from '../domain/rules/types'

// ── Stable IDs used across fixtures ──────────────────────────────────────────

export const FACTION_ID = 'test-faction'
export const HERO_OPTION_ID = 'test-hero-option'
export const ARCHETYPE_ID = 'test-archetype'
export const ORIGIN_ID = 'test-origin'
export const FLAW_ID = 'test-flaw'
export const SKILL_1_ID = 'skill-1'
export const SKILL_2_ID = 'skill-2'
export const SKILL_TABLE_ID = 'test-table'

// ── Factory helpers ───────────────────────────────────────────────────────────

export function makeRuleset(overrides: Partial<LoadedRuleset> = {}): LoadedRuleset {
  return {
    meta: { appDataFormatVersion: 1, generatedAt: '2026-01-01T00:00:00Z' },
    factions: [
      {
        factionId: FACTION_ID,
        factionRulesVersion: '2026-01-v1',
        factionRulesUpdatedAt: '2026-01-01',
        name: 'Test Faction',
        grandAlliance: 'order',
      },
    ],
    archetypes: [
      {
        id: ARCHETYPE_ID,
        name: 'Test Archetype',
        description: 'Desc',
        ruleText: 'Rule text.',
        tags: [],
        restrictions: [],
        needsManualReview: false,
      },
    ],
    origins: [
      {
        id: ORIGIN_ID,
        name: 'Test Origin',
        description: 'Desc',
        ruleText: 'Rule text.',
        tags: [],
        restrictions: [],
        needsManualReview: false,
      },
    ],
    flaws: [
      {
        id: FLAW_ID,
        name: 'Test Flaw',
        description: 'Desc',
        ruleText: 'Rule text.',
        tags: [],
        restrictions: [],
        needsManualReview: false,
      },
    ],
    archetypesByFactionId: {},
    originsByFactionId: {},
    flawsByFactionId: {},
    heroOptionsByFactionId: {
      [FACTION_ID]: [
        {
          id: HERO_OPTION_ID,
          name: 'Test Hero Option',
          description: 'Desc',
          ruleText: 'Rule text.',
          tags: [],
          restrictions: [],
          needsManualReview: false,
          baseDestinyCost: 4,
          allowedArchetypeIds: [ARCHETYPE_ID],
          allowedBattleSkillTableIds: [SKILL_TABLE_ID],
          destinyBudgetByLevel: { 1: 6, 2: 8, 3: 10 },
        },
      ],
    },
    battleSkillTablesByFactionId: {
      [FACTION_ID]: [
        {
          id: SKILL_TABLE_ID,
          name: 'Test Skills',
          skills: [
            {
              id: SKILL_1_ID,
              name: 'Skill One',
              description: 'Desc',
              ruleText: 'Rule text.',
              tags: [],
              restrictions: [],
              needsManualReview: false,
              destinyCost: 1,
            },
            {
              id: SKILL_2_ID,
              name: 'Skill Two',
              description: 'Desc',
              ruleText: 'Rule text.',
              tags: [],
              restrictions: [],
              needsManualReview: false,
              destinyCost: 2,
            },
          ],
        },
      ],
    },
    ...overrides,
  }
}

export function makeHero(overrides: Partial<Hero> = {}): Hero {
  return {
    id: 'hero-1',
    name: 'Test Hero',
    factionId: FACTION_ID,
    factionRulesVersionAtCreation: '2026-01-v1',
    heroOptionId: HERO_OPTION_ID,
    archetypeId: ARCHETYPE_ID,
    originId: ORIGIN_ID,
    flawId: FLAW_ID,
    level: 1,
    battleSkillIds: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function makeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'campaign-1',
    name: 'Test Campaign',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    heroes: [],
    ...overrides,
  }
}

export function makeEnvelope(campaigns: Campaign[] = []): UserDataEnvelope {
  return {
    userDataSchemaVersion: USER_DATA_SCHEMA_VERSION,
    campaigns,
  }
}
