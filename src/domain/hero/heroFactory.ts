import type { Hero, Uuid } from './types'

export interface CreateHeroParams {
  id: Uuid
  name: string
  factionId: string
  factionRulesVersionAtCreation: string
  heroOptionId: string
  archetypeId: string
  originId: string | null
  flawId: string | null
  level?: number
  battleSkillIds?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export function createHero(params: CreateHeroParams): Hero {
  return {
    level: 1,
    battleSkillIds: [],
    ...params,
  }
}
