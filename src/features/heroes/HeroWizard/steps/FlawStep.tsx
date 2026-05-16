import type { LoadedRuleset } from '../../../../domain/rules/types'
import { useHeroWizardStore } from '../heroWizardStore'
import { getFlawsForFaction } from '../../../../data/rules/index'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'

interface FlawStepProps {
  ruleset: LoadedRuleset
}

export default function FlawStep({ ruleset }: FlawStepProps) {
  const { factionId, flawId, setFlaw, goNext } = useHeroWizardStore()

  const flaws = factionId ? getFlawsForFaction(ruleset, factionId) : ruleset.flaws

  function select(id: string | null) {
    setFlaw(id)
    goNext()
  }

  return (
    <div className="space-y-3">
      <RadioCard
        selected={flawId === null}
        onClick={() => select(null)}
      >
        <span className="text-slate-400 italic text-sm">Sin defecto</span>
      </RadioCard>

      {flaws.map((flaw) => (
        <RadioCard
          key={flaw.id}
          selected={flawId === flaw.id}
          onClick={() => select(flaw.id)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{flaw.name}</span>
              {flaw.destinyCost !== undefined && flaw.destinyCost !== 0 && (
                <Badge variant="slate">
                  {flaw.destinyCost > 0 ? `-${flaw.destinyCost}` : `+${-flaw.destinyCost}`} PD
                </Badge>
              )}
              {flaw.needsManualReview && <Badge variant="amber">Revisar</Badge>}
            </div>
            {flaw.description && (
              <p className="text-sm text-slate-400 leading-snug">{flaw.description}</p>
            )}
            {flaw.ruleText && (
              <p className="text-xs text-slate-500 italic leading-snug">{flaw.ruleText}</p>
            )}
          </div>
        </RadioCard>
      ))}
    </div>
  )
}
