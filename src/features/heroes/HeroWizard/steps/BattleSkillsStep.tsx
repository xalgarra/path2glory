import type { LoadedRuleset } from '../../../../domain/rules/types'
import type { Campaign } from '../../../../domain/hero/types'
import { useHeroWizardStore, buildPreviewHero } from '../heroWizardStore'
import { getHeroOptionsByFactionId, getBattleSkillTablesByFactionId, getFactionById } from '../../../../data/rules/index'
import { calculateDestinyCost } from '../../../../domain/rules/destinyCost'
import { deriveDestinyBudget } from '../../../../domain/rules/rulesEngine'
import { evaluateRestrictions } from '../../../../domain/rules/restrictions'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'
import Button from '../../../../ui/primitives/Button'

interface BattleSkillsStepProps {
  ruleset: LoadedRuleset
  campaign: Campaign
}

export default function BattleSkillsStep({ ruleset, campaign }: BattleSkillsStepProps) {
  const { factionId, heroOptionId, archetypeId, originId, flawId, battleSkillIds, heroName, toggleBattleSkill, goNext } =
    useHeroWizardStore()

  const faction = factionId ? getFactionById(ruleset, factionId) : undefined
  const heroOption = factionId
    ? getHeroOptionsByFactionId(ruleset, factionId).find((o) => o.id === heroOptionId)
    : undefined

  const allTables = factionId ? getBattleSkillTablesByFactionId(ruleset, factionId) : []
  const tables =
    heroOption && heroOption.allowedBattleSkillTableIds.length > 0
      ? allTables.filter((t) => heroOption.allowedBattleSkillTableIds.includes(t.id))
      : allTables

  const canComputeCosts = !!factionId && !!heroOptionId && !!archetypeId && !!faction

  const partialHero = canComputeCosts
    ? buildPreviewHero(
        { factionId: factionId!, heroOptionId: heroOptionId!, archetypeId: archetypeId!, originId, flawId, battleSkillIds, heroName },
        faction!.factionRulesVersion,
      )
    : null

  const costBreakdown = partialHero ? calculateDestinyCost(partialHero, ruleset) : null
  const budgetResult = partialHero ? deriveDestinyBudget(partialHero, ruleset, campaign) : null
  const budget = typeof budgetResult === 'number' ? budgetResult : null
  const budgetExceeded = costBreakdown !== null && budget !== null && costBreakdown.total > budget

  return (
    <div className="space-y-6 pb-4">
      {tables.length === 0 && (
        <p className="text-slate-400 text-sm">No battle skills available for this hero type.</p>
      )}

      {tables.map((table) => (
        <div key={table.id} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{table.name}</p>
          <div className="space-y-2">
            {table.skills.map((skill) => {
              const issues = partialHero ? evaluateRestrictions(partialHero, skill, ruleset) : []
              const restrictionFailed = issues.some((i) => i.code === 'RESTRICTION_FAILED')
              const manualReview = issues.some((i) => i.code === 'MANUAL_REVIEW_PENDING') || skill.needsManualReview

              return (
                <RadioCard
                  key={skill.id}
                  selected={battleSkillIds.includes(skill.id)}
                  onClick={() => toggleBattleSkill(skill.id)}
                  multiSelect
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{skill.name}</span>
                      <Badge variant="slate">{skill.destinyCost} pts</Badge>
                      {manualReview && <Badge variant="amber">Review required</Badge>}
                      {restrictionFailed && <Badge variant="red">Restriction</Badge>}
                    </div>
                    {skill.description && (
                      <p className="text-sm text-slate-400 leading-snug">{skill.description}</p>
                    )}
                    {restrictionFailed && (
                      <div className="space-y-0.5 mt-1">
                        {issues
                          .filter((i) => i.code === 'RESTRICTION_FAILED')
                          .map((issue, idx) => (
                            <p key={idx} className="text-xs text-red-400">{issue.message}</p>
                          ))}
                      </div>
                    )}
                    {issues
                      .filter((i) => i.code === 'MANUAL_REVIEW_PENDING')
                      .map((issue, idx) => (
                        <p key={idx} className="text-xs text-amber-400">{issue.message}</p>
                      ))}
                  </div>
                </RadioCard>
              )
            })}
          </div>
        </div>
      ))}

      {costBreakdown !== null && (
        <div className={`rounded-xl p-4 border ${budgetExceeded ? 'bg-red-950 border-red-800' : 'bg-slate-900 border-slate-800'}`}>
          <p className="text-sm font-semibold mb-2 text-slate-300">Coste en PD</p>
          <div className="space-y-1 text-sm">
            {costBreakdown.archetypeOriginFlaw !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Arquetipo / Origen / Defecto</span>
                <span>
                  {costBreakdown.archetypeOriginFlaw > 0 ? '-' : '+'}{Math.abs(costBreakdown.archetypeOriginFlaw)} PD
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Mejoras</span><span>{costBreakdown.battleSkills} PD</span>
            </div>
            <div className={`flex justify-between font-semibold pt-1 border-t border-slate-700 ${budgetExceeded ? 'text-red-300' : 'text-white'}`}>
              <span>Total / Presupuesto</span>
              <span>{costBreakdown.total} / {budget ?? '?'} PD</span>
            </div>
          </div>
          {budgetExceeded && (
            <p className="text-xs text-red-400 mt-2">Presupuesto de PD superado.</p>
          )}
        </div>
      )}

      <Button onClick={goNext} fullWidth>
        Next →
      </Button>
    </div>
  )
}
