// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { runMigrations } from './index'
import { makeEnvelope, makeCampaign } from '../../test/domain-fixtures'
import { USER_DATA_SCHEMA_VERSION } from '../rules/types'

describe('runMigrations', () => {
  it('returns data stamped with the current schema version', () => {
    const result = runMigrations(makeEnvelope())
    expect(result.userDataSchemaVersion).toBe(USER_DATA_SCHEMA_VERSION)
  })

  it('preserves existing campaigns', () => {
    const campaign = makeCampaign({ id: 'my-campaign', name: 'My Campaign' })
    const result = runMigrations(makeEnvelope([campaign]))
    expect(result.campaigns).toHaveLength(1)
    expect(result.campaigns[0].id).toBe('my-campaign')
    expect(result.campaigns[0].name).toBe('My Campaign')
  })

  it('handles an envelope with no campaigns', () => {
    const result = runMigrations(makeEnvelope([]))
    expect(result.campaigns).toHaveLength(0)
  })

  it('does not mutate the original data', () => {
    const original = makeEnvelope([makeCampaign()])
    runMigrations(original)
    expect(original.userDataSchemaVersion).toBe(USER_DATA_SCHEMA_VERSION)
  })

  it('stamps an old schema version with the current version', () => {
    const old = { ...makeEnvelope(), userDataSchemaVersion: 0 }
    const result = runMigrations(old)
    expect(result.userDataSchemaVersion).toBe(USER_DATA_SCHEMA_VERSION)
  })
})
