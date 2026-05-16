import { create } from 'zustand'
import type { Campaign, Hero } from '../../domain/hero/types'
import {
  getCampaigns,
  saveCampaign,
  deleteCampaign as deleteFromRepo,
  saveHero,
} from '../../data/persistence/userRepository'

interface CampaignState {
  campaigns: Campaign[]
  loading: boolean
  error: string | null
  init: () => Promise<void>
  createCampaign: (name: string, destinyBudgetOverride?: number) => Promise<string>
  removeCampaign: (id: string) => Promise<void>
  addHero: (campaignId: string, hero: Hero) => Promise<void>
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null })
    try {
      const campaigns = await getCampaigns()
      set({ campaigns, loading: false })
    } catch {
      set({ loading: false, error: 'Unable to load campaigns.' })
    }
  },

  createCampaign: async (name: string, destinyBudgetOverride?: number) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const campaign: Campaign = {
      id,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      heroes: [],
      ...(destinyBudgetOverride !== undefined ? { destinyBudgetOverride } : {}),
    }
    await saveCampaign(campaign)
    set({ campaigns: [...get().campaigns, campaign] })
    return id
  },

  removeCampaign: async (id: string) => {
    await deleteFromRepo(id)
    set({ campaigns: get().campaigns.filter((c) => c.id !== id) })
  },

  addHero: async (campaignId: string, hero: Hero) => {
    await saveHero(campaignId, hero)
    const campaigns = get().campaigns.map((c) =>
      c.id === campaignId ? { ...c, heroes: [...c.heroes, hero] } : c,
    )
    set({ campaigns })
  },
}))
