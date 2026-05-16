import { create } from 'zustand'
import type { Hero } from '../../../domain/hero/types'

interface HeroWizardState {
  campaignId: string
  step: number
  factionId: string | null
  heroOptionId: string | null
  archetypeId: string | null
  originId: string | null
  flawId: string | null
  battleSkillIds: string[]
  heroName: string

  reset: (campaignId: string) => void
  setFaction: (id: string) => void
  setHeroOption: (id: string) => void
  setArchetype: (id: string) => void
  setOrigin: (id: string | null) => void
  setFlaw: (id: string | null) => void
  toggleBattleSkill: (id: string) => void
  setHeroName: (name: string) => void
  goNext: () => void
  goBack: () => void
}

export const useHeroWizardStore = create<HeroWizardState>((set, get) => ({
  campaignId: '',
  step: 0,
  factionId: null,
  heroOptionId: null,
  archetypeId: null,
  originId: null,
  flawId: null,
  battleSkillIds: [],
  heroName: '',

  reset: (campaignId) =>
    set({
      campaignId,
      step: 0,
      factionId: null,
      heroOptionId: null,
      archetypeId: null,
      originId: null,
      flawId: null,
      battleSkillIds: [],
      heroName: '',
    }),

  setFaction: (id) =>
    set({
      factionId: id,
      heroOptionId: null,
      archetypeId: null,
      originId: null,
      flawId: null,
      battleSkillIds: [],
    }),

  setHeroOption: (id) =>
    set({ heroOptionId: id, archetypeId: null, battleSkillIds: [] }),

  setArchetype: (id) => set({ archetypeId: id }),
  setOrigin: (id) => set({ originId: id }),
  setFlaw: (id) => set({ flawId: id }),

  toggleBattleSkill: (id) => {
    const { battleSkillIds } = get()
    if (battleSkillIds.includes(id)) {
      set({ battleSkillIds: battleSkillIds.filter((s) => s !== id) })
    } else {
      set({ battleSkillIds: [...battleSkillIds, id] })
    }
  },

  setHeroName: (name) => set({ heroName: name }),
  goNext: () => set({ step: get().step + 1 }),
  goBack: () => set({ step: Math.max(get().step - 1, 0) }),
}))

// ── Helper: build a preview Hero for domain validation ─────────────────────────

interface CompleteSelections {
  factionId: string
  heroOptionId: string
  archetypeId: string
  originId: string | null
  flawId: string | null
  battleSkillIds: string[]
  heroName: string
}

export function buildPreviewHero(
  selections: CompleteSelections,
  factionRulesVersion: string,
): Hero {
  return {
    id: 'wizard-preview',
    name: selections.heroName,
    factionId: selections.factionId,
    factionRulesVersionAtCreation: factionRulesVersion,
    heroOptionId: selections.heroOptionId,
    archetypeId: selections.archetypeId,
    originId: selections.originId,
    flawId: selections.flawId,
    level: 1,
    battleSkillIds: selections.battleSkillIds,
    createdAt: '',
    updatedAt: '',
  }
}
