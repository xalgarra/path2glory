import { useEffect } from 'react'
import { useHashRouter } from './router'
import { useServiceWorkerUpdate, useInstallPrompt } from './pwa'
import { useCampaignStore } from '../features/campaigns/campaignStore'
import { useBackupStore } from '../features/backup/backupStore'
import CampaignListPage from '../features/campaigns/CampaignListPage'
import CampaignDetailPage from '../features/campaigns/CampaignDetailPage'
import HeroWizardPage from '../features/heroes/HeroWizard/HeroWizardPage'
import HeroSheet from '../features/heroes/HeroSheet'
import BackupPage from '../features/backup/BackupPage'

export default function App() {
  const route = useHashRouter()
  const init = useCampaignStore((state) => state.init)
  const initBackup = useBackupStore((state) => state.init)
  const { needsUpdate, applyUpdate } = useServiceWorkerUpdate()
  const { canInstall, install } = useInstallPrompt()

  useEffect(() => {
    void init()
    void initBackup()
  }, [init, initBackup])

  return (
    <div>
      {needsUpdate && (
        <div className="bg-sky-900 border-b border-sky-700 px-4 py-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-sky-100">New version available.</span>
          <button
            onClick={applyUpdate}
            className="text-sky-300 font-semibold hover:text-white min-h-[44px] px-2"
          >
            Reload
          </button>
        </div>
      )}
      {canInstall && !needsUpdate && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-200">Install for offline use.</span>
          <button
            onClick={install}
            className="text-sky-400 font-semibold hover:text-sky-300 min-h-[44px] px-2"
          >
            Install
          </button>
        </div>
      )}
      {route.name === 'campaign-detail' ? (
        <CampaignDetailPage campaignId={route.campaignId} />
      ) : route.name === 'hero-new' ? (
        <HeroWizardPage campaignId={route.campaignId} />
      ) : route.name === 'hero-sheet' ? (
        <HeroSheet campaignId={route.campaignId} heroId={route.heroId} />
      ) : route.name === 'backup' ? (
        <BackupPage />
      ) : (
        <CampaignListPage />
      )}
    </div>
  )
}
