import type { WarscrollState } from '../../domain/rules/warscrollEffects'

export type { WarscrollState }

// ── Helpers ───────────────────────────────────────────────────────────────────

const C = {
  bg:            '#0c1a10',
  headerBg:      '#1a6b3a',
  tableBg:       '#0f2215',
  tableHeaderBg: '#1a5a32',
  border:        '#c8a44e',
  text:          '#ffffff',
  muted:         '#a0c0a0',
  cardBg:        '#0f2215',
  kwBg:          '#080f09',
  quadDark:      '#060e08',
  quadGreen:     '#1a5a30',
  abilityBg:     '#0a1a0c',
}

const W   = 800
const PAD = 16

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}


function hline(ctx: CanvasRenderingContext2D, y: number) {
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.stroke()
}

// ── Compass ───────────────────────────────────────────────────────────────────

function drawCompass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  mov: number, health: number, save: string, control: number,
) {
  // Outer ring
  ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.stroke()

  // Base fill
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = C.bg; ctx.fill()

  // Quadrants: TL=dark(MOVE), TR=green(SAVE), BL=green(HEALTH), BR=dark(CONTROL)
  const quads = [
    { start: Math.PI,       end: 3*Math.PI/2, color: C.quadDark  },
    { start: -Math.PI/2,    end: 0,           color: C.quadGreen },
    { start: Math.PI/2,     end: Math.PI,     color: C.quadGreen },
    { start: 0,             end: Math.PI/2,   color: C.quadDark  },
  ]
  for (const q of quads) {
    ctx.beginPath(); ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r - 3, q.start, q.end); ctx.closePath()
    ctx.fillStyle = q.color; ctx.fill()
  }

  // Gold cross
  ctx.beginPath()
  ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy)
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r)
  ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.stroke()

  // Border ring
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.stroke()

  // Center dot
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = C.border; ctx.fill()

  // Stat values at cardinal positions
  const v = r * 0.48
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `bold ${Math.round(r * 0.32)}px serif`; ctx.fillStyle = C.text
  ctx.fillText(`${mov}"`, cx,     cy - v)  // MOVE   (top)
  ctx.fillText(String(health),     cx - v, cy)      // HEALTH (left)
  ctx.fillText(save,               cx + v, cy)      // SAVE   (right)
  ctx.fillText(String(control),    cx,     cy + v)  // CONTROL(bottom)

  // Labels
  const lsz = Math.max(8, Math.round(r * 0.17))
  ctx.font = `${lsz}px sans-serif`; ctx.fillStyle = C.border
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText('MOVE', cx, cy - r - 6)
  ctx.textBaseline = 'top'
  ctx.fillText('CONTROL', cx, cy + r + 6)
  ctx.save(); ctx.translate(cx - r - 8, cy); ctx.rotate(-Math.PI/2)
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('HEALTH', 0, 0); ctx.restore()
  ctx.save(); ctx.translate(cx + r + 8, cy); ctx.rotate(Math.PI/2)
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('SAVE', 0, 0); ctx.restore()
}

// ── Weapons table ─────────────────────────────────────────────────────────────

function drawWeaponsTable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  weapons: WarscrollState['weapons'],
): number {
  const COL = [w * 0.40, w * 0.12, w * 0.12, w * 0.12, w * 0.12, w * 0.12]
  const ROW_H = 24
  const hdrs  = ['ARMAS', 'Atq', 'Imp', 'Her', 'Per', 'Dañ']

  // Header
  ctx.fillStyle = C.tableHeaderBg
  ctx.fillRect(x, y, w, ROW_H)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, ROW_H)

  ctx.fillStyle = C.text; ctx.font = 'bold 10px sans-serif'; ctx.textBaseline = 'middle'
  let cx = x
  for (let i = 0; i < hdrs.length; i++) {
    ctx.textAlign = i === 0 ? 'left' : 'center'
    ctx.fillText(hdrs[i], i === 0 ? cx + 6 : cx + COL[i] / 2, y + ROW_H / 2)
    cx += COL[i]
    if (i < hdrs.length - 1) {
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + ROW_H)
      ctx.strokeStyle = C.border; ctx.lineWidth = 0.5; ctx.stroke()
    }
  }

  let curY = y + ROW_H
  const melee   = weapons.filter((wp) => wp.melee)
  const ranged  = weapons.filter((wp) => !wp.melee)
  const groups: Array<{ label: string; list: typeof weapons }> = []
  if (melee.length)  groups.push({ label: 'Cuerpo a cuerpo', list: melee })
  if (ranged.length) groups.push({ label: 'A distancia',     list: ranged })

  for (const group of groups) {
    if (groups.length > 1) {
      // Section label
      ctx.fillStyle = '#1a3020'
      ctx.fillRect(x, curY, w, 16)
      ctx.strokeStyle = C.border; ctx.lineWidth = 0.5
      ctx.strokeRect(x, curY, w, 16)
      ctx.fillStyle = C.border; ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
      ctx.fillText(group.label.toUpperCase(), x + 6, curY + 8)
      curY += 16
    }

    for (const wp of group.list) {
      ctx.fillStyle = C.tableBg
      ctx.fillRect(x, curY, w, ROW_H)
      ctx.strokeStyle = C.border; ctx.lineWidth = 0.5
      ctx.strokeRect(x, curY, w, ROW_H)

      const rndStr = wp.rnd === 0 ? '—' : String(wp.rnd)
      const vals = [wp.name, String(wp.atk), wp.hit, wp.wnd, rndStr, String(wp.dmg)]
      cx = x
      ctx.fillStyle = C.text; ctx.font = '11px serif'; ctx.textBaseline = 'middle'
      for (let i = 0; i < vals.length; i++) {
        ctx.textAlign = i === 0 ? 'left' : 'center'
        ctx.fillText(vals[i], i === 0 ? cx + 6 : cx + COL[i] / 2, curY + ROW_H / 2)
        cx += COL[i]
      }

      // Tags row if any
      if (wp.tags.length > 0) {
        curY += ROW_H
        ctx.fillStyle = '#0a1810'
        ctx.fillRect(x, curY, w, 14)
        ctx.strokeStyle = C.border; ctx.lineWidth = 0.3
        ctx.strokeRect(x, curY, w, 14)
        ctx.fillStyle = C.muted; ctx.font = 'italic 9px sans-serif'
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(wp.tags.join(', '), x + 6, curY + 7)
      }

      curY += ROW_H
    }
  }
  return curY
}

// ── Abilities ─────────────────────────────────────────────────────────────────

function drawAbilities(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  abilities: string[],
): number {
  if (abilities.length === 0) return y
  const PILL_H = 22
  const PILL_GAP = 6
  const PILL_PAD = 10

  let curX = x
  let curY = y
  for (const name of abilities) {
    ctx.font = 'bold 10px sans-serif'
    const tw = ctx.measureText(name).width
    const pw = tw + PILL_PAD * 2
    if (curX + pw > x + w) { curX = x; curY += PILL_H + PILL_GAP }

    roundRect(ctx, curX, curY, pw, PILL_H, 4)
    ctx.fillStyle = C.abilityBg; ctx.fill()
    ctx.strokeStyle = C.border; ctx.lineWidth = 0.8; ctx.stroke()
    ctx.fillStyle = C.muted; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText(name, curX + PILL_PAD, curY + PILL_H / 2)
    curX += pw + PILL_GAP
  }
  return curY + PILL_H + PILL_GAP
}

// ── Main generator ────────────────────────────────────────────────────────────

export interface WarscrollMeta {
  heroName: string
  heroTypeName: string
  factionName: string
}

export function generateWarscrollCanvas(meta: WarscrollMeta, state: WarscrollState): HTMLCanvasElement {
  // First pass on a temporary canvas to measure heights
  const tmp = document.createElement('canvas')
  tmp.width = W; tmp.height = 2000
  const tctx = tmp.getContext('2d')!

  const COMPASS_R  = 52
  const HEADER_H   = 100
  const COMPASS_D  = COMPASS_R * 2 + 30
  const tblX       = PAD + 20 + COMPASS_R * 2 + 40
  const tblW       = W - tblX - PAD

  const weaponTableBottom = drawWeaponsTable(tctx, tblX, 0, tblW, state.weapons)
  const statsRowH = Math.max(COMPASS_D, weaponTableBottom) + 12

  // abilities height (measure)
  tctx.font = 'bold 10px sans-serif'
  const abilitiesH = state.abilities.length > 0
    ? (() => {
        const PILL_H = 22; const PILL_GAP = 6; const PILL_PAD = 10
        let cx = PAD + 4; let rows = 1
        for (const name of state.abilities) {
          const pw = tctx.measureText(name).width + PILL_PAD * 2
          if (cx + pw > W - PAD) { cx = PAD + 4; rows++ }
          cx += pw + PILL_GAP
        }
        return rows * (PILL_H + PILL_GAP) + 20
      })()
    : 0

  const KW_H     = 44
  const WARD_H   = state.ward ? 30 : 0
  const totalH   = PAD + HEADER_H + 2 + statsRowH + 2 + abilitiesH + WARD_H + 2 + KW_H + PAD

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  // ── Background + border ───────────────────────────────────────────────────
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, totalH)
  ctx.strokeStyle = C.border; ctx.lineWidth = 4; ctx.strokeRect(6, 6, W - 12, totalH - 12)
  ctx.lineWidth = 1; ctx.strokeRect(11, 11, W - 22, totalH - 22)

  // ── Header ────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.headerBg; ctx.fillRect(PAD, PAD, W - PAD * 2, HEADER_H)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1.5; ctx.strokeRect(PAD, PAD, W - PAD * 2, HEADER_H)

  ctx.fillStyle = C.border; ctx.font = '11px serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  ctx.fillText(`• ${meta.factionName.toUpperCase()} WARSCROLL •`, W / 2, PAD + 8)

  ctx.fillStyle = C.text; ctx.font = 'bold 30px serif'
  ctx.fillText(meta.heroName.toUpperCase(), W / 2, PAD + 26)

  ctx.fillStyle = C.muted; ctx.font = 'italic 15px serif'
  ctx.fillText(meta.heroTypeName, W / 2, PAD + 68)

  // ── Divider ───────────────────────────────────────────────────────────────
  let curY = PAD + HEADER_H
  hline(ctx, curY); curY += 2

  // ── Compass ───────────────────────────────────────────────────────────────
  const compassCX = PAD + 20 + COMPASS_R + 14
  const compassCY = curY + statsRowH / 2
  drawCompass(ctx, compassCX, compassCY, COMPASS_R, state.mov, state.health, state.save, state.control)

  // ── Weapons table ─────────────────────────────────────────────────────────
  const wTableY = curY + (statsRowH - weaponTableBottom) / 2
  drawWeaponsTable(ctx, tblX, wTableY, tblW, state.weapons)

  curY += statsRowH

  // ── Ward badge ────────────────────────────────────────────────────────────
  if (state.ward) {
    hline(ctx, curY); curY += 4
    ctx.fillStyle = C.abilityBg
    ctx.fillRect(PAD, curY, W - PAD * 2, WARD_H - 4)
    ctx.strokeStyle = C.border; ctx.lineWidth = 0.8
    ctx.strokeRect(PAD, curY, W - PAD * 2, WARD_H - 4)
    ctx.fillStyle = C.border; ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText('SALVAGUARDA', PAD + 10, curY + (WARD_H - 4) / 2)
    ctx.fillStyle = C.text; ctx.font = 'bold 14px serif'
    ctx.fillText(`(${state.ward})`, PAD + 100, curY + (WARD_H - 4) / 2)
    curY += WARD_H
  }

  // ── Abilities ─────────────────────────────────────────────────────────────
  if (state.abilities.length > 0) {
    hline(ctx, curY); curY += 4
    ctx.fillStyle = C.border; ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText('HABILIDADES', PAD + 4, curY + 2)
    curY += 14
    curY = drawAbilities(ctx, PAD + 4, curY, W - PAD * 2, state.abilities)
  }

  // ── Keywords ──────────────────────────────────────────────────────────────
  hline(ctx, curY); curY += 2
  ctx.fillStyle = C.kwBg; ctx.fillRect(PAD, curY, W - PAD * 2, KW_H)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(PAD, curY, W - PAD * 2, KW_H)
  ctx.fillStyle = C.border; ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('KEYWORDS', PAD + 10, curY + KW_H / 2)
  ctx.fillStyle = C.text; ctx.font = '12px serif'
  const kw = state.keywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)).join(' ▸ ')
  ctx.fillText(kw, PAD + 88, curY + KW_H / 2)

  return canvas
}

export function downloadWarscrollPng(meta: WarscrollMeta, state: WarscrollState): void {
  const canvas = generateWarscrollCanvas(meta, state)
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `warscroll-${meta.heroName.replace(/\s+/g, '-').toLowerCase()}.png`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
}

// ── Keep parseHeroDescription for the base stat extraction ───────────────────

export function parseHeroDescription(description: string) {
  const mov     = parseInt(description.match(/Mov\s+(\d+)/)?.[1]     ?? '6',  10)
  const health  = parseInt(description.match(/Salud\s+(\d+)/)?.[1]   ?? '5',  10)
  const save    = description.match(/Salvaci[oó]n\s+([^\s,\.]+)/)?.[1] ?? '5+'
  const control = parseInt(description.match(/Control\s+(\d+)/)?.[1] ?? '2',  10)

  const wm = description.match(
    /Arma\s+([^\s:]+(?:\s+[^\s:]+)*):\s*(\d+)\s*Ataques?,\s*([^\s,]+)\s*impactar,\s*([^\s,]+)\s*herir,\s*([^\s,]+)\s*HM,\s*(\d+)\s*Da[nñ]o/i,
  )
  const primaryWeapon = {
    id:    'primary',
    name:  wm ? `Arma ${wm[1]}` : 'Arma Talásica',
    atk:   wm ? parseInt(wm[2], 10) : 3,
    hit:   wm?.[3] ?? '3+',
    wnd:   wm?.[4] ?? '4+',
    rnd:   0,
    dmg:   wm ? parseInt(wm[6], 10) : 2,
    melee: true as const,
    tags:  [] as string[],
  }
  return { mov, health, save, control, primaryWeapon }
}
