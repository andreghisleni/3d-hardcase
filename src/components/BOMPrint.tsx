import React from 'react';
import type { CalculatedBOM, CaseConfig } from '../lib/calculator';

interface BOMPrintProps {
  bom: CalculatedBOM;
  config: CaseConfig;
}

export const BOMPrint = React.forwardRef<HTMLDivElement, BOMPrintProps>(({ bom, config }, ref) => {
  const date = new Date().toLocaleDateString('pt-BR');

  return (
    <div ref={ref} className="p-10 text-black bg-white font-sans print:block hidden">
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase">Romaneio de Corte</h1>
          <p className="text-sm">Projeto: Hardcase Rack {config.units}U</p>
        </div>
        <div className="text-right text-sm">
          <p>Data: {date}</p>
          <p>Método: {config.constructionMethod === 'cutoff' ? 'Fatiar (Cut-off)' : 'Peças Separadas'}</p>
        </div>
      </div>

      {/* Dimensões Gerais */}
      <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-100 p-4 rounded">
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Altura Útil</p>
          <p className="text-lg font-mono">{config.units}U ({(config.units * 44.45).toFixed(1)}mm)</p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Profundidade</p>
          <p className="text-lg font-mono">{config.depth}mm</p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-gray-500">Espessura Madeira</p>
          <p className="text-lg font-mono">{config.thickness}mm</p>
        </div>
      </div>

      {/* Tabela de Madeira */}
      <section className="mb-4">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-300">1. Cortes de Madeira</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border border-gray-300 text-sm">Qtd</th>
              <th className="p-2 border border-gray-300 text-sm">Peça</th>
              <th className="p-2 border border-gray-300 text-sm font-mono text-right">Largura (mm)</th>
              <th className="p-2 border border-gray-300 text-sm font-mono text-center">x</th>
              <th className="p-2 border border-gray-300 text-sm font-mono text-right">Altura (mm)</th>
              <th className="p-2 border border-gray-300 text-sm text-right">Esp.</th>
            </tr>
          </thead>
          <tbody>
            {bom.woodCuts.map((cut, i) => (
              <tr key={i} className="border-b border-gray-200 italic">
                <td className="p-2 border border-gray-300 font-bold">{cut.qty}x</td>
                <td className="p-2 border border-gray-300">{cut.part}</td>
                <td className="p-2 border border-gray-300 text-right font-mono">{cut.width.toFixed(1)}</td>
                <td className="p-2 border border-gray-300 text-center font-mono">x</td>
                <td className="p-2 border border-gray-300 text-right font-mono">{cut.height.toFixed(1)}</td>
                <td className="p-2 border border-gray-300 text-right">{cut.thick}mm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Ferragens e Alumínio */}
      <div className="grid grid-cols-2 gap-8 font-serif">
        <section>
          <h2 className="text-xl font-bold mb-3 border-b border-gray-300 italic">2. Alumínio (Corte)</h2>
          <ul className="space-y-1">
            {bom.aluminum.map((al, i) => (
              <li key={i} className="text-sm flex justify-between border-b border-dotted border-gray-300">
                <span>{al.qty}x {al.profile}</span>
                <span className="font-mono">{al.lengthMm.toFixed(1)} mm</span>
              </li>
            ))}
          </ul>

          {/* NOVO: RESUMO PARA COMPRA */}
          <h3 className="text-xs font-bold uppercase text-gray-600 mb-2">Total para Compra (Estimado)</h3>
          <ul className="space-y-1">
            {bom.aluminumTotals.map((total, i) => (
              <li key={`total-${i}`} className="text-sm flex justify-between font-bold">
                <span>{total.profile}</span>
                <span className="text-blue-700">{total.totalMeters.toFixed(2)} m</span>
              </li>
            ))}
          </ul>
          <p className="text-[9px] text-gray-400 mt-2">* Não considera perda de corte entre peças na mesma barra.</p>

        </section>

        <section>
          <h2 className="text-xl font-bold mb-3 border-b border-gray-300">3. Ferragens (Checklist)</h2>
          <ul className="space-y-1">
            {bom.hardware.map((hw, i) => (
              <li key={i} className="text-sm flex justify-between border-b border-dotted border-gray-300">
                <span>[ ] {hw.item}</span>
                <span className="font-mono">{hw.qty} un</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="mt-12 text-center text-[10px] text-gray-400 border-t pt-4 italic">
        Gerado pelo RackBuilder Pro - Engenharia de Cases customizados.
      </footer>
    </div>
  );
});

BOMPrint.displayName = "BOMPrint";