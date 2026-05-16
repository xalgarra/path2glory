// Generates a warscroll-style PNG image on a Canvas element.

export interface WarscrollData {
  heroName: string
  heroTypeName: string
  factionName: string
  mov: string
  health: string
  save: string
  control: string
  weaponName: string
  weaponAtk: string
  weaponHit: string
  weaponWnd: string
  weaponRnd: string
  weaponDmg: string
  improvements: Array<{ name: string; effect: string }>
  keywords: string[]
}

const C = {
  bg: '#0c1a10',
  headerBg: '#1a6b3a',
  tableBg: '#0f2215',
  tableHeaderBg: '#1a5a32',
  border: '#c8a44e',
  text: '#ffffff',
  muted: '#a0c0a0',
  cardBg: '#0f2215',
  kwBg: '#080f09',
  quadDark: '#060e08',
  quadGreen: '#1a5a30',
}

const W = 800
const PAD = 16

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

// ── Compass ───────────────────────────────────────────────────────────────────

function drawCompass(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, r: number,
  mov: string, health: string, save: string, control: string,
) {
  // Outer decorative ring
  ctx.beginPath()
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Base fill
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = C.bg
  ctx.fill()

  // 4 quadrants (alternating dark/green)
  // Top-left: dark (MOVE), Top-right: green (SAVE)
  // Bottom-left: green (HEALTH), Bottom-right: dark (CONTROL)
  const quads: Array<{ start: number; end: number; color: string }> = [
    { start: Math.PI,        end: 3 * Math.PI / 2, color: C.quadDark  }, // top-left
    { start: -Math.PI / 2,  end: 0,               color: C.quadGreen }, // top-right
    { start: Math.PI / 2,   end: Math.PI,          color: C.quadGreen }, // bottom-left
    { start: 0,              end: Math.PI / 2,     color: C.quadDark  }, // bottom-right
  ]
  for (const q of quads) {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r - 3, q.start, q.end)
    ctx.closePath()
    ctx.fillStyle = q.color
    ctx.fill()
  }

  // Gold cross
  ctx.beginPath()
  ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy)
  ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 2
  ctx.stroke()

  // Gold border ring on top
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 2
  ctx.stroke()

  // Center dot
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2)
  ctx.fillStyle = C.border
  ctx.fill()

  // Stat values at cardinal positions inside circle
  const valOffset = r * 0.48
  ctx.font = `bold ${Math.round(r * 0.3)}px serif`
  ctx.fillStyle = C.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(mov,     cx,           cy - valOffset) // top
  ctx.fillText(health,  cx - valOffset, cy)           // left
  ctx.fillText(save,    cx + valOffset, cy)           // right
  ctx.fillText(control, cx,           cy + valOffset) // bottom

  // Labels outside the ring
  const labelFont = `${Math.round(r * 0.16)}px sans-serif`
  ctx.font = labelFont
  ctx.fillStyle = C.border

  // MOVE – top
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('MOVE', cx, cy - r - 7)

  // CONTROL – bottom
  ctx.textBaseline = 'top'
  ctx.fillText('CONTROL', cx, cy + r + 7)

  // HEALTH – left (rotated)
  ctx.save()
  ctx.translate(cx - r - 7, cy)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('HEALTH', 0, 0)
  ctx.restore()

  // SAVE – right (rotated)
  ctx.save()
  ctx.translate(cx + r + 7, cy)
  ctx.rotate(Math.PI / 2)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('SAVE', 0, 0)
  ctx.restore()
}

// ── Stat parser (reads description field from heroes.json) ────────────────────

export function parseHeroDescription(description: string) {
  const mov     = description.match(/Mov\s+([^\s,\.]+)/)?.[1]     ?? '?'
  const health  = description.match(/Salud\s+(\d+)/)?.[1]         ?? '?'
  const save    = description.match(/Salvaci[oó]n\s+([^\s,\.]+)/)?.[1] ?? '?'
  const control = description.match(/Control\s+(\d+)/)?.[1]        ?? '?'

  // "Arma talásica: 3 Ataques, 3+ impactar, 4+ herir, 1 HM, 2 Daño"
  const wm = description.match(
    /Arma\s+([^\s:]+(?:\s+[^\s:]+)*):\s*(\d+)\s*Ataques?,\s*([^\s,]+)\s*impactar,\s*([^\s,]+)\s*herir,\s*([^\s,]+)\s*HM,\s*(\d+)\s*Da[nñ]o/i,
  )
  return {
    mov, health, save, control,
    weaponName: wm ? `Arma ${wm[1]}` : '—',
    weaponAtk:  wm?.[2] ?? '—',
    weaponHit:  wm?.[3] ?? '—',
    weaponWnd:  wm?.[4] ?? '—',
    weaponRnd:  wm?.[5] ?? '—',
    weaponDmg:  wm?.[6] ?? '—',
  }
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateWarscrollCanvas(data: WarscrollData): HTMLCanvasElement {
  // Pre-calculate improvements section height
  const impCount = data.improvements.length
  const impCols = 2
  const impRows = Math.ceil(impCount / impCols)
  const IMP_CARD_H = 54
  const IMP_GAP = 6
  const IMP_HEADER_H = impCount > 0 ? 22 : 0
  const IMP_SECTION_H = impCount > 0 ? IMP_HEADER_H + impRows * (IMP_CARD_H + IMP_GAP) + 8 : 0

  const HEADER_H   = 100
  const COMPASS_R  = 52
  const STATS_H    = COMPASS_R * 2 + 30  // room for labels above/below compass
  const DIVIDER_H  = 2
  const KW_H       = 44
  const totalH     = PAD + HEADER_H + DIVIDER_H + STATS_H + DIVIDER_H + IMP_SECTION_H + DIVIDER_H + KW_H + PAD

  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, totalH)

  // Outer border (double line)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 4
  ctx.strokeRect(6, 6, W - 12, totalH - 12)
  ctx.lineWidth = 1
  ctx.strokeRect(11, 11, W - 22, totalH - 22)

  // ── Header ──────────────────────────────────────────────────────────────────
  const hY = PAD
  ctx.fillStyle = C.headerBg
  ctx.fillRect(PAD, hY, W - PAD * 2, HEADER_H)
  ctx.strokeStyle = C.border
  ctx.lineWidth = 1.5
  ctx.strokeRect(PAD, hY, W - PAD * 2, HEADER_H)

  // Subtitle
  ctx.fillStyle = C.border
  ctx.font = '11px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(`• ${data.factionName.toUpperCase()} WARSCROLL •`, W / 2, hY + 8)

  // Hero name
  ctx.fillStyle = C.text
  ctx.font = 'bold 32px serif'
  ctx.fillText(data.heroName.toUpperCase(), W / 2, hY + 26)

  // Hero type
  ctx.fillStyle = C.muted
  ctx.font = 'italic 15px serif'
  ctx.fillText(data.heroTypeName, W / 2, hY + 68)

  // ── Divider ──────────────────────────────────────────────────────────────────
  let curY = PAD + HEADER_H
  ctx.beginPath()
  ctx.moveTo(PAD, curY); ctx.lineTo(W - PAD, curY)
  ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.stroke()
  curY += DIVIDER_H

  // ── Stats + Weapons row ──────────────────────────────────────────────────────
  const statsRowY = curY
  const compassCX = PAD + 20 + COMPASS_R + 14  // leave room for HEALTH label on left
  const compassCY = statsRowY + STATS_H / 2

  drawCompass(ctx, compassCX, compassCY, COMPASS_R,
    data.mov, data.health, data.save, data.control)

  // Weapons table
  const tblX = compassCX + COMPASS_R + 28
  const tblW = W - tblX - PAD
  const tblY = statsRowY + (STATS_H - 60) / 2
  const COL_W = [tblW * 0.40, tblW * 0.12, tblW * 0.12, tblW * 0.12, tblW * 0.12, tblW * 0.12]
  const hdrs  = ['MELEE WEAPONS', 'Atk', 'Hit', 'Wnd', 'Rnd', 'Dmg']

  // Table header row
  ctx.fillStyle = C.tableHeaderBg
  ctx.fillRect(tblX, tblY, tblW, 26)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1
  ctx.strokeRect(tblX, tblY, tblW, 26)

  ctx.fillStyle = C.text
  ctx.font = 'bold 10px sans-serif'
  ctx.textBaseline = 'middle'
  let cx2 = tblX
  for (let i = 0; i < hdrs.length; i++) {
    ctx.textAlign = i === 0 ? 'left' : 'center'
    ctx.fillText(hdrs[i], i === 0 ? cx2 + 6 : cx2 + COL_W[i] / 2, tblY + 13)
    cx2 += COL_W[i]
    if (i < hdrs.length - 1) {
      ctx.beginPath(); ctx.moveTo(cx2, tblY); ctx.lineTo(cx2, tblY + 26)
      ctx.strokeStyle = C.border; ctx.lineWidth = 0.5; ctx.stroke()
    }
  }

  // Weapon data row
  const wRowY = tblY + 26
  ctx.fillStyle = C.tableBg
  ctx.fillRect(tblX, wRowY, tblW, 26)
  ctx.strokeStyle = C.border; ctx.lineWidth = 0.5
  ctx.strokeRect(tblX, wRowY, tblW, 26)

  const vals = [data.weaponName, data.weaponAtk, data.weaponHit, data.weaponWnd, data.weaponRnd, data.weaponDmg]
  cx2 = tblX
  ctx.font = '12px serif'
  ctx.fillStyle = C.text
  for (let i = 0; i < vals.length; i++) {
    ctx.textAlign = i === 0 ? 'left' : 'center'
    ctx.fillText(vals[i], i === 0 ? cx2 + 6 : cx2 + COL_W[i] / 2, wRowY + 13)
    cx2 += COL_W[i]
  }

  curY = statsRowY + STATS_H

  // ── Divider ──────────────────────────────────────────────────────────────────
  ctx.beginPath(); ctx.moveTo(PAD, curY); ctx.lineTo(W - PAD, curY)
  ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.stroke()
  curY += DIVIDER_H

  // ── Improvements ─────────────────────────────────────────────────────────────
  if (impCount > 0) {
    ctx.fillStyle = C.border
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('MEJORAS', PAD + 4, curY + 4)
    curY += IMP_HEADER_H

    const cardW = (W - PAD * 2 - IMP_GAP) / impCols

    data.improvements.forEach((imp, i) => {
      const col = i % impCols
      const row = Math.floor(i / impCols)
      const cardX = PAD + col * (cardW + IMP_GAP)
      const cardY = curY + row * (IMP_CARD_H + IMP_GAP)

      roundRect(ctx, cardX, cardY, cardW, IMP_CARD_H, 4)
      ctx.fillStyle = C.cardBg
      ctx.fill()
      ctx.strokeStyle = C.border
      ctx.lineWidth = 0.8
      ctx.stroke()

      // Name
      ctx.fillStyle = C.text
      ctx.font = 'bold 11px serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(imp.name, cardX + 8, cardY + 7)

      // Effect (wrapped, max 2 lines)
      ctx.fillStyle = C.muted
      ctx.font = '10px sans-serif'
      const lines = wrapLines(ctx, imp.effect, cardW - 16)
      lines.slice(0, 3).forEach((line, li) => {
        ctx.fillText(line, cardX + 8, cardY + 22 + li * 11)
      })
    })

    curY += impRows * (IMP_CARD_H + IMP_GAP) + 8
  }

  // ── Divider ──────────────────────────────────────────────────────────────────
  ctx.beginPath(); ctx.moveTo(PAD, curY); ctx.lineTo(W - PAD, curY)
  ctx.strokeStyle = C.border; ctx.lineWidth = 2; ctx.stroke()
  curY += DIVIDER_H

  // ── Keywords ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.kwBg
  ctx.fillRect(PAD, curY, W - PAD * 2, KW_H)
  ctx.strokeStyle = C.border; ctx.lineWidth = 1
  ctx.strokeRect(PAD, curY, W - PAD * 2, KW_H)

  ctx.fillStyle = C.border
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('KEYWORDS', PAD + 10, curY + KW_H / 2)

  ctx.fillStyle = C.text
  ctx.font = '12px serif'
  const kwText = data.keywords.map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' ▸ ')
  ctx.fillText(kwText, PAD + 88, curY + KW_H / 2)

  return canvas
}

export function downloadWarscrollPng(data: WarscrollData, heroName: string): void {
  const canvas = generateWarscrollCanvas(data)
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = `warscroll-${heroName.replace(/\s+/g, '-').toLowerCase()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
