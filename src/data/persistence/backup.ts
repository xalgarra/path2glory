import { z } from 'zod'
import type { UserDataEnvelope } from '../../domain/hero/types'
import { runMigrations } from '../../domain/migrations/index'

// ── Zod schemas ───────────────────────────────────────────────────────────────

const heroSchema = z.object({
  id: z.string(),
  name: z.string(),
  factionId: z.string(),
  factionRulesVersionAtCreation: z.string(),
  heroOptionId: z.string(),
  archetypeId: z.string(),
  originId: z.string().nullable(),
  flawId: z.string().nullable(),
  level: z.number().int().positive(),
  battleSkillIds: z.array(z.string()),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const campaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  destinyBudgetOverride: z.number().int().nonnegative().optional(),
  heroes: z.array(heroSchema),
})

const envelopeSchema = z.object({
  userDataSchemaVersion: z.number().int().nonnegative(),
  exportedAt: z.string().optional(),
  campaigns: z.array(campaignSchema),
})

// ── Pure functions ────────────────────────────────────────────────────────────

export function serializeBackup(envelope: UserDataEnvelope): string {
  const stamped: UserDataEnvelope = { ...envelope, exportedAt: new Date().toISOString() }
  return JSON.stringify(stamped, null, 2)
}

export function parseAndValidateBackup(json: string): UserDataEnvelope {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Backup file is not valid JSON')
  }
  return envelopeSchema.parse(parsed) as UserDataEnvelope
}

export function importBackup(json: string): UserDataEnvelope {
  const envelope = parseAndValidateBackup(json)
  return runMigrations(envelope)
}

// ── Browser-only ──────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadBackup(envelope: UserDataEnvelope): void {
  const json = serializeBackup(envelope)
  const blob = new Blob([json], { type: 'application/json' })
  const date = new Date().toISOString().slice(0, 10)
  const filename = `path-to-glory-backup-${date}.json`
  triggerDownload(blob, filename)
}
