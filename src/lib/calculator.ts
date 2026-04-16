export interface CaseConfig {
  units: number;
  depth: number;
  thickness: number;
  hasFrontLid: boolean;
  hasBackLid: boolean;
  lidDepth: number;
  constructionMethod: 'separate' | 'cutoff';
  sawKerf: number;
  catchesPerLid: number;
  hasDrawer: boolean;
  drawerUnits: number;
  drawerThickness: number;
  lidOffset: number;
  drawerOffset: number;
}

export interface CalculatedBOM {
  woodCuts: { part: string; width: number; height: number; qty: number; thick?: number }[];
  aluminum: { profile: string; lengthMm: number; qty: number }[];
  hardware: { item: string; qty: number }[];
  aluminumTotals: { profile: string; totalMeters: number }[];
}

export function calculateHardcase(config: CaseConfig): CalculatedBOM {
  const U_MM = 44.45;
  const INTERNAL_WIDTH = 482.6;
  const internalHeight = config.units * U_MM;
  const externalWidth = INTERNAL_WIDTH + (config.thickness * 2);
  const externalHeight = internalHeight + (config.thickness * 2);

  let woodCuts = [];
  let lidsCount = (config.hasFrontLid ? 1 : 0) + (config.hasBackLid ? 1 : 0);

  // --- CORTES DE MADEIRA ---
  if (config.constructionMethod === 'cutoff') {
    const totalDepth = config.depth + (lidsCount * config.lidDepth) + (lidsCount * config.sawKerf);
    woodCuts = [
      { part: "Teto / Base (Peça Única)", width: externalWidth, height: totalDepth, qty: 2, thick: config.thickness },
      { part: "Laterais (Peça Única)", width: internalHeight, height: totalDepth, qty: 2, thick: config.thickness },
      { part: "Faces (Fundo/Tampas)", width: externalWidth, height: externalHeight, qty: lidsCount + (lidsCount === 1 ? 1 : 0), thick: config.thickness }
    ];
  } else {
    woodCuts = [
      { part: "Corpo: Teto / Base", width: externalWidth, height: config.depth, qty: 2, thick: config.thickness },
      { part: "Corpo: Laterais", width: internalHeight, height: config.depth, qty: 2, thick: config.thickness },
    ];
    if (lidsCount > 0) {
      woodCuts.push({ part: "Tampas: Faces", width: externalWidth, height: externalHeight, qty: lidsCount, thick: config.thickness });
      woodCuts.push({ part: "Tampas: Teto/Base", width: externalWidth, height: config.lidDepth, qty: lidsCount * 2, thick: config.thickness });
      woodCuts.push({ part: "Tampas: Laterais", width: internalHeight, height: config.lidDepth, qty: lidsCount * 2, thick: config.thickness });
    }
  }

  const drawerDepth = config.depth - 50; 
  if (config.hasDrawer) {
    const BOTTOM_CLEARANCE = 25;
    const dt = config.drawerThickness;
    const drawerTotalH = config.drawerUnits * U_MM;
    const drawerHeight = drawerTotalH - BOTTOM_CLEARANCE - dt; 
    const drawerWidth = INTERNAL_WIDTH - 26; 

    woodCuts.push(
      { part: "Gaveta: Teto (Cobertura)", width: INTERNAL_WIDTH, height: drawerDepth, qty: 1, thick: dt },
      { part: "Gaveta: Frente / Fundo", width: drawerWidth, height: drawerHeight, qty: 2, thick: dt },
      { part: "Gaveta: Laterais", width: drawerDepth - (dt*2), height: drawerHeight, qty: 2, thick: dt },
      { part: "Gaveta: Base", width: drawerWidth - (dt*2), height: drawerDepth - (dt*2), qty: 1, thick: dt }
    );
  }

  // --- ALUMÍNIO ---
  let aluminum = [];
  const railHeight = config.hasDrawer ? (config.units - config.drawerUnits) * U_MM : internalHeight;
  
  aluminum.push({ profile: "Trilho Rack Frontal", lengthMm: railHeight, qty: 2 });
  if (config.hasBackLid) {
    aluminum.push({ profile: "Trilho Rack Traseiro", lengthMm: railHeight, qty: 2 });
  }

  // Cantoneiras L e Mata-juntas (Arestas longitudinais)
  if (config.constructionMethod === 'cutoff') {
    const totalDepth = config.depth + (lidsCount * config.lidDepth) + (lidsCount * config.sawKerf);
    aluminum.push({ profile: "Cantoneira L (Mestra)", lengthMm: totalDepth, qty: 4 });
  } else {
    aluminum.push({ profile: "Cantoneira L (Corpo)", lengthMm: config.depth, qty: 4 });
    // Mata-juntas aplicados nas quinas onde não há cantoneiras ou para reforço interno
    aluminum.push({ profile: "Mata-junta Alumínio", lengthMm: config.depth, qty: 4 });
    if (lidsCount > 0) {
      aluminum.push({ profile: "Cantoneira L (Tampas)", lengthMm: config.lidDepth, qty: lidsCount * 4 });
    }
  }

  // Perfis de Encaixe Híbrido (Bocas)
  if (lidsCount > 0) {
    const perimeter = (externalWidth * 2) + (externalHeight * 2);
    aluminum.push({ profile: "Perfil Encaixe (Bocas)", lengthMm: perimeter, qty: lidsCount * 2 }); 
  }

  // --- FERRAGENS (CHECKLIST) ---
  // Correção da contagem: 8 cantos por caixa (Corpo + Tampas)
  // Mas se não há tampas, o corpo usa 8. Se há tampas, o corpo usa 0 na face da boca e 4 no fundo.
  let cornersQty = 0;
  if (lidsCount === 0) cornersQty = 8;
  if (lidsCount === 1) cornersQty = 12; // 4 corpo fundo + 8 tampa
  if (lidsCount === 2) cornersQty = 16; // 8 tampa frontal + 8 tampa traseira (corpo não usa cantos bola nas bocas híbridas)

  const hardware = [
    { item: "Canto Bola (Ball Corner)", qty: cornersQty },
    { item: "Fecho Borboleta", qty: lidsCount * config.catchesPerLid },
    { item: "Alça de Embutir", qty: config.units >= 6 ? 4 : 2 },
    { item: "Pés de Borracha", qty: 4 },
  ];

  if (config.hasDrawer) {
    hardware.push(
      { item: `Corrediça Telescópica ${(drawerDepth/10).toFixed(0)}cm`, qty: 1 }, 
      { item: "Puxador de Embutir (Gaveta)", qty: 1 }
    );
  }

  // --- TOTAIS CONSOLIDADOS PARA O PDF ---
  const totalsMap = new Map<string, number>();
  aluminum.forEach(item => {
    const current = totalsMap.get(item.profile) || 0;
    totalsMap.set(item.profile, current + (item.lengthMm * item.qty));
  });

  const aluminumTotals = Array.from(totalsMap.entries()).map(([profile, totalMm]) => ({
    profile,
    totalMeters: totalMm / 1000
  }));

  return { woodCuts, aluminum, hardware, aluminumTotals };
}