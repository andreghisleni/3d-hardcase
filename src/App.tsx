import { useState, useMemo, useRef } from 'react';
import { calculateHardcase, type CaseConfig } from './lib/calculator';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseCanvas } from './components/CaseCanvas';

import { useReactToPrint } from 'react-to-print'; // Adicione este
import { BOMPrint } from './components/BOMPrint'; // Importe o componente
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react"; // Opcional para o ícone

export default function App() {
  const [config, setConfig] = useState<CaseConfig>({
    units: 6,
    depth: 450,
    thickness: 9,
    hasFrontLid: true,
    hasBackLid: true,
    lidDepth: 70,
    constructionMethod: 'cutoff',
    sawKerf: 3,
    catchesPerLid: 2,
    hasDrawer: true,
    drawerUnits: 2,
    drawerThickness: 6,
    lidOffset: 150,   // Tampas começam afastadas 15cm
    drawerOffset: 0   // Gaveta começa fechada
  });

  const bom = useMemo(() => calculateHardcase(config), [config]);

  const handleNumberChange = (key: keyof CaseConfig, value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) setConfig(prev => ({ ...prev, [key]: num }));
  };

  const hasAnyLid = config.hasFrontLid || config.hasBackLid;


  const printRef = useRef<HTMLDivElement>(null);

  // Na versão nova, você chama o hook assim:
  const handlePrint = useReactToPrint({
    // Se der erro aqui, passe um objeto vazio {} e configure o content no trigger
    contentRef: printRef,
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col lg:flex-row gap-8">
      {/* Coluna Esquerda: Controles */}
      <Card className="w-full lg:w-[450px] shrink-0 overflow-y-auto max-h-[90vh]">
        <CardHeader>
          <CardTitle>Configuração do Case</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* Dimensões Principais */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Unidades de Rack (U)</Label>
              <Input type="number" className="w-20 text-right h-8" value={config.units} onChange={(e) => handleNumberChange('units', e.target.value)} />
            </div>
            <Slider value={[config.units]} min={2} max={24} step={1} onValueChange={([v]) => setConfig(prev => ({ ...prev, units: v }))} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Profundidade Útil (mm)</Label>
              <Input type="number" className="w-24 text-right h-8" value={config.depth} onChange={(e) => handleNumberChange('depth', e.target.value)} />
            </div>
            <Slider value={[config.depth]} min={250} max={800} step={10} onValueChange={([v]) => setConfig(prev => ({ ...prev, depth: v }))} />
          </div>

          {/* Madeira Principal */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm text-muted-foreground">Madeira (Corpo e Tampas)</h3>
            <div className="flex items-center justify-between">
              <Label>Espessura (mm)</Label>
              <Input type="number" className="w-20 text-right h-8" value={config.thickness} onChange={(e) => handleNumberChange('thickness', e.target.value)} />
            </div>
            <Slider value={[config.thickness]} min={6} max={18} step={1} onValueChange={([v]) => setConfig(prev => ({ ...prev, thickness: v }))} />
          </div>

          {/* Gaveta */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">Gaveta Interna</h3>
              <Switch checked={config.hasDrawer} onCheckedChange={(v) => setConfig(prev => ({ ...prev, hasDrawer: v }))} />
            </div>

            {config.hasDrawer && (
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Altura da Gaveta (U)</Label>
                    <Input type="number" className="w-16 text-right h-8" value={config.drawerUnits} onChange={(e) => handleNumberChange('drawerUnits', e.target.value)} />
                  </div>
                  <Slider value={[config.drawerUnits]} min={1} max={config.units - 1} step={1} onValueChange={([v]) => setConfig(prev => ({ ...prev, drawerUnits: v }))} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Espessura da Gaveta (mm)</Label>
                    <Input type="number" className="w-16 text-right h-8" value={config.drawerThickness} onChange={(e) => handleNumberChange('drawerThickness', e.target.value)} />
                  </div>
                  <Slider value={[config.drawerThickness]} min={6} max={15} step={1} onValueChange={([v]) => setConfig(prev => ({ ...prev, drawerThickness: v }))} />
                </div>
              </div>
            )}
          </div>

          {/* Tampas e Método */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-sm text-muted-foreground">Tampas e Construção</h3>
            <div className="flex items-center justify-between">
              <Label>Tampa Frontal</Label>
              <Switch checked={config.hasFrontLid} onCheckedChange={(v) => setConfig(prev => ({ ...prev, hasFrontLid: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tampa Traseira</Label>
              <Switch checked={config.hasBackLid} onCheckedChange={(v) => setConfig(prev => ({ ...prev, hasBackLid: v }))} />
            </div>

            {hasAnyLid && (
              <div className="space-y-5 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Prof. Tampa (mm)</Label>
                  <Input type="number" className="w-20 text-right h-8" value={config.lidDepth} onChange={(e) => handleNumberChange('lidDepth', e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Fechos por Tampa</Label>
                  <Input type="number" className="w-16 text-right h-8" value={config.catchesPerLid} onChange={(e) => handleNumberChange('catchesPerLid', e.target.value)} />
                </div>
              </div>
            )}

            <RadioGroup value={config.constructionMethod} onValueChange={(v: 'separate' | 'cutoff') => setConfig(prev => ({ ...prev, constructionMethod: v }))} className="flex flex-col space-y-2 mt-4">
              <div className="flex items-center space-x-2"><RadioGroupItem value="separate" id="separate" /><Label htmlFor="separate">Peças Separadas</Label></div>
              <div className="flex items-center space-x-2"><RadioGroupItem value="cutoff" id="cutoff" disabled={!hasAnyLid} /><Label htmlFor="cutoff">Fatiar Case (Cut-off)</Label></div>
            </RadioGroup>
          </div>

          {/* --- NOVO: CONTROLES DE ANIMAÇÃO 3D --- */}
          <div className="space-y-4 pt-4 border-t border-border bg-muted/20 p-4 rounded-lg">
            <h3 className="font-semibold text-sm text-primary mb-3">Controles do Visualizador 3D</h3>

            {hasAnyLid && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Afastamento da Tampa (mm)</Label>
                  <Input type="number" className="w-16 text-right h-8" value={config.lidOffset} onChange={(e) => handleNumberChange('lidOffset', e.target.value)} />
                </div>
                <Slider value={[config.lidOffset]} min={0} max={600} step={10} onValueChange={([v]) => setConfig(prev => ({ ...prev, lidOffset: v }))} />
              </div>
            )}

            {config.hasDrawer && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Abrir Gaveta (mm)</Label>
                  <Input type="number" className="w-16 text-right h-8" value={config.drawerOffset} onChange={(e) => handleNumberChange('drawerOffset', e.target.value)} />
                </div>
                <Slider value={[config.drawerOffset]} min={0} max={config.depth} step={10} onValueChange={([v]) => setConfig(prev => ({ ...prev, drawerOffset: v }))} />
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Coluna Direita: Tabs */}
      <div className="flex-1 min-w-0">
        <Tabs defaultValue="3d" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger value="3d">Visualizador 3D</TabsTrigger>
              <TabsTrigger value="bom">Lista de Materiais</TabsTrigger>
            </TabsList>

            {/* BOTÃO DE PDF */}
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" /> Exportar para Oficina
            </Button>
          </div>

          <TabsContent value="3d" className="m-0">
            <div className="w-full h-[700px] max-h-[85vh]">
              <CaseCanvas config={config} />
            </div>
          </TabsContent>

          <TabsContent value="bom" className="m-0">
            <Card>
              <CardHeader><CardTitle>Lista de Cortes e Materiais</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                <div>
                  <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Cortes de Madeira</h3>
                  <ul className="space-y-3 text-sm">
                    {bom.woodCuts.map((cut, i) => (
                      <li key={i} className="flex flex-col bg-muted/30 border border-border p-3 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-foreground">{cut.qty}x {cut.part}</span>
                          <span className="font-mono text-muted-foreground">{cut.width.toFixed(1)} x {cut.height.toFixed(1)} mm</span>
                        </div>
                        <span className="text-xs text-muted-foreground/70 text-right">Espessura: {cut.thick}mm</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-lg mb-4 border-b border-border pb-2">Ferragens e Alumínio</h3>
                  <ul className="space-y-3 text-sm mb-6">
                    {bom.aluminum.map((al, i) => (
                      <li key={`al-${i}`} className="flex justify-between items-center bg-muted/30 border p-3 rounded-md">
                        <span className="font-medium">{al.qty}x {al.profile}</span>
                        <span className="font-mono text-muted-foreground">{(al.lengthMm / 1000).toFixed(2)} m</span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3 text-sm">
                    {bom.hardware.map((hw, i) => (
                      <li key={`hw-${i}`} className="flex justify-between items-center bg-muted/30 border p-3 rounded-md">
                        <span className="font-medium">{hw.item}</span>
                        <span className="font-mono text-muted-foreground">{hw.qty} un</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ADICIONE ESTA LINHA AQUI */}
      <BOMPrint ref={printRef} bom={bom} config={config} />
    </div>
  );
}