import type { LoadedRuleset } from '../../../../domain/rules/types'
import { useHeroWizardStore } from '../heroWizardStore'
import { getHeroOptionsByFactionId } from '../../../../data/rules/index'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'

interface HeroTypeStepProps {
  ruleset: LoadedRuleset
}

export default function HeroTypeStep({ ruleset }: HeroTypeStepProps) {
  const { factionId, heroOptionId, setHeroOption, goNext } = useHeroWizardStore()

  const options = factionId ? getHeroOptionsByFactionId(ruleset, factionId) : []

  function select(id: string) {
    setHeroOption(id)
    goNext()
  }

  if (options.length === 0) {
    return <p className="text-slate-400 text-sm">No hero types available for this faction.</p>
  }

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <RadioCard
          key={option.id}
          selected={heroOptionId === option.id}
          onClick={() => select(option.id)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{option.name}</span>
              {option.destinyBudgetByLevel?.[1] !== undefined && (
                <Badge variant="slate">{option.destinyBudgetByLevel[1]} PD</Badge>
              )}
              {option.needsManualReview && <Badge variant="amber">Revisar</Badge>}
            </div>
            {option.description && (
              <p className="text-sm text-slate-400 leading-snug">{option.description}</p>
            )}
            {option.ruleText && option.ruleText !== 'Rule text or curated summary entered by the user.' && (
              <p className="text-xs text-slate-500 italic leading-snug">{option.ruleText}</p>
            )}
          </div>
        </RadioCard>
      ))}
    </div>
  )
}
