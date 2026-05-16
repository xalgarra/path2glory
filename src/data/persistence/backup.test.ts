// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { serializeBackup, parseAndValidateBackup, importBackup } from './backup'
import { makeEnvelope, makeCampaign, makeHero } from '../../test/domain-fixtures'
import { USER_DATA_SCHEMA_VERSION } from '../../domain/rules/types'

// ── serializeBackup ───────────────────────────────────────────────────────────

describe('serializeBackup', () => {
  it('returns a string', () => {
    expect(typeof serializeBackup(makeEnvelope())).toBe('string')
  })

  it('output is valid JSON', () => {
    expect(() => JSON.parse(serializeBackup(makeEnvelope()))).not.toThrow()
  })

  it('sets exportedAt to an ISO string', () => {
    const result = JSON.parse(serializeBackup(makeEnvelope()))
    expect(typeof result.exportedAt).toBe('string')
    expect(() => new Date(result.exportedAt)).not.toThrow()
  })

  it('preserves userDataSchemaVersion', () => {
    const result = JSON.parse(serializeBackup(makeEnvelope()))
    expect(result.userDataSchemaVersion).toBe(USER_DATA_SCHEMA_VERSION)
  })

  it('preserves campaigns', () => {
    const campaign = makeCampaign({ id: 'c1', name: 'My Campaign' })
    const result = JSON.parse(serializeBackup(makeEnvelope([campaign])))
    expect(result.campaigns).toHaveLength(1)
    expect(result.campaigns[0].id).toBe('c1')
    expect(result.campaigns[0].name).toBe('My Campaign')
  })

  it('preserves heroes within campaigns', () => {
    const hero = makeHero({ id: 'h1', name: 'My Hero' })
    const campaign = makeCampaign({ heroes: [hero] })
    const result = JSON.parse(serializeBackup(makeEnvelope([campaign])))
    expect(result.campaigns[0].heroes).toHaveLength(1)
    expect(result.campaigns[0].heroes[0].id).toBe('h1')
  })

  it('does not mutate the original envelope', () => {
    const envelope = makeEnvelope()
    serializeBackup(envelope)
    expect(envelope.exportedAt).toBeUndefined()
  })
})

// ── parseAndValidateBackup ────────────────────────────────────────────────────

describe('parseAndValidateBackup', () => {
  it('returns a valid envelope for correct input', () => {
    const json = serializeBackup(makeEnvelope([makeCampaign()]))
    const result = parseAndValidateBackup(json)
    expect(result.campaigns).toHaveLength(1)
    expect(typeof result.userDataSchemaVersion).toBe('number')
  })

  it('throws on non-JSON input', () => {
    expect(() => parseAndValidateBackup('not json at all')).toThrow()
  })

  it('throws when userDataSchemaVersion is missing', () => {
    const json = JSON.stringify({ campaigns: [] })
    expect(() => parseAndValidateBackup(json)).toThrow()
  })

  it('throws when campaigns array is missing', () => {
    const json = JSON.stringify({ userDataSchemaVersion: 1 })
    expect(() => parseAndValidateBackup(json)).toThrow()
  })

  it('throws when a campaign is missing name', () => {
    const json = JSON.stringify({
      userDataSchemaVersion: 1,
      campaigns: [{ id: 'c1', createdAt: '2026-01-01', updatedAt: '2026-01-01', heroes: [] }],
    })
    expect(() => parseAndValidateBackup(json)).toThrow()
  })

  it('throws when a hero is missing factionId', () => {
    const hero = { ...makeHero() }
    // @ts-expect-error intentional invalid data for test
    delete hero.factionId
    const json = JSON.stringify({
      userDataSchemaVersion: 1,
      campaigns: [{ ...makeCampaign(), heroes: [hero] }],
    })
    expect(() => parseAndValidateBackup(json)).toThrow()
  })

  it('throws when a hero has a non-integer level', () => {
    const json = JSON.stringify({
      userDataSchemaVersion: 1,
      campaigns: [{ ...makeCampaign(), heroes: [{ ...makeHero(), level: 1.5 }] }],
    })
    expect(() => parseAndValidateBackup(json)).toThrow()
  })

  it('accepts an envelope with older schema version (does not auto-migrate)', () => {
    const json = JSON.stringify({ ...makeEnvelope(), userDataSchemaVersion: 0 })
    const result = parseAndValidateBackup(json)
    expect(result.userDataSchemaVersion).toBe(0)
  })
})

// ── importBackup ──────────────────────────────────────────────────────────────

describe('importBackup', () => {
  it('stamps current schema version after import', () => {
    const old = JSON.stringify({ ...makeEnvelope(), userDataSchemaVersion: 0 })
    const result = importBackup(old)
    expect(result.userDataSchemaVersion).toBe(USER_DATA_SCHEMA_VERSION)
  })

  it('preserves campaigns through import', () => {
    const campaign = makeCampaign({ id: 'c1' })
    const json = serializeBackup(makeEnvelope([campaign]))
    const result = importBackup(json)
    expect(result.campaigns).toHaveLength(1)
    expect(result.campaigns[0].id).toBe('c1')
  })

  it('throws on invalid input (propagates parseAndValidateBackup error)', () => {
    expect(() => importBackup('garbage')).toThrow()
  })
})
