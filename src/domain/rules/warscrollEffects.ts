import type { BattleSkill } from './types'

export interface WeaponState {
  id: string
  name: string
  atk: number
  hit: string
  wnd: string
  rnd: number
  dmg: number
  melee: boolean
  rangeInches?: number
  tags: string[]
}

export interface WarscrollState {
  mov: number
  health: number
  save: string
  control: number
  ward?: string
  weapons: WeaponState[]
  keywords: string[]
  abilities: string[]
}

export function applySkillEffects(base: WarscrollState, skills: BattleSkill[]): WarscrollState {
  const state: WarscrollState = {
    ...base,
    weapons: base.weapons.map((w) => ({ ...w, tags: [...w.tags] })),
    keywords: [...base.keywords],
    abilities: [...base.abilities],
  }

  for (const skill of skills) {
    if (!skill.effects) continue
    for (const fx of skill.effects) {
      switch (fx.type) {
        case 'setMov':        state.mov     = fx.value; break
        case 'addMov':        state.mov    += fx.value; break
        case 'setHealth':     state.health  = fx.value; break
        case 'addHealth':     state.health += fx.value; break
        case 'setSave':       state.save    = fx.value; break
        case 'setControl':    state.control = fx.value; break
        case 'addControl':    state.control += fx.value; break
        case 'addWard':       state.ward    = fx.value; break

        case 'addWeapon':
          state.weapons.push({
            id: fx.id, name: fx.name,
            atk: fx.atk, hit: fx.hit, wnd: fx.wnd, rnd: fx.rnd, dmg: fx.dmg,
            melee: fx.melee ?? true,
            rangeInches: fx.rangeInches,
            tags: fx.tags ?? [],
          })
          break

        case 'setWeaponAtk': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.atk  = fx.value; break }
        case 'addWeaponAtk': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.atk += fx.value; break }
        case 'setWeaponHit': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.hit  = fx.value; break }
        case 'setWeaponWnd': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.wnd  = fx.value; break }
        case 'setWeaponRnd': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.rnd  = fx.value; break }
        case 'addWeaponRnd': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.rnd += fx.value; break }
        case 'setWeaponDmg': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.dmg  = fx.value; break }
        case 'addWeaponDmg': { const w = state.weapons.find((x) => x.id === fx.weaponId); if (w) w.dmg += fx.value; break }

        case 'addKeyword':
          if (!state.keywords.includes(fx.value)) state.keywords.push(fx.value)
          break
        case 'removeKeyword':
          state.keywords = state.keywords.filter((k) => k !== fx.value)
          break
        case 'addAbility':
          if (!state.abilities.includes(fx.name)) state.abilities.push(fx.name)
          break
      }
    }
  }

  return state
}
