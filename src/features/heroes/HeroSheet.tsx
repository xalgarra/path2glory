import {
  loadRuleset,
  getFactionById,
  getHeroOptionsByFactionId,
} from '../../data/rules/index'
import {
  findArchetypeForFaction,
  findOriginForFaction,
  findFlawForFaction,
} from '../../domain/rules/destinyCost'
import { validateHero } from '../../domain/hero/heroValidator'
import { useCampaignStore } from '../campaigns/campaignStore'
import { navigate } from '../../app/router'
import type { GrandAlliance, RuleEntry } from '../../domain/rules/types'
import { parseHeroDescription, downloadWarscrollPng } from './warscrollCanvas'
import { applySkillEffects } from '../../domain/rules/warscrollEffects'
import PageContainer from '../../ui/layout/PageContainer'
import SectionHeader from '../../ui/layout/SectionHeader'
import Badge from '../../ui/primitives/Badge'

const ruleset = loadRuleset()

const allianceVariant: Record<GrandAlliance, 'sky' | 'red' | 'slate' | 'green'> = {
  order: 'sky',
  chaos: 'red',
  death: 'slate',
  destruction: 'green',
}

interface HeroSheetProps {
  campaignId: string
  heroId: string
}

interface RuleEntrySectionProps {
  title: string
  entry: Pick<RuleEntry, 'name' | 'description' | 'ruleText' | 'tags' | 'needsManualReview'>
}

function RuleEntrySection({ title, entry }: RuleEntrySectionProps) {
  return (
    <div>
      <SectionHeader title={title} />
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold">{entry.name}</span>
          {entry.needsManualReview && <Badge variant="amber">Review required</Badge>}
        </div>
        {entry.description && (
          <p className="text-sm text-slate-400 leading-snug">{entry.description}</p>
        )}
        {entry.ruleText && (
          <p className="text-xs text-slate-500 italic leading-snug">{entry.ruleText}</p>
        )}
        {entry.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap pt-1">
            {entry.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HeroSheet({ campaignId, heroId }: HeroSheetProps) {
  const { campaigns, loading } = useCampaignStore()
  const campaign = campaigns.find((c) => c.id === campaignId)
  const hero = campaign?.heroes.find((h) => h.id === heroId)

  if (loading && !campaign) {
    return (
      <PageContainer>
        <div className="pt-16">
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </PageContainer>
    )
  }

  if (!campaign || !hero) {
    return (
      <PageContainer>
        <div className="pt-16 text-center space-y-3">
          <p className="text-slate-300 font-medium">Hero not found</p>
          <button
            onClick={() => navigate({ name: 'campaign-detail', campaignId })}
            className="text-sky-400 hover:text-sky-300 text-sm min-h-[44px]"
          >
            ‹ Back to campaign
          </button>
        </div>
      </PageContainer>
    )
  }

  const faction = getFactionById(ruleset, hero.factionId)
  const heroOption = getHeroOptionsByFactionId(ruleset, hero.factionId).find(
    (o) => o.id === hero.heroOptionId,
  )
  const archetype = findArchetypeForFaction(ruleset, hero.factionId, hero.archetypeId)
  const origin = findOriginForFaction(ruleset, hero.factionId, hero.originId)
  const flaw = findFlawForFaction(ruleset, hero.factionId, hero.flawId)

  const allSkills = (ruleset.battleSkillTablesByFactionId[hero.factionId] ?? []).flatMap(
    (t) => t.skills,
  )
  const selectedSkills = hero.battleSkillIds
    .map((id) => allSkills.find((s) => s.id === id))
    .filter(Boolean)

  const hasVersionDrift =
    faction && hero.factionRulesVersionAtCreation !== faction.factionRulesVersion

  const validation = validateHero(hero, ruleset, campaign)
  const warnings = validation.violations.filter((v) => v.code === 'MANUAL_REVIEW_PENDING')
  const errors = validation.violations.filter((v) => v.code !== 'MANUAL_REVIEW_PENDING')
  const budgetExceeded = errors.some((e) => e.code === 'DESTINY_BUDGET_EXCEEDED')

  function handleWarscrollDownload() {
    if (!heroOption || !faction) return
    const parsed = parseHeroDescription(heroOption.description)

    const baseKeywords = [
      ...heroOption.tags.map((t) => t.charAt(0).toUpperCase() + t.slice(1)),
      ...(archetype ? [archetype.name] : []),
      faction.name,
    ]
    const baseState = {
      mov:      parsed.mov,
      health:   parsed.health,
      save:     parsed.save,
      control:  parsed.control,
      weapons:  [parsed.primaryWeapon],
      keywords: baseKeywords,
      abilities: [] as string[],
    }

    const finalState = applySkillEffects(baseState, selectedSkills.filter(Boolean) as NonNullable<typeof selectedSkills[0]>[])

    const heroName = hero?.name || heroOption.name
    downloadWarscrollPng(
      { heroName, heroTypeName: heroOption.name, factionName: faction.name },
      finalState,
    )
  }

  return (
    <PageContainer>
      <div className="pt-6 space-y-6">
        <div className="flex items-center justify-between print-hidden">
          <button
            onClick={() => navigate({ name: 'campaign-detail', campaignId })}
            className="text-sky-400 hover:text-sky-300 text-sm min-h-[44px]"
          >
            ‹ {campaign.name}
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleWarscrollDownload}
              className="text-sky-400 hover:text-sky-300 text-sm min-h-[44px]"
            >
              Warscroll PNG
            </button>
            <button
              onClick={() => window.print()}
              className="text-slate-400 hover:text-slate-300 text-sm min-h-[44px] pl-2"
            >
              Imprimir
            </button>
          </div>
        </div>

        {hasVersionDrift && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950 border border-amber-800">
            <Badge variant="amber">Rules updated</Badge>
            <span className="text-amber-300 text-sm">
              Rules changed since this hero was created — review for accuracy.
            </span>
          </div>
        )}

        {/* ── Hero identity ─────────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{hero.name}</h1>
            <Badge variant="slate">Level {hero.level}</Badge>
          </div>
          {faction && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-sm">{faction.name}</span>
              <Badge variant={allianceVariant[faction.grandAlliance]}>
                {faction.grandAlliance}
              </Badge>
            </div>
          )}
        </div>

        {/* ── Destiny cost breakdown ────────────────────────────────────── */}
        <div
          className={`rounded-xl p-4 border ${
            budgetExceeded ? 'bg-red-950 border-red-800' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <p className="text-sm font-semibold mb-3 text-slate-300">Coste en PD</p>
          <div className="space-y-1.5 text-sm">
            {validation.base !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Base</span>
                <span>{validation.base} PD</span>
              </div>
            )}
            {validation.archetypeOriginFlaw !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Arquetipo / Origen / Defecto</span>
                <span>
                  {validation.archetypeOriginFlaw > 0 ? '-' : '+'}{Math.abs(validation.archetypeOriginFlaw)} PD
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Mejoras</span>
              <span>{validation.battleSkills} PD</span>
            </div>
            <div
              className={`flex justify-between font-semibold pt-1.5 border-t border-slate-700 ${
                budgetExceeded ? 'text-red-300' : 'text-white'
              }`}
            >
              <span>Total / Presupuesto</span>
              <span>
                {validation.total} / {validation.budget} PD
              </span>
            </div>
          </div>
        </div>

        {/* ── Validation issues ─────────────────────────────────────────── */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((v, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm"
              >
                {v.message}
              </div>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="space-y-2">
            {warnings.map((v, i) => (
              <div
                key={i}
                className="flex gap-2 items-start p-3 rounded-lg bg-amber-950 border border-amber-800"
              >
                <Badge variant="amber">Review</Badge>
                <span className="text-amber-300 text-sm">{v.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Rule entries ──────────────────────────────────────────────── */}
        {heroOption && <RuleEntrySection title="Rango" entry={heroOption} />}
        {archetype && <RuleEntrySection title="Arquetipo" entry={archetype} />}
        {origin && <RuleEntrySection title="Origen" entry={origin} />}
        {flaw && <RuleEntrySection title="Defecto" entry={flaw} />}

        {/* ── Battle skills ─────────────────────────────────────────────── */}
        {selectedSkills.length > 0 && (
          <div>
            <SectionHeader title="Mejoras" />
            <div className="space-y-3">
              {selectedSkills.map((skill) =>
                skill ? (
                  <div
                    key={skill.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{skill.name}</span>
                      <Badge variant="slate">{skill.destinyCost} pts</Badge>
                      {skill.needsManualReview && (
                        <Badge variant="amber">Review required</Badge>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-sm text-slate-400 leading-snug">{skill.description}</p>
                    )}
                    {skill.ruleText && (
                      <p className="text-xs text-slate-500 italic leading-snug">{skill.ruleText}</p>
                    )}
                    {skill.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap pt-1">
                        {skill.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </div>
        )}

        {/* ── Notes ────────────────────────────────────────────────────── */}
        {hero.notes && (
          <div>
            <SectionHeader title="Notas" />
            <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {hero.notes}
            </p>
          </div>
        )}

        <div className="pb-4" />
      </div>
    </PageContainer>
  )
}
