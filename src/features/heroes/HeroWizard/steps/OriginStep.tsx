import type { LoadedRuleset } from '../../../../domain/rules/types'
import { useHeroWizardStore } from '../heroWizardStore'
import { getOriginsForFaction } from '../../../../data/rules/index'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'

interface OriginStepProps {
  ruleset: LoadedRuleset
}

export default function OriginStep({ ruleset }: OriginStepProps) {
  const { factionId, originId, setOrigin, goNext } = useHeroWizardStore()

  const origins = factionId ? getOriginsForFaction(ruleset, factionId) : ruleset.origins

  function select(id: string | null) {
    setOrigin(id)
    goNext()
  }

  return (
    <div className="space-y-3">
      <RadioCard
        selected={originId === null}
        onClick={() => select(null)}
      >
        <span className="text-slate-400 italic text-sm">Sin origen</span>
      </RadioCard>

      {origins.map((origin) => (
        <RadioCard
          key={origin.id}
          selected={originId === origin.id}
          onClick={() => select(origin.id)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{origin.name}</span>
              {origin.destinyCost !== undefined && origin.destinyCost !== 0 && (
                <Badge variant="slate">
                  {origin.destinyCost > 0 ? `-${origin.destinyCost}` : `+${-origin.destinyCost}`} PD
                </Badge>
              )}
              {origin.needsManualReview && <Badge variant="amber">Revisar</Badge>}
            </div>
            {origin.description && (
              <p className="text-sm text-slate-400 leading-snug">{origin.description}</p>
            )}
            {origin.ruleText && (
              <p className="text-xs text-slate-500 italic leading-snug">{origin.ruleText}</p>
            )}
          </div>
        </RadioCard>
      ))}
    </div>
  )
}
