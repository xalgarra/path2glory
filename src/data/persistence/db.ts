import Dexie, { type Table } from 'dexie'
import type { UserDataEnvelope } from '../../domain/hero/types'

export interface AppRecord {
  id: number
  envelope: UserDataEnvelope
  lastBackupAt?: string
}

class AppDatabase extends Dexie {
  appData!: Table<AppRecord, number>

  constructor() {
    super('PathToGloryDB')
    this.version(1).stores({
      appData: 'id',
    })
  }
}

export const db = new AppDatabase()
