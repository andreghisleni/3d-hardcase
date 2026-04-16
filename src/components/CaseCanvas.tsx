import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import type { CaseConfig } from '@/lib/calculator';

interface CaseCanvasProps {
  config: CaseConfig;
}

const WOOD_COLOR = "#8b5a2b";
const DRAWER_WOOD = "#a0785a";
const ALUMINUM_COLOR = "#e0e0e0";
const METAL_PROPS = { metalness: 0.9, roughness: 0.2 };

const THICK = 0.025;
const MET_THICK = 0.002;
const EPS = 0.0005;

// --- COMPONENTES DE FERRAGEM ---

function BallCorner({ position }: { position: [number, number, number] }) {
  const adjPos = [position[0] + Math.sign(position[0]) * EPS, position[1] + Math.sign(position[1]) * EPS, position[2] + Math.sign(position[2]) * EPS];
  return (
    <mesh position={adjPos as [number, number, number]}>
      <sphereGeometry args={[0.026, 16, 16]} />
      <meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} />
    </mesh>
  );
}

function LBracket({ axis, len, pos, in1, in2 }: { axis: 'x' | 'y' | 'z', len: number, pos: [number, number, number], in1: number, in2: number }) {
  let ox = 0, oy = 0, oz = 0;
  if (axis === 'z') { ox = -in1 * EPS; oy = -in2 * EPS; }
  else if (axis === 'x') { oy = -in1 * EPS; oz = -in2 * EPS; }
  else { ox = -in1 * EPS; oz = -in2 * EPS; }
  const adjPos = [pos[0] + ox, pos[1] + oy, pos[2] + oz];

  let p1, s1, p2, s2;
  if (axis === 'z') {
    p1 = [in1 * THICK / 2, in2 * MET_THICK / 2, 0]; s1 = [THICK, MET_THICK, len];
    p2 = [in1 * MET_THICK / 2, in2 * THICK / 2, 0]; s2 = [MET_THICK, THICK, len];
  } else if (axis === 'x') {
    p1 = [0, in1 * THICK / 2, in2 * MET_THICK / 2]; s1 = [len, THICK, MET_THICK];
    p2 = [0, in1 * MET_THICK / 2, in2 * THICK / 2]; s2 = [len, MET_THICK, THICK];
  } else {
    p1 = [in1 * THICK / 2, 0, in2 * MET_THICK / 2]; s1 = [THICK, len, MET_THICK];
    p2 = [in1 * MET_THICK / 2, 0, in2 * THICK / 2]; s2 = [MET_THICK, len, THICK];
  }
  return (
    <group position={adjPos as [number, number, number]}>
      <mesh position={p1 as any}><boxGeometry args={s1 as any} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
      <mesh position={p2 as any}><boxGeometry args={s2 as any} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
    </group>
  );
}

function HybridFrame({ w, h, zPos }: { w: number, h: number, zPos: number }) {
  const rimThick = 0.008, rimDepth = 0.022;
  const aw = w + (EPS * 2), ah = h + (EPS * 2);
  return (
    <group position={[0, 0, zPos + Math.sign(zPos) * EPS]}>
      <mesh position={[0, ah / 2 - rimDepth / 2, 0]}><boxGeometry args={[aw, rimDepth, rimThick]} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
      <mesh position={[0, -ah / 2 + rimDepth / 2, 0]}><boxGeometry args={[aw, rimDepth, rimThick]} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
      <mesh position={[aw / 2 - rimDepth / 2, 0, 0]}><boxGeometry args={[rimDepth, ah - 2 * rimDepth, rimThick]} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
      <mesh position={[-aw / 2 + rimDepth / 2, 0, 0]}><boxGeometry args={[rimDepth, ah - 2 * rimDepth, rimThick]} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
    </group>
  )
}

function Handle({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) {
  const adjPos = [position[0] + Math.sign(position[0]) * EPS, position[1], position[2]];
  return (
    <group position={adjPos as [number, number, number]} rotation={rotation}>
      <mesh><boxGeometry args={[0.015, 0.12, 0.16]} /><meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} /></mesh>
      <mesh position={[0.008, 0, 0]}><cylinderGeometry args={[0.008, 0.008, 0.1]} /><meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} /></mesh>
    </group>
  );
}

function LatchHalf({ position }: { position: [number, number, number] }) {
  const adjPos = [position[0] + Math.sign(position[0]) * EPS, position[1], position[2] + Math.sign(position[2]) * EPS];
  return (
    <mesh position={adjPos as [number, number, number]}>
      <boxGeometry args={[0.012, 0.08, 0.04]} />
      <meshStandardMaterial color={ALUMINUM_COLOR} {...METAL_PROPS} />
    </mesh>
  );
}

// Trilho aceita altura e posição variável agora
function RackRail({ h, pos, isLeft, isFront }: { h: number, pos: [number, number, number], isLeft: boolean, isFront: boolean }) {
  const w = 0.016, d = 0.016, th = 0.002;
  const dirX = isLeft ? 1 : -1, dirZ = isFront ? -1 : 1;
  return (
    <group position={pos}>
      <mesh position={[dirX * th / 2, 0, dirZ * d / 2]}><boxGeometry args={[th, h, d]} /><meshStandardMaterial color="#222" metalness={0.6} roughness={0.5} /></mesh>
      <mesh position={[dirX * w / 2, 0, dirZ * th / 2]}><boxGeometry args={[w, h, th]} /><meshStandardMaterial color="#222" metalness={0.6} roughness={0.5} /></mesh>
    </group>
  )
}

// --- GAVETA ENGENHARIA COMPLETA ---
function RackDrawer({ units, dt, internalH, internalW, caseD, drawerOffsetZ }: { units: number, dt: number, internalH: number, internalW: number, caseD: number, drawerOffsetZ: number }) {
  const U_MM = 0.04445;
  const drawerTotalH = units * U_MM;
  const bottomClearance = 0.025; // 25mm do chão para passar a boca

  const d = caseD - 0.05;
  const slideW = 0.013; // 13mm de corrediça exatos
  const w = internalW - (slideW * 2); // O Vão da Gaveta de madeira

  // Altura da gaveta desconta o chão e o teto
  const h = drawerTotalH - bottomClearance - dt;

  const allocBaseY = -internalH / 2;
  const boxCenterY = allocBaseY + bottomClearance + h / 2;
  const coverCenterY = allocBaseY + drawerTotalH - dt / 2;

  const railRecess = 0.025;
  const baseZ = caseD / 2 - railRecess - d / 2;

  return (
    <group>
      {/* TETO DA GAVETA (Fixa no case) */}
      <mesh position={[0, coverCenterY, baseZ]} castShadow>
        <boxGeometry args={[internalW, dt, d]} />
        <meshStandardMaterial color={DRAWER_WOOD} roughness={0.6} />
      </mesh>

      {/* PARTE MÓVEL (Gaveta + Corrediças + Puxador) */}
      <group position={[0, boxCenterY, baseZ + drawerOffsetZ]}>

        {/* Caixa de Madeira */}
        <mesh position={[0, 0, d / 2 - dt / 2]} castShadow><boxGeometry args={[w, h, dt]} /><meshStandardMaterial color={DRAWER_WOOD} roughness={0.6} /></mesh>
        <mesh position={[0, 0, -d / 2 + dt / 2]} castShadow><boxGeometry args={[w, h, dt]} /><meshStandardMaterial color={DRAWER_WOOD} roughness={0.6} /></mesh>
        <mesh position={[-w / 2 + dt / 2, 0, 0]} castShadow><boxGeometry args={[dt, h, d - 2 * dt]} /><meshStandardMaterial color={DRAWER_WOOD} roughness={0.6} /></mesh>
        <mesh position={[w / 2 - dt / 2, 0, 0]} castShadow><boxGeometry args={[dt, h, d - 2 * dt]} /><meshStandardMaterial color={DRAWER_WOOD} roughness={0.6} /></mesh>
        <mesh position={[0, -h / 2 + dt / 2, 0]} castShadow><boxGeometry args={[w - 2 * dt, dt, d - 2 * dt]} /><meshStandardMaterial color={DRAWER_WOOD} roughness={0.6} /></mesh>

        {/* Corrediças Telescópicas (13mm de largura) */}
        {/* Esquerda */}
        <mesh position={[-w / 2 - slideW / 2, 0, 0]}>
          <boxGeometry args={[slideW, h * 0.4, d]} />
          <meshStandardMaterial color="#a0a0a0" metalness={1} roughness={0.3} />
        </mesh>
        {/* Direita */}
        <mesh position={[w / 2 + slideW / 2, 0, 0]}>
          <boxGeometry args={[slideW, h * 0.4, d]} />
          <meshStandardMaterial color="#a0a0a0" metalness={1} roughness={0.3} />
        </mesh>

        {/* Puxador de Embutir Frontal */}
        <mesh position={[0, 0, d / 2 + 0.005]}>
          <boxGeometry args={[0.08, 0.02, 0.01]} />
          <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// --- CONSTRUTORES DO ALUMÍNIO ---

function BodyAluminum({ w, h, d, hasFront, hasBack }: { w: number, h: number, d: number, hasFront: boolean, hasBack: boolean }) {
  return (
    <group>
      <LBracket axis='z' len={d} pos={[w / 2, h / 2, 0]} in1={-1} in2={-1} />
      <LBracket axis='z' len={d} pos={[-w / 2, h / 2, 0]} in1={1} in2={-1} />
      <LBracket axis='z' len={d} pos={[-w / 2, -h / 2, 0]} in1={1} in2={1} />
      <LBracket axis='z' len={d} pos={[w / 2, -h / 2, 0]} in1={-1} in2={1} />

      {hasFront ? <HybridFrame w={w} h={h} zPos={d / 2} /> : (
        <group>
          <LBracket axis='x' len={w} pos={[0, h / 2, d / 2]} in1={-1} in2={-1} />
          <LBracket axis='x' len={w} pos={[0, -h / 2, d / 2]} in1={1} in2={-1} />
          <LBracket axis='y' len={h} pos={[w / 2, 0, d / 2]} in1={-1} in2={-1} />
          <LBracket axis='y' len={h} pos={[-w / 2, 0, d / 2]} in1={1} in2={-1} />
        </group>
      )}

      {hasBack ? <HybridFrame w={w} h={h} zPos={-d / 2} /> : (
        <group>
          <LBracket axis='x' len={w} pos={[0, h / 2, -d / 2]} in1={-1} in2={1} />
          <LBracket axis='x' len={w} pos={[0, -h / 2, -d / 2]} in1={1} in2={1} />
          <LBracket axis='y' len={h} pos={[w / 2, 0, -d / 2]} in1={-1} in2={1} />
          <LBracket axis='y' len={h} pos={[-w / 2, 0, -d / 2]} in1={1} in2={1} />
        </group>
      )}
    </group>
  )
}

function LidAluminum({ w, h, ld, isFront }: { w: number, h: number, ld: number, isFront: boolean }) {
  return (
    <group>
      <LBracket axis='z' len={ld} pos={[w / 2, h / 2, 0]} in1={-1} in2={-1} />
      <LBracket axis='z' len={ld} pos={[-w / 2, h / 2, 0]} in1={1} in2={-1} />
      <LBracket axis='z' len={ld} pos={[-w / 2, -h / 2, 0]} in1={1} in2={1} />
      <LBracket axis='z' len={ld} pos={[w / 2, -h / 2, 0]} in1={-1} in2={1} />

      {isFront ? (
        <group>
          <LBracket axis='x' len={w} pos={[0, h / 2, ld / 2]} in1={-1} in2={-1} />
          <LBracket axis='x' len={w} pos={[0, -h / 2, ld / 2]} in1={1} in2={-1} />
          <LBracket axis='y' len={h} pos={[w / 2, 0, ld / 2]} in1={-1} in2={-1} />
          <LBracket axis='y' len={h} pos={[-w / 2, 0, ld / 2]} in1={1} in2={-1} />
        </group>
      ) : (
        <group>
          <LBracket axis='x' len={w} pos={[0, h / 2, -ld / 2]} in1={-1} in2={1} />
          <LBracket axis='x' len={w} pos={[0, -h / 2, -ld / 2]} in1={1} in2={1} />
          <LBracket axis='y' len={h} pos={[w / 2, 0, -ld / 2]} in1={-1} in2={1} />
          <LBracket axis='y' len={h} pos={[-w / 2, 0, -ld / 2]} in1={1} in2={1} />
        </group>
      )}
      <HybridFrame w={w} h={h} zPos={isFront ? -ld / 2 : ld / 2} />
    </group>
  )
}

// --- ESTRUTURA PRINCIPAL ---

export function CaseCanvas({ config }: CaseCanvasProps) {
  const scale = 0.001;
  const U_MM = 44.45;
  const INTERNAL_WIDTH = 482.6;

  const internalH = config.units * U_MM * scale;
  const internalW = INTERNAL_WIDTH * scale;
  const h = internalH + (config.thickness * 2 * scale);
  const w = internalW + (config.thickness * 2 * scale);
  const d = config.depth * scale;
  const ld = config.lidDepth * scale;
  const t = config.thickness * scale;

  const railRecess = 0.025;
  const latchYPositions = config.catchesPerLid === 2 ? [0] : [h / 4, -h / 4];

  const LID_OFFSET = config.lidOffset * scale;
  const DRAWER_OFFSET = config.drawerOffset * scale;

  // Lógica da altura do trilho (agora dinâmico)
  const drawerH = config.hasDrawer ? (config.drawerUnits * U_MM * scale) : 0;
  const railH = internalH - drawerH;
  // O trilho começa do topo da gaveta para cima
  const railPosY = -internalH / 2 + drawerH + railH / 2;

  const WoodMesh = ({ args, pos }: any) => (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={WOOD_COLOR} roughness={0.6} />
    </mesh>
  );

  return (
    <div className="w-full h-full bg-[#f0f0f0] rounded-xl overflow-hidden border border-border relative">
      <Canvas shadows camera={{ position: [1.3, 0.9, 1.3], fov: 40 }}>
        <color attach="background" args={['#e0e0e0']} />
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 10]} intensity={2.5} castShadow />
        <directionalLight position={[-5, 0, 10]} intensity={1.5} />
        <directionalLight position={[0, -5, -5]} intensity={1} />
        <Environment preset="city" />

        <group position={[0, h / 2, 0]}>

          <group>
            <WoodMesh args={[w, t, d]} pos={[0, h / 2 - t / 2, 0]} />
            <WoodMesh args={[w, t, d]} pos={[0, -h / 2 + t / 2, 0]} />
            <WoodMesh args={[t, h - 2 * t, d]} pos={[-w / 2 + t / 2, 0, 0]} />
            <WoodMesh args={[t, h - 2 * t, d]} pos={[w / 2 - t / 2, 0, 0]} />
            {!config.hasBackLid && <WoodMesh args={[w - 2 * t, h - 2 * t, t]} pos={[0, 0, -d / 2 + t / 2]} />}
            {!config.hasFrontLid && <WoodMesh args={[w - 2 * t, h - 2 * t, t]} pos={[0, 0, d / 2 - t / 2]} />}
            <BodyAluminum w={w} h={h} d={d} hasFront={config.hasFrontLid} hasBack={config.hasBackLid} />
          </group>

          {/* Trilhos encurtados */}
          {railH > 0 && (
            <>
              <RackRail h={railH} pos={[-internalW / 2, railPosY, d / 2 - railRecess]} isLeft={true} isFront={true} />
              <RackRail h={railH} pos={[internalW / 2, railPosY, d / 2 - railRecess]} isLeft={false} isFront={true} />
              {config.hasBackLid && (
                <>
                  <RackRail h={railH} pos={[-internalW / 2, railPosY, -d / 2 + railRecess]} isLeft={true} isFront={false} />
                  <RackRail h={railH} pos={[internalW / 2, railPosY, -d / 2 + railRecess]} isLeft={false} isFront={false} />
                </>
              )}
            </>
          )}

          {config.hasDrawer && (
            <RackDrawer
              units={config.drawerUnits}
              dt={config.drawerThickness * scale}
              internalH={internalH}
              internalW={internalW}
              caseD={d}
              drawerOffsetZ={DRAWER_OFFSET}
            />
          )}

          {[[1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]].map((p, i) => (
            <BallCorner key={`body-corner-${i}`} position={[p[0] * w / 2, p[1] * h / 2, p[2] * d / 2]} />
          ))}
          <Handle position={[w / 2 + 0.005, 0, 0]} />
          <Handle position={[-w / 2 - 0.005, 0, 0]} rotation={[0, Math.PI, 0]} />
          {config.hasFrontLid && latchYPositions.map((y, i) => (
            <group key={`front-latch-b-${i}`}>
              <LatchHalf position={[w / 2 + 0.006, y, d / 2 - 0.02]} />
              <LatchHalf position={[-w / 2 - 0.006, y, d / 2 - 0.02]} />
            </group>
          ))}
          {config.hasBackLid && latchYPositions.map((y, i) => (
            <group key={`back-latch-b-${i}`}>
              <LatchHalf position={[w / 2 + 0.006, y, -d / 2 + 0.02]} />
              <LatchHalf position={[-w / 2 - 0.006, y, -d / 2 + 0.02]} />
            </group>
          ))}

          {config.hasFrontLid && (
            <group position={[0, 0, d / 2 + ld / 2 + LID_OFFSET]}>
              <WoodMesh args={[w, t, ld]} pos={[0, h / 2 - t / 2, 0]} />
              <WoodMesh args={[w, t, ld]} pos={[0, -h / 2 + t / 2, 0]} />
              <WoodMesh args={[t, h - 2 * t, ld]} pos={[-w / 2 + t / 2, 0, 0]} />
              <WoodMesh args={[t, h - 2 * t, ld]} pos={[w / 2 - t / 2, 0, 0]} />
              <WoodMesh args={[w - 2 * t, h - 2 * t, t]} pos={[0, 0, ld / 2 - t / 2]} />
              <LidAluminum w={w} h={h} ld={ld} isFront={true} />
              {[[1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1]].map((p, i) => <BallCorner key={`fl-corner-${i}`} position={[p[0] * w / 2, p[1] * h / 2, p[2] * ld / 2]} />)}
              {latchYPositions.map((y, i) => (
                <group key={`front-latch-lid-${i}`}>
                  <LatchHalf position={[w / 2 + 0.006, y, -ld / 2 + 0.02]} />
                  <LatchHalf position={[-w / 2 - 0.006, y, -ld / 2 + 0.02]} />
                </group>
              ))}
            </group>
          )}

          {config.hasBackLid && (
            <group position={[0, 0, -(d / 2 + ld / 2 + LID_OFFSET)]}>
              <WoodMesh args={[w, t, ld]} pos={[0, h / 2 - t / 2, 0]} />
              <WoodMesh args={[w, t, ld]} pos={[0, -h / 2 + t / 2, 0]} />
              <WoodMesh args={[t, h - 2 * t, ld]} pos={[-w / 2 + t / 2, 0, 0]} />
              <WoodMesh args={[t, h - 2 * t, ld]} pos={[w / 2 - t / 2, 0, 0]} />
              <WoodMesh args={[w - 2 * t, h - 2 * t, t]} pos={[0, 0, -ld / 2 + t / 2]} />
              <LidAluminum w={w} h={h} ld={ld} isFront={false} />
              {[[1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]].map((p, i) => <BallCorner key={`bl-corner-${i}`} position={[p[0] * w / 2, p[1] * h / 2, p[2] * ld / 2]} />)}
              {latchYPositions.map((y, i) => (
                <group key={`back-latch-lid-${i}`}>
                  <LatchHalf position={[w / 2 + 0.006, y, ld / 2 - 0.02]} />
                  <LatchHalf position={[-w / 2 - 0.006, y, ld / 2 - 0.02]} />
                </group>
              ))}
            </group>
          )}
        </group>

        <OrbitControls makeDefault />
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}