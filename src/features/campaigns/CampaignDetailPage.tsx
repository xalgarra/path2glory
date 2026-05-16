import { useState } from 'react'
import { useCampaignStore } from './campaignStore'
import { navigate } from '../../app/router'
import PageContainer from '../../ui/layout/PageContainer'
import SectionHeader from '../../ui/layout/SectionHeader'
import Button from '../../ui/primitives/Button'
import Dialog from '../../ui/primitives/Dialog'
import Badge from '../../ui/primitives/Badge'

interface CampaignDetailPageProps {
  campaignId: string
}

export default function CampaignDetailPage({ campaignId }: CampaignDetailPageProps) {
  const { campaigns, loading, removeCampaign } = useCampaignStore()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const campaign = campaigns.find((c) => c.id === campaignId)

  async function handleDelete() {
    setDeleting(true)
    try {
      await removeCampaign(campaignId)
      navigate({ name: 'campaign-list' })
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <PageContainer>
      <div className="pt-6 pb-4">
        <button
          onClick={() => navigate({ name: 'campaign-list' })}
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm mb-4 min-h-[44px]"
        >
          ‹ All Campaigns
        </button>

        {loading && !campaign ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : !campaign ? (
          <div className="text-center py-16 space-y-2">
            <p className="text-slate-300 font-medium">Campaign not found</p>
            <p className="text-slate-500 text-sm">It may have been deleted.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>

            {campaign.destinyBudgetOverride !== undefined && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-xs">
                <span>House rule</span>
                <span className="font-semibold">
                  Budget: {campaign.destinyBudgetOverride} destiny points
                </span>
              </div>
            )}

            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <SectionHeader
                  title="Heroes"
                  subtitle={
                    campaign.heroes.length === 0
                      ? undefined
                      : `${campaign.heroes.length} hero${campaign.heroes.length !== 1 ? 'es' : ''}`
                  }
                />
                <Button
                  variant="secondary"
                  onClick={() => navigate({ name: 'hero-new', campaignId })}
                  className="text-sm"
                >
                  + Create Hero
                </Button>
              </div>

              {campaign.heroes.length === 0 ? (
                <div className="text-center py-10 space-y-2 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-slate-400">No heroes yet</p>
                  <p className="text-slate-600 text-sm">Tap "Create Hero" to add one.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {campaign.heroes.map((hero) => (
                    <button
                      key={hero.id}
                      onClick={() => navigate({ name: 'hero-sheet', campaignId, heroId: hero.id })}
                      className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between min-h-[60px] hover:border-slate-700 active:bg-slate-800 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{hero.name}</p>
                        <p className="text-sm text-slate-400 mt-0.5 truncate">{hero.factionId}</p>
                      </div>
                      <Badge variant="slate">Level {hero.level}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12">
              <Button
                variant="danger"
                fullWidth
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete Campaign'}
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={confirmDelete}
        title="Delete campaign?"
        description={`"${campaign?.name ?? ''}" and all its heroes will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </PageContainer>
  )
}
