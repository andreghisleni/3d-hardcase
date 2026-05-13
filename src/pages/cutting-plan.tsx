import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { NestingBoard } from '@/components/NestingBoard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculateNesting } from '@/lib/calculator'

export const Route = createFileRoute('/cutting-plan')({
  component: CuttingPlanPage,
})

// ── Types ──────────────────────────────────────────────────────────────────────

interface PieceRow {
  id: string
  name: string
  width: number
  height: number
  thick: number
  qty: number
}

interface SheetRow {
  id: string
  width: number
  height: number
  thick: number
}

interface NestingItem {
  id: string
  part: string
  w: number
  h: number
  x: number
  y: number
  displayW: number
  displayH: number
  thick?: number
}

interface NestingSheet {
  items: NestingItem[]
  usedArea: number
  thick?: number
}

// ── Constants ──────────────────────────────────────────────────────────────────

const DISTINCT_COLORS = [
  '#fecaca', '#bbf7d0', '#bfdbfe', '#fef08a', '#e9d5ff',
  '#fed7aa', '#fbcfe8', '#99f6e4', '#fecdd3', '#bae6fd',
  '#ddd6fe', '#a7f3d0',
]

const DEFAULT_PIECES: PieceRow[] = [
  { id: '1', name: 'Teto / Base', width: 500, height: 450, thick: 9, qty: 2 },
  { id: '2', name: 'Laterais', width: 266, height: 450, thick: 9, qty: 2 },
  { id: '3', name: 'Faces', width: 500, height: 284, thick: 9, qty: 2 },
]

const DEFAULT_SHEETS: SheetRow[] = [
  { id: '1', width: 2200, height: 1600, thick: 9 },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function newId() {
  return crypto.randomUUID()
}

function toInt(value: string): number {
  const n = Number.parseInt(value, 10)
  return Number.isNaN(n) || n <= 0 ? 1 : n
}

// ── Component ─────────────────────────────────────────────────────────────────

function CuttingPlanPage() {
  const [pieces, setPieces] = useState<PieceRow[]>(DEFAULT_PIECES)
  const [sheets, setSheets] = useState<SheetRow[]>(DEFAULT_SHEETS)
  const [sawKerf, setSawKerf] = useState(3)
  const [nestingSheets, setNestingSheets] = useState<NestingSheet[]>([])
  const [lastSignature, setLastSignature] = useState('')

  // Color map keyed by piece name
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const [i, p] of pieces.entries()) {
      map[p.name] = DISTINCT_COLORS[i % DISTINCT_COLORS.length]
    }
    return map
  }, [pieces])

  // Convert pieces to the format calculateNesting expects, grouped by sheet thickness
  const currentSignature = JSON.stringify({ pieces, sheets, sawKerf })

  useEffect(() => {
    if (currentSignature === lastSignature) return
    setLastSignature(currentSignature)

    // Re-run nesting for each sheet definition
    const allSheets: NestingSheet[] = []
    let sheetGlobalIdx = 0

    for (const sheetDef of sheets) {
      // Build woodCuts-compatible array for pieces matching this sheet thickness
      const cuts = pieces
        .filter((p) => p.thick === sheetDef.thick)
        .map((p) => ({
          part: p.name,
          width: p.width,
          height: p.height,
          qty: p.qty,
          thick: p.thick,
        }))

      if (cuts.length === 0) continue

      const nested = calculateNesting(cuts, sheetDef.width, sheetDef.height, sawKerf)
      for (const s of nested) {
        allSheets.push({
          ...s,
          items: s.items.map((it, i) => ({ ...it, id: `s${sheetGlobalIdx}-i${i}` })),
        })
        sheetGlobalIdx++
      }
    }

    setNestingSheets(allSheets)
  }, [currentSignature, lastSignature, pieces, sheets, sawKerf])

  // ── Pieces handlers ──────────────────────────────────────────────────────────

  const addPiece = () =>
    setPieces((prev) => [
      ...prev,
      { id: newId(), name: 'Nova peça', width: 300, height: 200, thick: sheets[0]?.thick ?? 9, qty: 1 },
    ])

  const removePiece = (id: string) => setPieces((prev) => prev.filter((p) => p.id !== id))

  const updatePiece = <K extends keyof PieceRow>(id: string, key: K, raw: string) => {
    setPieces((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        if (key === 'name') return { ...p, name: raw }
        return { ...p, [key]: toInt(raw) }
      }),
    )
  }

  // ── Sheets handlers ──────────────────────────────────────────────────────────

  const addSheet = () =>
    setSheets((prev) => [
      ...prev,
      { id: newId(), width: 2200, height: 1600, thick: 9 },
    ])

  const removeSheet = (id: string) => setSheets((prev) => prev.filter((s) => s.id !== id))

  const updateSheet = <K extends keyof SheetRow>(id: string, key: K, raw: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id !== id ? s : { ...s, [key]: toInt(raw) })),
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto p-6 lg:flex-row lg:overflow-hidden">

      {/* LEFT PANEL */}
      <div className="flex w-full shrink-0 flex-col gap-6 lg:w-105 lg:overflow-y-auto">

        {/* Saw kerf */}
        <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3">
          <Label className="shrink-0 text-sm">Perda da Serra (mm)</Label>
          <Input
            className="h-8 w-20 text-right"
            min={0}
            type="number"
            value={sawKerf}
            onChange={(e) => setSawKerf(toInt(e.target.value))}
          />
        </div>

        {/* Pieces table */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold text-sm">Peças</h2>
            <Button size="sm" variant="outline" onClick={addPiece}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-3 pl-3" />
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">L</TableHead>
                <TableHead className="text-right">A</TableHead>
                <TableHead className="text-right">Esp.</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="pl-3">
                    <div className="h-3 w-3 rounded-sm" style={{ background: colorMap[p.name] }} />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      className="h-7 min-w-25 text-sm"
                      value={p.name}
                      onChange={(e) => updatePiece(p.id, 'name', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      className="h-7 w-16 text-right text-sm tabular-nums"
                      min={1}
                      type="number"
                      value={p.width}
                      onChange={(e) => updatePiece(p.id, 'width', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      className="h-7 w-16 text-right text-sm tabular-nums"
                      min={1}
                      type="number"
                      value={p.height}
                      onChange={(e) => updatePiece(p.id, 'height', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      className="h-7 w-14 text-right text-sm tabular-nums"
                      min={1}
                      type="number"
                      value={p.thick}
                      onChange={(e) => updatePiece(p.id, 'thick', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Input
                      className="h-7 w-12 text-right text-sm tabular-nums"
                      min={1}
                      type="number"
                      value={p.qty}
                      onChange={(e) => updatePiece(p.id, 'qty', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="pr-2">
                    <Button
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      size="icon"
                      variant="ghost"
                      onClick={() => removePiece(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Sheets table */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-semibold text-sm">Chapas Disponíveis</h2>
            <Button size="sm" variant="outline" onClick={addSheet}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Largura (mm)</TableHead>
                <TableHead className="text-right">Altura (mm)</TableHead>
                <TableHead className="text-right">Esp. (mm)</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sheets.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="py-1.5 pl-4">
                    <Input
                      className="h-7 w-20 text-right text-sm tabular-nums"
                      min={1}
                      type="number"
                      value={s.width}
                      onChange={(e) => updateSheet(s.id, 'width', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex justify-end">
                      <Input
                        className="h-7 w-20 text-right text-sm tabular-nums"
                        min={1}
                        type="number"
                        value={s.height}
                        onChange={(e) => updateSheet(s.id, 'height', e.target.value)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <div className="flex justify-end">
                      <Input
                        className="h-7 w-14 text-right text-sm tabular-nums"
                        min={1}
                        type="number"
                        value={s.thick}
                        onChange={(e) => updateSheet(s.id, 'thick', e.target.value)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="pr-2">
                    <Button
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSheet(s.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* RIGHT PANEL — nesting boards */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <h2 className="shrink-0 font-semibold text-muted-foreground text-sm uppercase tracking-wide">
          Plano de Corte — {nestingSheets.length} chapa{nestingSheets.length !== 1 ? 's' : ''}
        </h2>
        {nestingSheets.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Adicione peças e chapas para gerar o plano de corte
          </div>
        )}
        {nestingSheets.map((sheet, idx) => {
          // Find matching sheet definition for this sheet's thickness
          const sheetDef = sheets.find((s) => s.thick === sheet.thick) ?? sheets[0]
          const sw = sheetDef?.width ?? 2200
          const sh = sheetDef?.height ?? 1600
          return (
            <div key={`sheet-${idx}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Chapa {idx + 1}{sheet.thick ? ` · ${sheet.thick} mm` : ''}
                </span>
                <span className="text-xs text-muted-foreground">
                  {sw} × {sh} mm ·{' '}
                  {((sheet.usedArea / (sw * sh)) * 100).toFixed(0)}% utilizado
                </span>
              </div>
              <NestingBoard
                colorMap={colorMap}
                items={sheet.items}
                sawKerf={sawKerf}
                sheetHeight={sh}
                sheetWidth={sw}
                onChange={(newItems) =>
                  setNestingSheets((prev) =>
                    prev.map((s, i) => (i === idx ? { ...s, items: newItems } : s)),
                  )
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
