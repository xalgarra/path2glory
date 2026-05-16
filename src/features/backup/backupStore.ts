import { create } from 'zustand'
import {
  loadEnvelope,
  saveEnvelope,
  getLastBackupAt,
  setLastBackupAt,
  checkPersistentStorage,
  requestPersistentStorage,
} from '../../data/persistence/userRepository'
import { downloadBackup, importBackup } from '../../data/persistence/backup'

export const BACKUP_REMINDER_DAYS = 7

export function backupIsStale(lastBackupAt: string | undefined): boolean {
  if (!lastBackupAt) return true
  const daysSince = (Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSince > BACKUP_REMINDER_DAYS
}

interface BackupState {
  lastBackupAt: string | undefined
  storageIsPersisted: boolean
  loading: boolean
  error: string | null
  init: () => Promise<void>
  runExport: () => Promise<void>
  runImport: (json: string) => Promise<void>
}

export const useBackupStore = create<BackupState>((set) => ({
  lastBackupAt: undefined,
  storageIsPersisted: false,
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      await requestPersistentStorage()
      const [lastBackupAt, storageIsPersisted] = await Promise.all([
        getLastBackupAt(),
        checkPersistentStorage(),
      ])
      set({ lastBackupAt, storageIsPersisted, loading: false })
    } catch {
      set({ loading: false, error: 'Failed to load backup state.' })
    }
  },

  runExport: async () => {
    set({ error: null })
    try {
      const envelope = await loadEnvelope()
      downloadBackup(envelope)
      const now = new Date().toISOString()
      await setLastBackupAt(now)
      set({ lastBackupAt: now })
    } catch {
      set({ error: 'Export failed. Please try again.' })
    }
  },

  runImport: async (json: string) => {
    set({ error: null })
    try {
      const envelope = importBackup(json)
      await saveEnvelope(envelope)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed.'
      set({ error: message })
      throw err
    }
  },
}))
