import type { LoadedRuleset } from '../../../../domain/rules/types'
import type { Campaign } from '../../../../domain/hero/types'
import { useHeroWizardStore, buildPreviewHero } from '../heroWizardStore'
import {
  getFactionById,
  getHeroOptionsByFactionId,
  getArchetypesForFaction,
  getOriginsForFaction,
  getFlawsForFaction,
} from '../../../../data/rules/index'
import { validateHero } from '../../../../domain/hero/heroValidator'
import Input from '../../../../ui/primitives/Input'
import Button from '../../../../ui/primitives/Button'
import Badge from '../../../../ui/primitives/Badge'

interface ReviewStepProps {
  ruleset: LoadedRuleset
  campaign: Campaign
  onSave: () => Promise<void>
  saving: boolean
  saveError: string | null
}

export default function ReviewStep({ ruleset, campaign, onSave, saving, saveError }: ReviewStepProps) {
  const { factionId, heroOptionId, archetypeId, originId, flawId, battleSkillIds, heroName, setHeroName } =
    useHeroWizardStore()

  const faction = factionId ? getFactionById(ruleset, factionId) : undefined
  const heroOption = factionId
    ? getHeroOptionsByFactionId(ruleset, factionId).find((o) => o.id === heroOptionId)
    : undefined
  const archetype = factionId
    ? getArchetypesForFaction(ruleset, factionId).find((a) => a.id === archetypeId)
    : ruleset.archetypes.find((a) => a.id === archetypeId)
  const origin = factionId
    ? getOriginsForFaction(ruleset, factionId).find((o) => o.id === originId)
    : ruleset.origins.find((o) => o.id === originId)
  const flaw = factionId
    ? getFlawsForFaction(ruleset, factionId).find((f) => f.id === flawId)
    : ruleset.flaws.find((f) => f.id === flawId)

  const allSkills = faction
    ? (ruleset.battleSkillTablesByFactionId[faction.factionId] ?? []).flatMap((t) => t.skills)
    : []
  const selectedSkills = battleSkillIds.map((id) => allSkills.find((s) => s.id === id)).filter(Boolean)

  const canValidate = !!factionId && !!heroOptionId && !!archetypeId && !!faction

  const validation = canValidate
    ? validateHero(
        buildPreviewHero(
          { factionId: factionId!, heroOptionId: heroOptionId!, archetypeId: archetypeId!, originId, flawId, battleSkillIds, heroName },
          faction!.factionRulesVersion,
        ),
        ruleset,
        campaign,
      )
    : null

  const warnings = validation?.violations.filter((v) => v.code === 'MANUAL_REVIEW_PENDING') ?? []
  const errors = validation?.violations.filter((v) => v.code !== 'MANUAL_REVIEW_PENDING') ?? []
  const nameEmpty = !heroName.trim()
  const canSave = !nameEmpty && errors.length === 0 && !saving

  const rows: { label: string; value: string | undefined }[] = [
    { label: 'Facción', value: faction?.name },
    { label: 'Rango', value: heroOption?.name },
    { label: 'Arquetipo', value: archetype?.name },
    { label: 'Origen', value: origin?.name ?? (originId === null ? '—' : undefined) },
    { label: 'Defecto', value: flaw?.name ?? (flawId === null ? '—' : undefined) },
  ]

  return (
    <div className="space-y-6 pb-4">
      <Input
        id="hero-name"
        label="Nombre del héroe"
        value={heroName}
        onChange={(e) => setHeroName(e.target.value)}
        placeholder="Introduce un nombre para este héroe"
        autoFocus
        error={nameEmpty ? 'El nombre del héroe es obligatorio.' : undefined}
      />

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between px-4 py-3 text-sm">
            <span className="text-slate-400">{label}</span>
            <span className="font-medium text-right">{value ?? '—'}</span>
          </div>
        ))}
      </div>

      {selectedSkills.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-300 mb-2">Mejoras</p>
          <div className="space-y-1">
            {selectedSkills.map((skill) =>
              skill ? (
                <div key={skill.id} className="flex justify-between text-sm px-1">
                  <span className="text-slate-300">{skill.name}</span>
                  <Badge variant="slate">{skill.destinyCost} pts</Badge>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}

      {validation && (
        <div className={`rounded-xl p-4 border ${errors.length > 0 ? 'bg-red-950 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-sm font-semibold mb-2 text-slate-300">Coste en PD</p>
          <div className="space-y-1 text-sm">
            {validation.base !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Base</span><span>{validation.base} PD</span>
              </div>
            )}
            {validation.archetypeOriginFlaw !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Arquetipo / Origen / Defecto</span>
                <span>
                  {validation.archetypeOriginFlaw > 0 ? '-' : '+'}{Math.abs(validation.archetypeOriginFlaw)} PD
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Mejoras</span><span>{validation.battleSkills} PD</span>
            </div>
            <div className={`flex justify-between font-semibold pt-1 border-t border-slate-700 ${errors.some(e => e.code === 'DESTINY_BUDGET_EXCEEDED') ? 'text-red-300' : 'text-white'}`}>
              <span>Total / Presupuesto</span>
              <span>{validation.total} / {validation.budget} PD</span>
            </div>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((v, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-lg bg-red-950 border border-red-800">
              <span className="text-red-400 text-sm">{v.message}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((v, i) => (
            <div key={i} className="flex gap-2 p-3 rounded-lg bg-amber-950 border border-amber-800">
              <Badge variant="amber">Review</Badge>
              <span className="text-amber-300 text-sm">{v.message}</span>
            </div>
          ))}
        </div>
      )}

      {saveError && (
        <p className="text-red-400 text-sm">{saveError}</p>
      )}

      <Button onClick={onSave} disabled={!canSave} fullWidth>
        {saving ? 'Guardando…' : 'Guardar héroe'}
      </Button>
    </div>
  )
}
