import type { LoadedRuleset } from '../../../../domain/rules/types'
import { useHeroWizardStore } from '../heroWizardStore'
import { getHeroOptionsByFactionId, getArchetypesForFaction } from '../../../../data/rules/index'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'

interface ArchetypeStepProps {
  ruleset: LoadedRuleset
}

export default function ArchetypeStep({ ruleset }: ArchetypeStepProps) {
  const { factionId, heroOptionId, archetypeId, setArchetype, goNext } = useHeroWizardStore()

  const heroOption = factionId
    ? getHeroOptionsByFactionId(ruleset, factionId).find((o) => o.id === heroOptionId)
    : undefined

  const factionArchetypes = factionId ? getArchetypesForFaction(ruleset, factionId) : ruleset.archetypes
  const allowed = heroOption?.allowedArchetypeIds ?? []
  const archetypes =
    allowed.length > 0
      ? factionArchetypes.filter((a) => allowed.includes(a.id))
      : factionArchetypes

  function select(id: string) {
    setArchetype(id)
    goNext()
  }

  return (
    <div className="space-y-3">
      {archetypes.map((arch) => (
        <RadioCard
          key={arch.id}
          selected={archetypeId === arch.id}
          onClick={() => select(arch.id)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{arch.name}</span>
              {arch.destinyCost !== undefined && arch.destinyCost !== 0 && (
                <Badge variant="slate">
                  {arch.destinyCost > 0 ? `-${arch.destinyCost}` : `+${-arch.destinyCost}`} PD
                </Badge>
              )}
              {arch.needsManualReview && <Badge variant="amber">Review required</Badge>}
            </div>
            {arch.description && (
              <p className="text-sm text-slate-400 leading-snug">{arch.description}</p>
            )}
            {arch.ruleText && (
              <p className="text-xs text-slate-500 italic leading-snug">{arch.ruleText}</p>
            )}
          </div>
        </RadioCard>
      ))}
    </div>
  )
}
