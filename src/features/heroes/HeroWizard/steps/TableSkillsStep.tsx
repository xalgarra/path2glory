import type { LoadedRuleset, BattleSkillTable } from '../../../../domain/rules/types'
import type { Campaign } from '../../../../domain/hero/types'
import { useHeroWizardStore, buildPreviewHero } from '../heroWizardStore'
import { getFactionById, getBattleSkillTablesByFactionId } from '../../../../data/rules/index'
import { calculateDestinyCost } from '../../../../domain/rules/destinyCost'
import { deriveDestinyBudget } from '../../../../domain/rules/rulesEngine'
import { evaluateRestrictions } from '../../../../domain/rules/restrictions'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'
import Button from '../../../../ui/primitives/Button'

interface TableSkillsStepProps {
  table: BattleSkillTable
  ruleset: LoadedRuleset
  campaign: Campaign
}

export default function TableSkillsStep({ table, ruleset, campaign }: TableSkillsStepProps) {
  const {
    factionId, heroOptionId, archetypeId, originId, flawId,
    battleSkillIds, heroName, toggleBattleSkill, goNext,
  } = useHeroWizardStore()

  // Check if this table requires a skill from another table to be selected first
  const prerequisiteBlocked = (() => {
    if (!table.requiresSkillFromTableId || !factionId) return false
    const allTables = getBattleSkillTablesByFactionId(ruleset, factionId)
    const requiredTable = allTables.find((t) => t.id === table.requiresSkillFromTableId)
    if (!requiredTable) return false
    return !requiredTable.skills.some((s) => battleSkillIds.includes(s.id))
  })()

  const faction = factionId ? getFactionById(ruleset, factionId) : undefined
  const canCompute = !!factionId && !!heroOptionId && !!archetypeId && !!faction

  const previewHero = canCompute
    ? buildPreviewHero(
        { factionId: factionId!, heroOptionId: heroOptionId!, archetypeId: archetypeId!, originId, flawId, battleSkillIds, heroName },
        faction!.factionRulesVersion,
      )
    : null

  const costBreakdown = previewHero ? calculateDestinyCost(previewHero, ruleset) : null
  const budgetResult = previewHero ? deriveDestinyBudget(previewHero, ruleset, campaign) : null
  const budget = typeof budgetResult === 'number' ? budgetResult : null
  const budgetExceeded = costBreakdown !== null && budget !== null && costBreakdown.total > budget

  return (
    <div className="space-y-4 pb-4">
      {prerequisiteBlocked && (
        <div className="rounded-xl p-3 bg-amber-950 border border-amber-700 text-sm text-amber-300">
          Selecciona primero una montura de guerra en el paso anterior para desbloquear estas mejoras.
        </div>
      )}
      <div className="space-y-2">
        {table.skills.map((skill) => {
          const issues = previewHero ? evaluateRestrictions(previewHero, skill, ruleset) : []
          const restrictionFailed = issues.some((i) => i.code === 'RESTRICTION_FAILED')
          const manualReview =
            issues.some((i) => i.code === 'MANUAL_REVIEW_PENDING') || skill.needsManualReview
          const selected = battleSkillIds.includes(skill.id)

          return (
            <RadioCard
              key={skill.id}
              selected={selected}
              onClick={() => { if (!prerequisiteBlocked) toggleBattleSkill(skill.id) }}
              multiSelect
              disabled={prerequisiteBlocked}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{skill.name}</span>
                  <Badge variant="slate">{skill.destinyCost} PD</Badge>
                  {manualReview && <Badge variant="amber">Revisar</Badge>}
                  {restrictionFailed && <Badge variant="red">Restricción</Badge>}
                </div>
                {skill.description && (
                  <p className="text-sm text-slate-400 leading-snug">{skill.description}</p>
                )}
                {skill.ruleText &&
                  skill.ruleText !== 'Rule text or curated summary entered by the user.' && (
                    <p className="text-xs text-slate-500 italic leading-snug">{skill.ruleText}</p>
                  )}
                {restrictionFailed && (
                  <div className="space-y-0.5 mt-1">
                    {issues
                      .filter((i) => i.code === 'RESTRICTION_FAILED')
                      .map((issue, idx) => (
                        <p key={idx} className="text-xs text-red-400">
                          {issue.message}
                        </p>
                      ))}
                  </div>
                )}
                {issues
                  .filter((i) => i.code === 'MANUAL_REVIEW_PENDING')
                  .map((issue, idx) => (
                    <p key={idx} className="text-xs text-amber-400">
                      {issue.message}
                    </p>
                  ))}
              </div>
            </RadioCard>
          )
        })}
      </div>

      {costBreakdown !== null && (
        <div
          className={`rounded-xl p-4 border ${
            budgetExceeded ? 'bg-red-950 border-red-800' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <p className="text-sm font-semibold mb-2 text-slate-300">Coste en PD</p>
          <div className="space-y-1 text-sm">
            {costBreakdown.archetypeOriginFlaw !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Arquetipo / Origen / Defecto</span>
                <span>
                  {costBreakdown.archetypeOriginFlaw > 0 ? '-' : '+'}
                  {Math.abs(costBreakdown.archetypeOriginFlaw)} PD
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Mejoras</span>
              <span>{costBreakdown.battleSkills} PD</span>
            </div>
            <div
              className={`flex justify-between font-semibold pt-1 border-t border-slate-700 ${
                budgetExceeded ? 'text-red-300' : 'text-white'
              }`}
            >
              <span>Total / Presupuesto</span>
              <span>
                {costBreakdown.total} / {budget ?? '?'} PD
              </span>
            </div>
          </div>
          {budgetExceeded && (
            <p className="text-xs text-red-400 mt-2">Presupuesto de PD superado.</p>
          )}
        </div>
      )}

      <Button onClick={goNext} fullWidth>
        Continuar
      </Button>
    </div>
  )
}
