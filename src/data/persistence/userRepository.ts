import type { UserDataEnvelope, Campaign, Hero, Uuid } from '../../domain/hero/types'
import { USER_DATA_SCHEMA_VERSION } from '../../domain/rules/types'
import { runMigrations } from '../../domain/migrations/index'
import { db, type AppRecord } from './db'

const RECORD_ID = 1

function emptyEnvelope(): UserDataEnvelope {
  return {
    userDataSchemaVersion: USER_DATA_SCHEMA_VERSION,
    campaigns: [],
  }
}

async function getRecord(): Promise<AppRecord> {
  const record = await db.appData.get(RECORD_ID)
  return record ?? { id: RECORD_ID, envelope: emptyEnvelope() }
}

// ── Envelope ──────────────────────────────────────────────────────────────────

export async function loadEnvelope(): Promise<UserDataEnvelope> {
  const record = await getRecord()
  return runMigrations(record.envelope)
}

export async function saveEnvelope(envelope: UserDataEnvelope): Promise<void> {
  const record = await getRecord()
  await db.appData.put({ ...record, envelope })
}

// ── Campaigns ─────────────────────────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  const envelope = await loadEnvelope()
  return envelope.campaigns
}

export async function getCampaignById(id: Uuid): Promise<Campaign | undefined> {
  const campaigns = await getCampaigns()
  return campaigns.find((c) => c.id === id)
}

export async function saveCampaign(campaign: Campaign): Promise<void> {
  const envelope = await loadEnvelope()
  const idx = envelope.campaigns.findIndex((c) => c.id === campaign.id)
  const updated = [...envelope.campaigns]
  if (idx >= 0) {
    updated[idx] = campaign
  } else {
    updated.push(campaign)
  }
  await saveEnvelope({ ...envelope, campaigns: updated })
}

export async function deleteCampaign(id: Uuid): Promise<void> {
  const envelope = await loadEnvelope()
  await saveEnvelope({
    ...envelope,
    campaigns: envelope.campaigns.filter((c) => c.id !== id),
  })
}

// ── Heroes (within a campaign) ────────────────────────────────────────────────

export async function saveHero(campaignId: Uuid, hero: Hero): Promise<void> {
  const campaign = await getCampaignById(campaignId)
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`)
  const idx = campaign.heroes.findIndex((h) => h.id === hero.id)
  const updated = [...campaign.heroes]
  if (idx >= 0) {
    updated[idx] = hero
  } else {
    updated.push(hero)
  }
  await saveCampaign({ ...campaign, heroes: updated })
}

export async function deleteHero(campaignId: Uuid, heroId: Uuid): Promise<void> {
  const campaign = await getCampaignById(campaignId)
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`)
  await saveCampaign({
    ...campaign,
    heroes: campaign.heroes.filter((h) => h.id !== heroId),
  })
}

// ── Backup tracking ───────────────────────────────────────────────────────────

export async function getLastBackupAt(): Promise<string | undefined> {
  const record = await getRecord()
  return record.lastBackupAt
}

export async function setLastBackupAt(date: string): Promise<void> {
  const record = await getRecord()
  await db.appData.put({ ...record, lastBackupAt: date })
}

// ── Storage persistence ───────────────────────────────────────────────────────

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return navigator.storage.persist()
  }
  return false
}

export async function checkPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persisted) {
    return navigator.storage.persisted()
  }
  return false
}
