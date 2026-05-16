import { useEffect, useState } from 'react'
import { loadRuleset } from '../../../data/rules/index'
import { createHero } from '../../../domain/hero/heroFactory'
import { useCampaignStore } from '../../campaigns/campaignStore'
import { useHeroWizardStore, buildPreviewHero } from './heroWizardStore'
import { getFactionById, getHeroOptionsByFactionId, getBattleSkillTablesByFactionId } from '../../../data/rules/index'
import { navigate } from '../../../app/router'
import PageContainer from '../../../ui/layout/PageContainer'
import FactionStep from './steps/FactionStep'
import HeroTypeStep from './steps/HeroTypeStep'
import ArchetypeStep from './steps/ArchetypeStep'
import OriginStep from './steps/OriginStep'
import FlawStep from './steps/FlawStep'
import TableSkillsStep from './steps/TableSkillsStep'
import ReviewStep from './steps/ReviewStep'

const ruleset = loadRuleset()

// Steps 0–4 are fixed; steps 5…(5+N-1) are one per skill table; last step is Resumen.
const FIXED_BEFORE = 5

const FIXED_TITLES = ['Facción', 'Rango del héroe', 'Arquetipo', 'Origen', 'Defecto']

interface HeroWizardPageProps {
  campaignId: string
}

export default function HeroWizardPage({ campaignId }: HeroWizardPageProps) {
  const { step, factionId, heroOptionId, archetypeId, originId, flawId, battleSkillIds, heroName, reset, goBack } =
    useHeroWizardStore()
  const { campaigns, addHero } = useCampaignStore()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const campaign = campaigns.find((c) => c.id === campaignId)

  useEffect(() => {
    reset(campaignId)
  }, [campaignId, reset])

  // Compute which skill tables are available for the current hero option
  const heroOption =
    factionId && heroOptionId
      ? getHeroOptionsByFactionId(ruleset, factionId).find((o) => o.id === heroOptionId)
      : undefined
  const allTables = factionId ? getBattleSkillTablesByFactionId(ruleset, factionId) : []
  const skillTables =
    heroOption && heroOption.allowedBattleSkillTableIds.length > 0
      ? allTables.filter((t) => heroOption.allowedBattleSkillTableIds.includes(t.id))
      : allTables

  const reviewStepIndex = FIXED_BEFORE + skillTables.length
  const totalSteps = reviewStepIndex + 1

  const currentTableIndex = step >= FIXED_BEFORE && step < reviewStepIndex ? step - FIXED_BEFORE : -1
  const currentTable = currentTableIndex >= 0 ? skillTables[currentTableIndex] : null

  function getStepTitle(s: number): string {
    if (s < FIXED_BEFORE) return FIXED_TITLES[s]
    if (s === reviewStepIndex) return 'Resumen'
    const table = skillTables[s - FIXED_BEFORE]
    return table?.name ?? '…'
  }

  function handleBack() {
    if (step === 0) {
      navigate({ name: 'campaign-detail', campaignId })
    } else {
      goBack()
    }
  }

  function handleCancel() {
    navigate({ name: 'campaign-detail', campaignId })
  }

  async function handleSave() {
    if (!factionId || !heroOptionId || !archetypeId) return
    const faction = getFactionById(ruleset, factionId)
    if (!faction) return

    setSaving(true)
    setSaveError(null)
    try {
      const now = new Date().toISOString()
      const previewHero = buildPreviewHero(
        { factionId, heroOptionId, archetypeId, originId, flawId, battleSkillIds, heroName },
        faction.factionRulesVersion,
      )
      const hero = createHero({
        id: crypto.randomUUID(),
        name: previewHero.name,
        factionId: previewHero.factionId,
        factionRulesVersionAtCreation: previewHero.factionRulesVersionAtCreation,
        heroOptionId: previewHero.heroOptionId,
        archetypeId: previewHero.archetypeId,
        originId: previewHero.originId,
        flawId: previewHero.flawId,
        level: 1,
        battleSkillIds: previewHero.battleSkillIds,
        createdAt: now,
        updatedAt: now,
      })
      await addHero(campaignId, hero)
      navigate({ name: 'campaign-detail', campaignId })
    } catch {
      setSaveError('Error al guardar el héroe. Inténtalo de nuevo.')
      setSaving(false)
    }
  }

  if (!campaign) {
    return (
      <PageContainer>
        <div className="pt-16 text-center space-y-2">
          <p className="text-slate-300 font-medium">Campaña no encontrada</p>
          <button
            onClick={handleCancel}
            className="text-sky-400 hover:text-sky-300 text-sm min-h-[44px]"
          >
            Volver a campañas
          </button>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="pt-4">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={handleBack}
            className="text-sky-400 hover:text-sky-300 text-sm min-h-[44px] pr-4"
          >
            ‹ {step === 0 ? 'Cancelar' : 'Atrás'}
          </button>
          <span className="text-xs text-slate-500">
            {step + 1} / {totalSteps}
          </span>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-300 text-sm min-h-[44px] pl-4"
          >
            Cancelar
          </button>
        </div>

        <div className="w-full bg-slate-800 rounded-full h-1 mb-6">
          <div
            className="bg-sky-600 h-1 rounded-full transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <h1 className="text-xl font-bold mb-6">{getStepTitle(step)}</h1>

        {step === 0 && <FactionStep ruleset={ruleset} />}
        {step === 1 && <HeroTypeStep ruleset={ruleset} />}
        {step === 2 && <ArchetypeStep ruleset={ruleset} />}
        {step === 3 && <OriginStep ruleset={ruleset} />}
        {step === 4 && <FlawStep ruleset={ruleset} />}
        {currentTable && (
          <TableSkillsStep
            key={step}
            table={currentTable}
            ruleset={ruleset}
            campaign={campaign}
          />
        )}
        {step === reviewStepIndex && (
          <ReviewStep
            ruleset={ruleset}
            campaign={campaign}
            onSave={handleSave}
            saving={saving}
            saveError={saveError}
          />
        )}
      </div>
    </PageContainer>
  )
}
