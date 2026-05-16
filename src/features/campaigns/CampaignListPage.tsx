import { useState } from 'react'
import { useCampaignStore } from './campaignStore'
import { useBackupStore, backupIsStale } from '../backup/backupStore'
import { navigate } from '../../app/router'
import PageContainer from '../../ui/layout/PageContainer'
import Card from '../../ui/primitives/Card'
import Button from '../../ui/primitives/Button'
import Input from '../../ui/primitives/Input'

export default function CampaignListPage() {
  const { campaigns, loading, error, createCampaign } = useCampaignStore()
  const { lastBackupAt } = useBackupStore()
  const stale = backupIsStale(lastBackupAt)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [budgetOverride, setBudgetOverride] = useState('')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  function openForm() {
    setName('')
    setBudgetOverride('')
    setNameError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('Campaign name is required.')
      return
    }
    setSaving(true)
    try {
      const override =
        budgetOverride !== '' ? parseInt(budgetOverride, 10) : undefined
      const id = await createCampaign(name.trim(), override)
      setShowForm(false)
      navigate({ name: 'campaign-detail', campaignId: id })
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer>
      <div className="pt-8 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Path to Glory</h1>
          <p className="text-slate-400 mt-1">Campaign Manager</p>
        </div>
        <button
          onClick={() => navigate({ name: 'backup' })}
          className="relative text-slate-400 hover:text-slate-200 text-sm min-h-[44px] px-2 pb-1"
        >
          {stale && (
            <span className="absolute top-2 right-1 w-2 h-2 bg-amber-400 rounded-full" />
          )}
          Backup
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading campaigns…</p>
      ) : campaigns.length === 0 && !showForm ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-slate-300 font-medium">No campaigns yet</p>
          <p className="text-slate-500 text-sm">
            Create your first campaign to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card
              key={c.id}
              onClick={() => navigate({ name: 'campaign-detail', campaignId: c.id })}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {c.heroes.length === 1
                      ? '1 hero'
                      : `${c.heroes.length} heroes`}{' '}
                    · {formatDate(c.createdAt)}
                  </p>
                </div>
                <span className="text-slate-500 text-xl ml-3" aria-hidden>
                  ›
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4"
        >
          <h2 className="font-semibold text-lg">New Campaign</h2>

          <Input
            id="campaign-name"
            label="Campaign name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (e.target.value.trim()) setNameError('')
            }}
            placeholder="e.g. Realm of Shyish"
            error={nameError}
            autoFocus
          />

          <div className="flex flex-col gap-1">
            <Input
              id="budget-override"
              label="Destiny budget override (optional)"
              type="number"
              min={0}
              value={budgetOverride}
              onChange={(e) => setBudgetOverride(e.target.value)}
              placeholder="Leave empty to use rules default"
            />
            <p className="text-xs text-slate-500">
              House rule — overrides the destiny budget for all heroes in this campaign.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={closeForm} fullWidth>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} fullWidth>
              {saving ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </form>
      )}

      {!showForm && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4">
          <Button onClick={openForm} className="shadow-lg shadow-black/50 max-w-lg w-full">
            + New Campaign
          </Button>
        </div>
      )}
    </PageContainer>
  )
}
