import { Download, Printer, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BOMPrint } from './components/BOMPrint';
import { CaseCanvas } from './components/CaseCanvas';
import { NestingBoard } from './components/NestingBoard';
import {
  type CaseConfig,
  calculateHardcase,
  calculateNesting,
} from './lib/calculator';

const DISTINCT_COLORS = [
  '#fecaca',
  '#bbf7d0',
  '#bfdbfe',
  '#fef08a',
  '#e9d5ff',
  '#fed7aa',
  '#fbcfe8',
  '#99f6e4',
  '#fecdd3',
  '#bae6fd',
  '#ddd6fe',
  '#a7f3d0',
];

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
    lidOffset: 150,
    drawerOffset: 0,
    explodeOffset: 0,
    sheetWidth: 2200,
    sheetHeight: 1600,
  });

  const [highlighted, setHighlighted] = useState<string[]>([]);
  const bom = useMemo(() => calculateHardcase(config), [config]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    bom.woodCuts.forEach((cut, index) => {
      map[cut.part] = DISTINCT_COLORS[index % DISTINCT_COLORS.length];
    });
    return map;
  }, [bom.woodCuts]);

  const [nestingSheets, setNestingSheets] = useState<any[]>([]);
  // NOVO: Guarda a "assinatura" da última vez que o algoritmo automático rodou
  const [lastSignature, setLastSignature] = useState("");

  // Cria uma assinatura de texto única para as medidas atuais
  const currentSignature = JSON.stringify({
    cuts: bom.woodCuts, w: config.sheetWidth, h: config.sheetHeight, k: config.sawKerf
  });

  // ATUALIZADO: O Vigilante de Atualização Automática
  useEffect(() => {
    // Se a assinatura for igual, não faz nada! (Protege o layout importado)
    if (currentSignature === lastSignature) { return; }

    // Se chegou aqui, é porque você mexeu nos sliders. Recalcula o automático!
    const autoSheets = calculateNesting(bom.woodCuts, config.sheetWidth, config.sheetHeight, config.sawKerf);
    setNestingSheets(autoSheets.map((s, sIdx) => ({
      ...s,
      items: s.items.map((it: any, i: number) => ({ ...it, id: `s${sIdx}-i${i}` }))
    })));

    // Atualiza a assinatura
    setLastSignature(currentSignature);
  }, [currentSignature, lastSignature, bom.woodCuts, config.sheetWidth, config.sheetHeight, config.sawKerf]);

  const handleExport = () => {
    const project = { config, nestingSheets, date: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `case-${config.units}U-${config.depth}mm.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);

        if (data.config) {
          setConfig(data.config);

          // MÁGICA: Pré-calcula a assinatura do ficheiro para avisar o useEffect 
          // que ele não deve apagar o nosso layout manual!
          const importedBom = calculateHardcase(data.config);
          const importedSignature = JSON.stringify({
            cuts: importedBom.woodCuts, w: data.config.sheetWidth, h: data.config.sheetHeight, k: data.config.sawKerf
          });
          setLastSignature(importedSignature);
        }

        if (data.nestingSheets) {
          setNestingSheets(data.nestingSheets);
        }
      } catch (error) {
        console.error("Erro ao ler o ficheiro:", error);
      }
    };
    reader.readAsText(file);

    // Limpa o botão para permitir importar o mesmo ficheiro duas vezes seguidas, se necessário
    e.target.value = '';
  };

  const handleNumberChange = (key: keyof CaseConfig, value: string) => {
    const num = Number.parseInt(value, 10);
    if (!Number.isNaN(num)) {
      setConfig((prev) => ({ ...prev, [key]: num }));
    }
  };

  const toggleHighlight = (itemName: string) => {
    setHighlighted((prev) =>
      prev.includes(itemName)
        ? prev.filter((i) => i !== itemName)
        : [...prev, itemName]
    );
  };

  const hasAnyLid = config.hasFrontLid || config.hasBackLid;
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-background p-8 text-foreground lg:flex-row">
      <Card className="flex max-h-[90vh] w-full shrink-0 flex-col overflow-hidden lg:w-[450px]">
        <Tabs className="flex h-full w-full flex-col" defaultValue="config">
          <CardHeader className="shrink-0 border-b pb-4">
            <CardTitle className="mb-4">Construtor de Hardcase</CardTitle>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="parts">Peças no 3D</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent
            className="m-0 flex-1 space-y-8 overflow-y-auto p-6"
            value="config"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Unidades de Rack (U)</Label>
                <Input
                  className="h-8 w-20 text-right"
                  onChange={(e) => handleNumberChange('units', e.target.value)}
                  type="number"
                  value={config.units}
                />
              </div>
              <Slider
                max={24}
                min={2}
                onValueChange={([v]) =>
                  setConfig((prev) => ({ ...prev, units: v }))
                }
                step={1}
                value={[config.units]}
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Profundidade Útil (mm)</Label>
                <Input
                  className="h-8 w-24 text-right"
                  onChange={(e) => handleNumberChange('depth', e.target.value)}
                  type="number"
                  value={config.depth}
                />
              </div>
              <Slider
                max={800}
                min={250}
                onValueChange={([v]) =>
                  setConfig((prev) => ({ ...prev, depth: v }))
                }
                step={10}
                value={[config.depth]}
              />
            </div>

            <div className="space-y-4 border-border border-t pt-4">
              <h3 className="font-semibold text-muted-foreground text-sm">
                Madeira (Corpo e Tampas)
              </h3>
              <div className="flex items-center justify-between">
                <Label>Espessura (mm)</Label>
                <Input
                  className="h-8 w-20 text-right"
                  onChange={(e) =>
                    handleNumberChange('thickness', e.target.value)
                  }
                  type="number"
                  value={config.thickness}
                />
              </div>
              <Slider
                max={18}
                min={6}
                onValueChange={([v]) =>
                  setConfig((prev) => ({ ...prev, thickness: v }))
                }
                step={1}
                value={[config.thickness]}
              />
            </div>

            <div className="space-y-4 border-border border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-muted-foreground text-sm">
                  Gaveta Interna
                </h3>
                <Switch
                  checked={config.hasDrawer}
                  onCheckedChange={(v) =>
                    setConfig((prev) => ({ ...prev, hasDrawer: v }))
                  }
                />
              </div>
              {config.hasDrawer && (
                <div className="space-y-6 pt-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Altura da Gaveta (U)</Label>
                      <Input
                        className="h-8 w-16 text-right"
                        onChange={(e) =>
                          handleNumberChange('drawerUnits', e.target.value)
                        }
                        type="number"
                        value={config.drawerUnits}
                      />
                    </div>
                    <Slider
                      max={config.units - 1}
                      min={1}
                      onValueChange={([v]) =>
                        setConfig((prev) => ({ ...prev, drawerUnits: v }))
                      }
                      step={1}
                      value={[config.drawerUnits]}
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Espessura da Gaveta (mm)</Label>
                      <Input
                        className="h-8 w-16 text-right"
                        onChange={(e) =>
                          handleNumberChange('drawerThickness', e.target.value)
                        }
                        type="number"
                        value={config.drawerThickness}
                      />
                    </div>
                    <Slider
                      max={15}
                      min={6}
                      onValueChange={([v]) =>
                        setConfig((prev) => ({ ...prev, drawerThickness: v }))
                      }
                      step={1}
                      value={[config.drawerThickness]}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 border-border border-t pt-4">
              <h3 className="font-semibold text-muted-foreground text-sm">
                Tampas e Construção
              </h3>
              <div className="flex items-center justify-between">
                <Label>Tampa Frontal</Label>
                <Switch
                  checked={config.hasFrontLid}
                  onCheckedChange={(v) =>
                    setConfig((prev) => ({ ...prev, hasFrontLid: v }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Tampa Traseira</Label>
                <Switch
                  checked={config.hasBackLid}
                  onCheckedChange={(v) =>
                    setConfig((prev) => ({ ...prev, hasBackLid: v }))
                  }
                />
              </div>
              {hasAnyLid && (
                <div className="space-y-5 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Prof. Tampa (mm)</Label>
                    <Input
                      className="h-8 w-20 text-right"
                      onChange={(e) =>
                        handleNumberChange('lidDepth', e.target.value)
                      }
                      type="number"
                      value={config.lidDepth}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Fechos por Tampa</Label>
                    <Input
                      className="h-8 w-16 text-right"
                      onChange={(e) =>
                        handleNumberChange('catchesPerLid', e.target.value)
                      }
                      type="number"
                      value={config.catchesPerLid}
                    />
                  </div>
                </div>
              )}
              <RadioGroup
                className="mt-4 flex flex-col space-y-2"
                onValueChange={(v: 'separate' | 'cutoff') =>
                  setConfig((prev) => ({ ...prev, constructionMethod: v }))
                }
                value={config.constructionMethod}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem id="separate" value="separate" />
                  <Label htmlFor="separate">Peças Separadas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    disabled={!hasAnyLid}
                    id="cutoff"
                    value="cutoff"
                  />
                  <Label htmlFor="cutoff">Fatiar Case (Cut-off)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* NOVOS CONTROLES 3D */}
            <div className="space-y-4 rounded-lg border-border border-t bg-muted/20 p-4 pt-4">
              <h3 className="mb-3 font-semibold text-primary text-sm">
                Animações 3D
              </h3>
              {hasAnyLid && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Afastar Tampas</Label>
                    <Input
                      className="h-8 w-16 text-right"
                      onChange={(e) =>
                        handleNumberChange('lidOffset', e.target.value)
                      }
                      type="number"
                      value={config.lidOffset}
                    />
                  </div>
                  <Slider
                    max={600}
                    min={0}
                    onValueChange={([v]) =>
                      setConfig((prev) => ({ ...prev, lidOffset: v }))
                    }
                    step={10}
                    value={[config.lidOffset]}
                  />
                </div>
              )}
              {config.hasDrawer && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label>Abrir Gaveta</Label>
                    <Input
                      className="h-8 w-16 text-right"
                      onChange={(e) =>
                        handleNumberChange('drawerOffset', e.target.value)
                      }
                      type="number"
                      value={config.drawerOffset}
                    />
                  </div>
                  <Slider
                    max={config.depth}
                    min={0}
                    onValueChange={([v]) =>
                      setConfig((prev) => ({ ...prev, drawerOffset: v }))
                    }
                    step={10}
                    value={[config.drawerOffset]}
                  />
                </div>
              )}
              <div className="space-y-3 border-border border-t pt-2">
                <div className="flex items-center justify-between">
                  <Label>Vista Explodida (Madeira)</Label>
                  <Input
                    className="h-8 w-16 text-right"
                    onChange={(e) =>
                      handleNumberChange('explodeOffset', e.target.value)
                    }
                    type="number"
                    value={config.explodeOffset}
                  />
                </div>
                <Slider
                  max={150}
                  min={0}
                  onValueChange={([v]) =>
                    setConfig((prev) => ({ ...prev, explodeOffset: v }))
                  }
                  step={5}
                  value={[config.explodeOffset]}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent
            className="m-0 flex-1 space-y-6 overflow-y-auto p-6"
            value="parts"
          >
            <p className="mb-4 text-muted-foreground text-sm">
              Selecione as peças para destacá-las no modelo 3D ao lado.
            </p>
            <div>
              <h4 className="mb-3 border-border border-b pb-1 font-bold">
                Madeira
              </h4>
              <div className="space-y-2">
                {bom.woodCuts.map((cut) => (
                  <label
                    className="flex cursor-pointer items-center space-x-3"
                    key={cut.part}
                  >
                    <input
                      checked={highlighted.includes(cut.part)}
                      className="h-4 w-4 accent-primary"
                      onChange={() => toggleHighlight(cut.part)}
                      type="checkbox"
                    />
                    <span className="font-medium text-sm">{cut.part}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mt-6 mb-3 border-border border-b pb-1 font-bold">
                Alumínio
              </h4>
              <div className="space-y-2">
                {bom.aluminum.map((al) => (
                  <label
                    className="flex cursor-pointer items-center space-x-3"
                    key={al.profile}
                  >
                    <input
                      checked={highlighted.includes(al.profile)}
                      className="h-4 w-4 accent-primary"
                      onChange={() => toggleHighlight(al.profile)}
                      type="checkbox"
                    />
                    <span className="font-medium text-sm">{al.profile}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mt-6 mb-3 border-border border-b pb-1 font-bold">
                Ferragens
              </h4>
              <div className="space-y-2">
                {bom.hardware.map((hw) => (
                  <label
                    className="flex cursor-pointer items-center space-x-3"
                    key={hw.item}
                  >
                    <input
                      checked={highlighted.includes(hw.item)}
                      className="h-4 w-4 accent-primary"
                      onChange={() => toggleHighlight(hw.item)}
                      type="checkbox"
                    />
                    <span className="font-medium text-sm">{hw.item}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      <div className="min-w-0 flex-1">
        <Tabs className="w-full" defaultValue="3d">
          <div className="mb-6 flex items-center justify-between">
            <TabsList className="grid w-[450px] grid-cols-3">
              <TabsTrigger value="3d">Visualizador 3D</TabsTrigger>
              <TabsTrigger value="bom">Lista de Materiais</TabsTrigger>
              <TabsTrigger value="nesting">Plano de Corte</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" /> Salvar Projeto
              </Button>
              <label className="cursor-pointer">
                <div className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 font-medium text-sm hover:bg-accent">
                  <Upload className="mr-2 h-4 w-4" /> Abrir Projeto
                </div>
                <input
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                  type="file"
                />
              </label>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> PDF Oficina
              </Button>
            </div>
          </div>

          <TabsContent className="m-0" value="3d">
            <div className="h-175 max-h-[85vh] w-full">
              <CaseCanvas config={config} highlighted={highlighted} />
            </div>
          </TabsContent>

          <TabsContent className="m-0" value="bom">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Cortes e Materiais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <div>
                  <h3 className="mb-4 border-border border-b pb-2 font-bold text-lg">
                    Cortes de Madeira
                  </h3>
                  <ul className="space-y-3 text-sm">
                    {bom.woodCuts.map((cut, i) => (
                      <li
                        className="flex flex-col rounded-md border border-border bg-muted/30 p-3"
                        key={i.toString()}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {cut.qty}x {cut.part}
                          </span>
                          <span className="font-mono text-muted-foreground">
                            {cut.width.toFixed(1)} x {cut.height.toFixed(1)} mm
                          </span>
                        </div>
                        <span className="text-right text-muted-foreground/70 text-xs">
                          Espessura: {cut.thick}mm
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 border-border border-b pb-2 font-bold text-lg">
                    Ferragens e Alumínio
                  </h3>
                  <ul className="mb-6 space-y-3 text-sm">
                    {bom.aluminum.map((al, i) => (
                      <li
                        className="flex items-center justify-between rounded-md border bg-muted/30 p-3"
                        key={`al-${i.toString()}`}
                      >
                        <span className="font-medium">
                          {al.qty}x {al.profile}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {(al.lengthMm / 1000).toFixed(2)} m
                        </span>
                      </li>
                    ))}
                  </ul>
                  <ul className="space-y-3 text-sm">
                    {bom.hardware.map((hw, i) => (
                      <li
                        className="flex items-center justify-between rounded-md border bg-muted/30 p-3"
                        key={`hw-${i.toString()}`}
                      >
                        <span className="font-medium">{hw.item}</span>
                        <span className="font-mono text-muted-foreground">
                          {hw.qty} un
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NOVA TAB: PLANO DE CORTE (NESTING) */}
          <TabsContent className="m-0" value="nesting">
            {/* NOVO: TABELA DE CONFIGURAÇÃO DA CHAPA E CORTE */}
            <Card className="mb-6 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary">
                  Configurações de Corte e Chapa
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Ajuste o tamanho do material em estoque e a perda da serra
                  para recalcular o aproveitamento.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="font-bold">Largura da Chapa (mm)</Label>
                    <Input
                      className="bg-muted/50 font-mono"
                      onChange={(e) =>
                        handleNumberChange('sheetWidth', e.target.value)
                      }
                      type="number"
                      value={config.sheetWidth}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Altura da Chapa (mm)</Label>
                    <Input
                      className="bg-muted/50 font-mono"
                      onChange={(e) =>
                        handleNumberChange('sheetHeight', e.target.value)
                      }
                      type="number"
                      value={config.sheetHeight}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-amber-700">
                      Espessura do Disco (mm)
                    </Label>
                    <Input
                      className="border-amber-200 bg-amber-50 font-mono"
                      onChange={(e) =>
                        handleNumberChange('sawKerf', e.target.value)
                      }
                      title="Perda de material por cada passagem de serra (Saw Kerf)"
                      type="number"
                      value={config.sawKerf}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plano de Corte Otimizado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-10">
                {/* A CORREÇÃO ESTÁ AQUI: Trocado sheets.map por nestingSheets.map */}
                {nestingSheets.map((sheet, index) => {
                  const areaTotalChapa = config.sheetWidth * config.sheetHeight;
                  const aproveitamento = (
                    (sheet.usedArea / areaTotalChapa) *
                    100
                  ).toFixed(1);

                  return (
                    <div key={index}>
                      <div className='mb-2 flex items-center justify-between'>
                        <div>
                          <h3 className='inline-block font-bold text-lg'>
                            Chapa {index + 1}
                          </h3>
                          <span className='ml-2 font-normal text-muted-foreground text-sm'>
                            (Espessura: {sheet.thick}mm | {config.sheetWidth}x
                            {config.sheetHeight}mm)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className='hidden text-muted-foreground text-xs italic sm:inline-block'>
                            Duplo clique para girar
                          </span>
                          <span
                            className={`rounded px-3 py-1 font-mono text-sm ${Number(aproveitamento) > 75 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}
                          >
                            Aproveitamento Estimado: {aproveitamento}%
                          </span>
                        </div>
                      </div>

                      {/* O NOSSO COMPONENTE INTERATIVO */}
                      <NestingBoard
                        colorMap={colorMap}
                        items={sheet.items}
                        onChange={(newItems) =>
                          setNestingSheets((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, items: newItems } : s
                            )
                          )
                        }
                        sawKerf={config.sawKerf}
                        sheetHeight={config.sheetHeight}
                        sheetIndex={index}
                        sheetWidth={config.sheetWidth}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BOMPrint
        bom={bom}
        colorMap={colorMap}
        config={config}
        nestingSheets={nestingSheets}
        ref={printRef}
      />
    </div>
  );
}
