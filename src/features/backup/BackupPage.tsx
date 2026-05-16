import { useRef, useState } from 'react'
import { importBackup } from '../../data/persistence/backup'
import type { UserDataEnvelope } from '../../domain/hero/types'
import { navigate } from '../../app/router'
import { useBackupStore, backupIsStale, BACKUP_REMINDER_DAYS } from './backupStore'
import PageContainer from '../../ui/layout/PageContainer'
import SectionHeader from '../../ui/layout/SectionHeader'
import Button from '../../ui/primitives/Button'
import Badge from '../../ui/primitives/Badge'
import Dialog from '../../ui/primitives/Dialog'

export default function BackupPage() {
  const { lastBackupAt, storageIsPersisted, loading, error, runExport, runImport } =
    useBackupStore()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [pendingEnvelope, setPendingEnvelope] = useState<UserDataEnvelope | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingJson, setPendingJson] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isStale = backupIsStale(lastBackupAt)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  async function handleExport() {
    setExporting(true)
    try {
      await runExport()
    } finally {
      setExporting(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const text = await file.text()
    try {
      const envelope = importBackup(text)
      setPendingEnvelope(envelope)
      setPendingJson(text)
      setParseError(null)
      setConfirmOpen(true)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid backup file.')
      setPendingEnvelope(null)
    }
  }

  async function handleConfirmImport() {
    if (!pendingJson) return
    setConfirmOpen(false)
    setImporting(true)
    try {
      await runImport(pendingJson)
      window.location.reload()
    } catch {
      setImporting(false)
    }
  }

  function handleCancelImport() {
    setConfirmOpen(false)
    setPendingEnvelope(null)
    setPendingJson(null)
  }

  return (
    <PageContainer>
      <div className="pt-6 space-y-6">
        <button
          onClick={() => navigate({ name: 'campaign-list' })}
          className="text-sky-400 hover:text-sky-300 text-sm min-h-[44px]"
        >
          ‹ All Campaigns
        </button>

        <h1 className="text-2xl font-bold tracking-tight">Data & Backup</h1>

        {/* ── Storage status ───────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Storage" />
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-slate-300">Persistent storage</span>
            {loading ? (
              <span className="text-slate-500 text-sm">Checking…</span>
            ) : (
              <Badge variant={storageIsPersisted ? 'sky' : 'amber'}>
                {storageIsPersisted ? 'Granted' : 'Not granted'}
              </Badge>
            )}
          </div>
          {!storageIsPersisted && !loading && (
            <p className="text-xs text-slate-500 mt-2 leading-snug">
              Without persistent storage, the browser may delete your data under storage pressure.
              Export a backup regularly.
            </p>
          )}
        </div>

        {/* ── Backup reminder ──────────────────────────────────────────── */}
        {isStale && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950 border border-amber-800">
            <Badge variant="amber">Reminder</Badge>
            <span className="text-amber-300 text-sm">
              {lastBackupAt
                ? `Last backup was ${formatDate(lastBackupAt)} — more than ${BACKUP_REMINDER_DAYS} days ago.`
                : `You have never exported a backup.`}{' '}
              Export one now to avoid data loss.
            </span>
          </div>
        )}

        {/* ── Export ───────────────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Export" />
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Last backup</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {lastBackupAt ? formatDate(lastBackupAt) : 'Never'}
                </p>
              </div>
              {lastBackupAt && !isStale && <Badge variant="sky">Up to date</Badge>}
            </div>
            <Button fullWidth onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : 'Export backup'}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Downloads a JSON file with all your campaigns and heroes.
            </p>
          </div>
        </div>

        {/* ── Import ───────────────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Import" />
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleFileChange}
            />
            <Button
              fullWidth
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? 'Importing…' : 'Import from file'}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Replaces all current data. Cannot be undone.
            </p>
            {parseError && (
              <p className="text-sm text-red-400 text-center">{parseError}</p>
            )}
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          </div>
        </div>

        <div className="pb-4" />
      </div>

      <Dialog
        open={confirmOpen}
        title="Replace all data?"
        description={
          pendingEnvelope
            ? `This will replace everything with ${pendingEnvelope.campaigns.length} campaign${pendingEnvelope.campaigns.length !== 1 ? 's' : ''} from the backup. This cannot be undone.`
            : ''
        }
        confirmLabel="Replace"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />
    </PageContainer>
  )
}
