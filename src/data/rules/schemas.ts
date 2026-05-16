import { z } from 'zod'

// ── Shared primitives ──────────────────────────────────────────────────────────

const restrictionSchema = z.union([
  z.object({ type: z.literal('minLevel'), value: z.number().int().nonnegative() }),
  z.object({ type: z.literal('requiresSkillIds'), ids: z.array(z.string()) }),
  z.object({ type: z.literal('excludesSkillIds'), ids: z.array(z.string()) }),
  z.object({ type: z.literal('requiresArchetypeId'), id: z.string() }),
  z.object({ type: z.literal('requiresHeroOptionIds'), ids: z.array(z.string()) }),
  z.object({ type: z.literal('maxPerHero'), value: z.number().int().positive() }),
  z.object({ type: z.literal('custom'), description: z.string() }),
])

const ruleEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ruleText: z.string(),
  tags: z.array(z.string()),
  restrictions: z.array(restrictionSchema),
  needsManualReview: z.boolean(),
})

// ── Versioning ────────────────────────────────────────────────────────────────

export const rulesMetaSchema = z.object({
  appDataFormatVersion: z.number().int(),
  generatedAt: z.string(),
  notes: z.string().optional(),
})

export const factionMetaSchema = z.object({
  factionId: z.string(),
  factionRulesVersion: z.string(),
  factionRulesUpdatedAt: z.string(),
  factionRulesNotes: z.string().optional(),
})

// ── Faction ───────────────────────────────────────────────────────────────────

export const factionJsonSchema = z.object({
  id: z.string(),
  name: z.string(),
  grandAlliance: z.enum(['order', 'chaos', 'death', 'destruction']),
  lore: z.string().optional(),
})

// ── Hero options ──────────────────────────────────────────────────────────────

export const heroOptionSchema = ruleEntrySchema.extend({
  baseDestinyCost: z.number().int().nonnegative(),
  allowedArchetypeIds: z.array(z.string()),
  allowedBattleSkillTableIds: z.array(z.string()),
  destinyBudgetByLevel: z
    .record(z.string(), z.number().int().nonnegative())
    .transform((obj) => {
      const result: Record<number, number> = {}
      for (const [k, v] of Object.entries(obj)) {
        result[Number(k)] = v
      }
      return result
    })
    .optional(),
})

export const heroOptionsSchema = z.array(heroOptionSchema)

// ── Battle skills ─────────────────────────────────────────────────────────────

const skillEffectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('setMov'),        value: z.number() }),
  z.object({ type: z.literal('addMov'),        value: z.number() }),
  z.object({ type: z.literal('setHealth'),     value: z.number() }),
  z.object({ type: z.literal('addHealth'),     value: z.number() }),
  z.object({ type: z.literal('setSave'),       value: z.string() }),
  z.object({ type: z.literal('setControl'),    value: z.number() }),
  z.object({ type: z.literal('addControl'),    value: z.number() }),
  z.object({ type: z.literal('addWard'),       value: z.string() }),
  z.object({ type: z.literal('setWeaponAtk'),  weaponId: z.string(), value: z.number() }),
  z.object({ type: z.literal('addWeaponAtk'),  weaponId: z.string(), value: z.number() }),
  z.object({ type: z.literal('setWeaponHit'),  weaponId: z.string(), value: z.string() }),
  z.object({ type: z.literal('setWeaponWnd'),  weaponId: z.string(), value: z.string() }),
  z.object({ type: z.literal('setWeaponRnd'),  weaponId: z.string(), value: z.number() }),
  z.object({ type: z.literal('addWeaponRnd'),  weaponId: z.string(), value: z.number() }),
  z.object({ type: z.literal('setWeaponDmg'),  weaponId: z.string(), value: z.number() }),
  z.object({ type: z.literal('addWeaponDmg'),  weaponId: z.string(), value: z.number() }),
  z.object({ type: z.literal('addWeapon'),     id: z.string(), name: z.string(), atk: z.number(), hit: z.string(), wnd: z.string(), rnd: z.number(), dmg: z.number(), melee: z.boolean().optional(), rangeInches: z.number().optional(), tags: z.array(z.string()).optional() }),
  z.object({ type: z.literal('addKeyword'),    value: z.string() }),
  z.object({ type: z.literal('removeKeyword'), value: z.string() }),
  z.object({ type: z.literal('addAbility'),    name: z.string() }),
])

export const battleSkillSchema = ruleEntrySchema.extend({
  destinyCost: z.number().int(),
  effects: z.array(skillEffectSchema).optional(),
})

export const battleSkillTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  skills: z.array(battleSkillSchema),
  requiresSkillFromTableId: z.string().optional(),
})

const battleSkillFileSchema = z.object({
  tables: z.array(battleSkillTableSchema),
})

// ── Rule arrays with optional destiny cost ────────────────────────────────────

const ruleEntryWithCostSchema = ruleEntrySchema.extend({
  destinyCost: z.number().int().optional(),
})

export const archetypesSchema = z.array(ruleEntryWithCostSchema)
export const originsSchema = z.array(ruleEntryWithCostSchema)
export const flawsSchema = z.array(ruleEntryWithCostSchema)

// ── Parse helpers ─────────────────────────────────────────────────────────────

export function parseRulesMeta(data: unknown) {
  return rulesMetaSchema.parse(data)
}

export function parseFactionMeta(data: unknown) {
  return factionMetaSchema.parse(data)
}

export function parseFactionJson(data: unknown) {
  return factionJsonSchema.parse(data)
}

export function parseHeroOptions(data: unknown) {
  return heroOptionsSchema.parse(data)
}

export function parseBattleSkillTables(data: unknown) {
  return battleSkillFileSchema.parse(data).tables
}

export function parseArchetypes(data: unknown) {
  return archetypesSchema.parse(data)
}

export function parseOrigins(data: unknown) {
  return originsSchema.parse(data)
}

export function parseFlaws(data: unknown) {
  return flawsSchema.parse(data)
}
