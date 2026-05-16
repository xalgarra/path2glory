import type { LoadedRuleset } from '../../../../domain/rules/types'
import { useHeroWizardStore } from '../heroWizardStore'
import RadioCard from '../../../../ui/primitives/RadioCard'
import Badge from '../../../../ui/primitives/Badge'

interface FactionStepProps {
  ruleset: LoadedRuleset
}

const allianceVariant = {
  order: 'sky',
  chaos: 'red',
  death: 'slate',
  destruction: 'green',
} as const

export default function FactionStep({ ruleset }: FactionStepProps) {
  const { factionId, setFaction, goNext } = useHeroWizardStore()

  function select(id: string) {
    setFaction(id)
    goNext()
  }

  return (
    <div className="space-y-3">
      {ruleset.factions.map((faction) => (
        <RadioCard
          key={faction.factionId}
          selected={factionId === faction.factionId}
          onClick={() => select(faction.factionId)}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{faction.name}</span>
              <Badge variant={allianceVariant[faction.grandAlliance]}>
                {faction.grandAlliance}
              </Badge>
            </div>
            {faction.lore && (
              <p className="text-sm text-slate-400 leading-snug">{faction.lore}</p>
            )}
          </div>
        </RadioCard>
      ))}
    </div>
  )
}
