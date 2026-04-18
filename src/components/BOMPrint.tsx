import React from 'react';
import type { CalculatedBOM, CaseConfig } from '@/lib/calculator';

interface NestingItem {
  id: string;
  part: string;
  w: number;
  h: number;
  x: number;
  y: number;
  displayW: number;
  displayH: number;
  thick?: number;
}

interface NestingSheet {
  items: NestingItem[];
  usedArea: number;
  thick?: number;
}

interface BOMPrintProps {
  bom: CalculatedBOM;
  config: CaseConfig;
  nestingSheets: NestingSheet[];
  colorMap: Record<string, string>;
}

export const BOMPrint = React.forwardRef<HTMLDivElement, BOMPrintProps>(
  ({ bom, config, nestingSheets, colorMap }, ref) => {
    return (
      <div style={{ display: 'none' }}>
        <div
          className="bg-white p-10 font-sans text-black print:block"
          ref={ref}
        >
          {/* CABEÇALHO PROFISSIONAL */}
          <header className="mb-8 flex items-end justify-between border-black border-b-4 pb-4">
            <div>
              <h1 className="font-black text-4xl uppercase tracking-tighter">
                Romaneio de Produção
              </h1>
              <p className="font-bold text-gray-600 text-lg">
                Hardcase {config.units}U - Profundidade {config.depth}mm
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">
                Data: {new Date().toLocaleDateString()}
              </p>
              <p className="font-bold font-mono text-sm">
                Chapa: {config.sheetWidth}x{config.sheetHeight}mm (Disco:{' '}
                {config.sawKerf}mm)
              </p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-10">
            {/* 1. MADEIRA */}
            <section>
              <h2 className="mb-4 border-black border-b-2 pb-1 font-bold text-xl uppercase italic">
                1. Cortes de Madeira
              </h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-black border-b-2 bg-gray-100">
                    <th className="p-2 text-left">Peça</th>
                    <th className="p-2 text-center">Qtd</th>
                    <th className="p-2 text-right">Dimensões (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {bom.woodCuts.map((cut) => (
                    <tr className="border-gray-300 border-b" key={cut.part}>
                      <td className="flex items-center gap-2 p-2">
                        <div
                          className="h-3 w-3 rounded-sm border"
                          style={{ backgroundColor: colorMap[cut.part] }}
                        />
                        {cut.part}
                      </td>
                      <td className="p-2 text-center font-bold">{cut.qty}x</td>
                      <td className="p-2 text-right font-mono">
                        {cut.width.toFixed(1)} x {cut.height.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 2. ALUMÍNIO */}
            <section>
              <h2 className="mb-4 border-black border-b-2 pb-1 font-bold text-xl uppercase italic">
                2. Perfis de Alumínio
              </h2>
              <table className="mb-4 w-full border-collapse text-sm">
                <thead>
                  <tr className="border-black border-b-2 bg-gray-100">
                    <th className="p-2 text-left">Perfil</th>
                    <th className="p-2 text-center">Qtd</th>
                    <th className="p-2 text-right">Corte (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {bom.aluminum.map((al) => (
                    <tr className="border-gray-300 border-b" key={al.profile}>
                      <td className="p-2">{al.profile}</td>
                      <td className="p-2 text-center">{al.qty}x</td>
                      <td className="p-2 text-right font-mono">
                        {al.lengthMm.toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-2 border-gray-400 border-dashed bg-gray-50 p-3">
                <p className="mb-1 font-bold text-[10px] text-gray-500 uppercase italic">
                  Total Linear Estimado
                </p>
                {bom.aluminumTotals.map((total) => (
                  <div
                    className="flex justify-between font-bold text-sm"
                    key={total.profile}
                  >
                    <span>{total.profile}</span>
                    <span>{total.totalMeters.toFixed(2)} m</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 3. FERRAGENS */}
          <section className="mt-8">
            <h2 className="mb-4 border-black border-b-2 pb-1 font-bold text-xl uppercase italic">
              3. Ferragens e Acessórios
            </h2>
            <div className="grid grid-cols-4 gap-4">
              {bom.hardware.map((hw, i) => (
                <div
                  className="flex items-center justify-between border border-gray-300 bg-gray-50 p-2"
                  key={i.toString()}
                >
                  <span className="font-bold text-[11px] uppercase leading-none">
                    {hw.item}
                  </span>
                  <span className="bg-black px-1.5 py-0.5 font-bold text-white text-xs">
                    x{hw.qty}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* 4. PLANO DE CORTE (COM QUEBRA DE PÁGINA) */}
          <div className="space-y-12">
            {nestingSheets.map((sheet, idx) => (
              <div
                className="pt-10"
                key={idx.toString()}
                style={{ breakBefore: 'page' }}
              >
                <h2 className="mb-6 border-black border-b-4 pb-2 text-center font-black text-2xl uppercase italic">
                  {idx + 4}. Diagramas de Corte (Nesting) {sheet.thick}mm
                </h2>

                <div className="page-break-inside-avoid rounded-sm border-2 border-black p-4">
                  <div className="mb-4 flex items-center justify-between border-gray-300 border-b pb-2">
                    <span className="font-black text-lg uppercase tracking-tight">
                      CHAPA {idx + 1} - Espessura {sheet.thick}mm
                    </span>
                    <span className="bg-gray-100 px-2 py-1 font-bold font-mono text-sm">
                      Aproveitamento:{' '}
                      {(
                        (sheet.usedArea /
                          (config.sheetWidth * config.sheetHeight)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>

                  <svg
                    aria-label={`Diagrama de corte chapa ${idx + 1}`}
                    className="h-auto w-full border border-black bg-white"
                    role="img"
                    viewBox={`0 0 ${config.sheetWidth} ${config.sheetHeight}`}
                  >
                    <title>Diagrama de corte chapa {idx + 1}</title>
                    <rect
                      fill="none"
                      height={config.sheetHeight}
                      stroke="#eee"
                      strokeDasharray="5,5"
                      strokeWidth="2"
                      width={config.sheetWidth}
                    />

                    {sheet.items.map((it) => {
                      const w = it.w - config.sawKerf;
                      const h = it.h - config.sawKerf;
                      const cx = w / 2;
                      const cy = h / 2;
                      const isVertical = h > w;
                      const shortSide = Math.min(w, h);

                      // Fontes adaptativas para o PDF
                      const titleSize = Math.max(
                        7,
                        Math.min(13, shortSide * 0.15)
                      );
                      const dimsSize = Math.max(
                        9,
                        Math.min(20, shortSide * 0.25)
                      );
                      const lineGap = shortSide > 80 ? 12 : shortSide * 0.18;

                      return (
                        <g
                          key={it.id}
                          transform={`translate(${it.x}, ${it.y})`}
                        >
                          <rect
                            fill={colorMap[it.part] || '#ffffff'}
                            height={h}
                            stroke="black"
                            strokeWidth="1.5"
                            width={w}
                          />
                          <g
                            transform={
                              isVertical ? `rotate(-90 ${cx} ${cy})` : undefined
                            }
                          >
                            <text
                              dominantBaseline="central"
                              fontSize={titleSize}
                              fontWeight="bold"
                              textAnchor="middle"
                              x={cx}
                              y={cy - lineGap}
                            >
                              {it.part.split(':')[1]?.trim() || it.part}
                            </text>
                            <text
                              dominantBaseline="central"
                              fontFamily="monospace"
                              fontSize={dimsSize}
                              fontWeight="black"
                              textAnchor="middle"
                              x={cx}
                              y={cy + lineGap}
                            >
                              {it.displayW.toFixed(0)} x{' '}
                              {it.displayH.toFixed(0)}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ))}

            <footer className="mt-10 border-t pt-4 text-center text-[10px] text-gray-400 uppercase tracking-widest">
              Atenção: Os desenhos consideram a peça final acabada. Descontar{' '}
              {config.sawKerf}mm de perda por corte.
            </footer>
          </div>
        </div>
      </div>
    );
  }
);
