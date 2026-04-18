import {
  Billboard,
  ContactShadows,
  Environment,
  Line,
  OrbitControls,
  Text,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { CaseConfig } from '@/lib/calculator';

interface CaseCanvasProps {
  config: CaseConfig;
  highlighted?: string[];
}

const WOOD_COLOR = '#8b5a2b';
const DRAWER_WOOD = '#a0785a';
const ALUMINUM_COLOR = '#e0e0e0';
const METAL_PROPS = { metalness: 0.9, roughness: 0.2 };
const MATA_JUNTA_COLOR = '#9ba3a8';
const MATA_JUNTA_PROPS = { metalness: 0.7, roughness: 0.5 };

const HL_WOOD = '#fcd34d';
const HL_METAL = '#60a5fa';
const COTA_COLOR = '#dc2626'; // Vermelho técnico para as cotas

const THICK = 0.025;
const MET_THICK = 0.002;
const EPS = 0.0005;

function getCol(baseColor: string, hlColor: string, isHighlighted: boolean) {
  return isHighlighted ? hlColor : baseColor;
}

// --- NOVO: COMPONENTE DE COTA 3D (DIMENSION LINE) ---
function Cota3D({
  start,
  end,
  label,
  offset,
}: {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset: [number, number, number];
}) {
  const p1 = [start[0] + offset[0], start[1] + offset[1], start[2] + offset[2]];
  const p2 = [end[0] + offset[0], end[1] + offset[1], end[2] + offset[2]];
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];

  return (
    <group>
      {/* Linha principal da cota */}
      <Line color={COTA_COLOR} lineWidth={2} points={[p1 as any, p2 as any]} />

      {/* Linhas de chamada (tracejadas/transparentes até ao objeto) */}
      <Line
        color={COTA_COLOR}
        lineWidth={1}
        opacity={0.3}
        points={[start as any, p1 as any]}
        transparent
      />
      <Line
        color={COTA_COLOR}
        lineWidth={1}
        opacity={0.3}
        points={[end as any, p2 as any]}
        transparent
      />

      {/* Pontos nas extremidades */}
      <mesh position={p1 as any}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color={COTA_COLOR} />
      </mesh>
      <mesh position={p2 as any}>
        <sphereGeometry args={[0.004, 8, 8]} />
        <meshBasicMaterial color={COTA_COLOR} />
      </mesh>

      {/* Texto sempre virado para a câmara */}
      <Billboard position={mid as any}>
        <Text
          color={COTA_COLOR}
          fontSize={0.035}
          fontWeight="bold"
          outlineColor="#ffffff"
          outlineWidth={0.005}
          position={[0, 0.02, 0]}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

function BallCorner({
  position,
  hl,
  exp = 0,
}: {
  position: [number, number, number];
  hl: boolean;
  exp?: number;
}) {
  const adjPos = [
    position[0] + Math.sign(position[0]) * (EPS + exp),
    position[1] + Math.sign(position[1]) * (EPS + exp),
    position[2] + Math.sign(position[2]) * (EPS + exp),
  ];
  return (
    <mesh position={adjPos as [number, number, number]}>
      <sphereGeometry args={[0.026, 16, 16]} />
      <meshStandardMaterial
        color={getCol(ALUMINUM_COLOR, HL_METAL, hl)}
        {...METAL_PROPS}
        emissive={hl ? HL_METAL : '#000'}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function LBracket({
  axis,
  len,
  pos,
  in1,
  in2,
  hl,
  exp = 0,
}: {
  axis: 'x' | 'y' | 'z';
  len: number;
  pos: [number, number, number];
  in1: number;
  in2: number;
  hl: boolean;
  exp?: number;
}) {
  let ox = 0,
    oy = 0,
    oz = 0;
  if (axis === 'z') {
    ox = -in1 * (EPS + exp);
    oy = -in2 * (EPS + exp);
  } else if (axis === 'x') {
    oy = -in1 * (EPS + exp);
    oz = -in2 * (EPS + exp);
  } else {
    ox = -in1 * (EPS + exp);
    oz = -in2 * (EPS + exp);
  }
  const adjPos = [pos[0] + ox, pos[1] + oy, pos[2] + oz];

  let p1, s1, p2, s2;
  if (axis === 'z') {
    p1 = [(in1 * THICK) / 2, (in2 * MET_THICK) / 2, 0];
    s1 = [THICK, MET_THICK, len];
    p2 = [(in1 * MET_THICK) / 2, (in2 * THICK) / 2, 0];
    s2 = [MET_THICK, THICK, len];
  } else if (axis === 'x') {
    p1 = [0, (in1 * THICK) / 2, (in2 * MET_THICK) / 2];
    s1 = [len, THICK, MET_THICK];
    p2 = [0, (in1 * MET_THICK) / 2, (in2 * THICK) / 2];
    s2 = [len, MET_THICK, THICK];
  } else {
    p1 = [(in1 * THICK) / 2, 0, (in2 * MET_THICK) / 2];
    s1 = [THICK, len, MET_THICK];
    p2 = [(in1 * MET_THICK) / 2, 0, (in2 * THICK) / 2];
    s2 = [MET_THICK, len, THICK];
  }

  return (
    <group position={adjPos as [number, number, number]}>
      <mesh position={p1 as any}>
        <boxGeometry args={s1 as any} />
        <meshStandardMaterial
          color={getCol(ALUMINUM_COLOR, HL_METAL, hl)}
          {...METAL_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={p2 as any}>
        <boxGeometry args={s2 as any} />
        <meshStandardMaterial
          color={getCol(ALUMINUM_COLOR, HL_METAL, hl)}
          {...METAL_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function MataJunta({
  pos,
  qX,
  qY,
  dirZ,
  hl,
  exp = 0,
}: {
  pos: [number, number, number];
  qX: number;
  qY: number;
  dirZ: number;
  hl: boolean;
  exp?: number;
}) {
  const legZ = 0.045,
    thick = 0.032,
    mThick = 0.003,
    eps = EPS * 4;
  const px = pos[0] + qX * (eps + exp);
  const py = pos[1] + qY * (eps + exp);
  const pz = pos[2] + dirZ * exp;
  const inX = -qX,
    inY = -qY;
  const col = getCol(MATA_JUNTA_COLOR, HL_METAL, hl);

  return (
    <group>
      <mesh position={[px, py + (inY * thick) / 2, pz + (dirZ * legZ) / 2]}>
        <boxGeometry args={[mThick, thick, legZ]} />
        <meshStandardMaterial
          color={col}
          {...MATA_JUNTA_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[px + (inX * thick) / 2, py, pz + (dirZ * legZ) / 2]}>
        <boxGeometry args={[thick, mThick, legZ]} />
        <meshStandardMaterial
          color={col}
          {...MATA_JUNTA_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[px + (inX * thick) / 2, py + (inY * thick) / 2, pz]}>
        <boxGeometry args={[thick, thick, mThick]} />
        <meshStandardMaterial
          color={col}
          {...MATA_JUNTA_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function PerfilHibridoMachoFemea({
  w,
  h,
  zPos,
  invert = false,
  hl,
  exp = 0,
}: {
  w: number;
  h: number;
  zPos: number;
  invert?: boolean;
  hl: boolean;
  exp?: number;
}) {
  const rimThick = 0.008,
    rimDepth = 0.022;
  const aw = w + EPS * 2,
    ah = h + EPS * 2;
  const dirZ = Math.sign(zPos);
  const zOffset = dirZ * (EPS + exp);
  const ridgeThick = 0.004,
    ridgeW = rimDepth / 2 - 0.002;
  const offsetMacho = invert ? ridgeW / 2 : -ridgeW / 2;
  const col = getCol(ALUMINUM_COLOR, HL_METAL, hl);

  return (
    <group position={[0, 0, zPos + zOffset]}>
      <mesh position={[0, ah / 2 - rimDepth / 2 + exp, 0]}>
        <boxGeometry args={[aw, rimDepth, rimThick]} />
        <meshStandardMaterial
          color={col}
          {...METAL_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, -ah / 2 + rimDepth / 2 - exp, 0]}>
        <boxGeometry args={[aw, rimDepth, rimThick]} />
        <meshStandardMaterial
          color={col}
          {...METAL_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[aw / 2 - rimDepth / 2 + exp, 0, 0]}>
        <boxGeometry args={[rimDepth, ah - 2 * rimDepth, rimThick]} />
        <meshStandardMaterial
          color={col}
          {...METAL_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[-aw / 2 + rimDepth / 2 - exp, 0, 0]}>
        <boxGeometry args={[rimDepth, ah - 2 * rimDepth, rimThick]} />
        <meshStandardMaterial
          color={col}
          {...METAL_PROPS}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh
        position={[
          0,
          ah / 2 - rimDepth / 2 + offsetMacho + exp,
          dirZ * (rimThick / 2 + ridgeThick / 2),
        ]}
      >
        <boxGeometry args={[aw, ridgeW, ridgeThick]} />
        <meshStandardMaterial color={col} {...METAL_PROPS} />
      </mesh>
      <mesh
        position={[
          0,
          -ah / 2 + rimDepth / 2 - offsetMacho - exp,
          dirZ * (rimThick / 2 + ridgeThick / 2),
        ]}
      >
        <boxGeometry args={[aw, ridgeW, ridgeThick]} />
        <meshStandardMaterial color={col} {...METAL_PROPS} />
      </mesh>
      <mesh
        position={[
          aw / 2 - rimDepth / 2 + offsetMacho + exp,
          0,
          dirZ * (rimThick / 2 + ridgeThick / 2),
        ]}
      >
        <boxGeometry args={[ridgeW, ah - 2 * rimDepth, ridgeThick]} />
        <meshStandardMaterial color={col} {...METAL_PROPS} />
      </mesh>
      <mesh
        position={[
          -aw / 2 + rimDepth / 2 - offsetMacho - exp,
          0,
          dirZ * (rimThick / 2 + ridgeThick / 2),
        ]}
      >
        <boxGeometry args={[ridgeW, ah - 2 * rimDepth, ridgeThick]} />
        <meshStandardMaterial color={col} {...METAL_PROPS} />
      </mesh>
    </group>
  );
}

function Handle({
  position,
  rotation = [0, 0, 0],
  hl,
  exp = 0,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  hl: boolean;
  exp?: number;
}) {
  const adjPos = [
    position[0] + Math.sign(position[0]) * (EPS + exp),
    position[1],
    position[2],
  ];
  return (
    <group position={adjPos as [number, number, number]} rotation={rotation}>
      <mesh>
        <boxGeometry args={[0.015, 0.12, 0.16]} />
        <meshStandardMaterial
          color={hl ? HL_METAL : '#1a1a1a'}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0.008, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1]} />
        <meshStandardMaterial
          color={getCol(ALUMINUM_COLOR, HL_METAL, hl)}
          {...METAL_PROPS}
        />
      </mesh>
    </group>
  );
}

function LatchHalf({
  position,
  hl,
  exp = 0,
}: {
  position: [number, number, number];
  hl: boolean;
  exp?: number;
}) {
  const adjPos = [
    position[0] + Math.sign(position[0]) * (EPS + exp),
    position[1],
    position[2] + Math.sign(position[2]) * (EPS + exp),
  ];
  return (
    <mesh position={adjPos as [number, number, number]}>
      <boxGeometry args={[0.012, 0.08, 0.04]} />
      <meshStandardMaterial
        color={getCol(ALUMINUM_COLOR, HL_METAL, hl)}
        {...METAL_PROPS}
        emissive={hl ? HL_METAL : '#000'}
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function RackRail({
  h,
  pos,
  isLeft,
  isFront,
  hl,
  exp = 0,
}: {
  h: number;
  pos: [number, number, number];
  isLeft: boolean;
  isFront: boolean;
  hl: boolean;
  exp?: number;
}) {
  const w = 0.016,
    d = 0.016,
    th = 0.002;
  const dirX = isLeft ? 1 : -1,
    dirZ = isFront ? -1 : 1;
  const col = getCol('#222', HL_METAL, hl);
  const adjPos = [pos[0] + dirX * exp, pos[1], pos[2]];
  return (
    <group position={adjPos as [number, number, number]}>
      <mesh position={[(dirX * th) / 2, 0, (dirZ * d) / 2]}>
        <boxGeometry args={[th, h, d]} />
        <meshStandardMaterial
          color={col}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
          metalness={0.6}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[(dirX * w) / 2, 0, (dirZ * th) / 2]}>
        <boxGeometry args={[w, h, th]} />
        <meshStandardMaterial
          color={col}
          emissive={hl ? HL_METAL : '#000'}
          emissiveIntensity={0.2}
          metalness={0.6}
          roughness={0.5}
        />
      </mesh>
    </group>
  );
}

export function CaseCanvas({ config, highlighted = [] }: CaseCanvasProps) {
  const scale = 0.001;
  const U_MM = 44.45;
  const INTERNAL_WIDTH = 482.6;

  const internalH = config.units * U_MM * scale;
  const internalW = INTERNAL_WIDTH * scale;
  const h = internalH + config.thickness * 2 * scale;
  const w = internalW + config.thickness * 2 * scale;
  const d = config.depth * scale;
  const ld = config.lidDepth * scale;
  const t = config.thickness * scale;

  const railRecess = 0.025;
  const latchYPositions = config.catchesPerLid === 2 ? [0] : [h / 4, -h / 4];
  const LID_OFFSET = config.lidOffset * scale;
  const DRAWER_OFFSET = config.drawerOffset * scale;
  const EXP = config.explodeOffset * scale;

  const drawerH = config.hasDrawer ? config.drawerUnits * U_MM * scale : 0;
  const railH = internalH - drawerH;
  const railPosY = -internalH / 2 + drawerH + railH / 2;

  const hlWoodBodyTB =
    highlighted.includes('Teto / Base (Peça Única)') ||
    highlighted.includes('Corpo: Teto / Base');
  const hlWoodBodySides =
    highlighted.includes('Laterais (Peça Única)') ||
    highlighted.includes('Corpo: Laterais');
  const hlWoodLidTB =
    highlighted.includes('Teto / Base (Peça Única)') ||
    highlighted.includes('Tampas: Teto/Base');
  const hlWoodLidSides =
    highlighted.includes('Laterais (Peça Única)') ||
    highlighted.includes('Tampas: Laterais');
  const hlWoodFaces =
    highlighted.includes('Faces (Fundo/Tampas)') ||
    highlighted.includes('Tampas: Faces');

  const hlDrwCover = highlighted.includes('Gaveta: Teto (Cobertura)');
  const hlDrwFrontBack = highlighted.includes('Gaveta: Frente / Fundo');
  const hlDrwSides = highlighted.includes('Gaveta: Laterais');
  const hlDrwBase = highlighted.includes('Gaveta: Base');

  const hlLAngleBody =
    highlighted.includes('Cantoneira L (Corpo)') ||
    highlighted.includes('Cantoneira L (Mestra)');
  const hlLAngleLid =
    highlighted.includes('Cantoneira L (Tampas)') ||
    highlighted.includes('Cantoneira L (Mestra)');
  const hlProfile = highlighted.includes('Perfil Encaixe (Bocas)');
  const hlMataJunta = highlighted.includes('Mata-junta (Acabamento Aço)');
  const hlRailFront = highlighted.includes('Trilho Rack Frontal');
  const hlRailBack = highlighted.includes('Trilho Rack Traseiro');
  const hlCorners = highlighted.includes('Canto Bola (Ball Corner)');
  const hlCatches = highlighted.includes('Fecho Borboleta');
  const hlHandles = highlighted.includes('Alça de Embutir');
  const hlDrawerSlides = highlighted.some((p) => p.includes('Corrediça'));

  const WoodMesh = ({ args, pos, hl }: any) => (
    <mesh castShadow position={pos} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={getCol(WOOD_COLOR, HL_WOOD, hl)}
        emissive={hl ? HL_WOOD : '#000'}
        emissiveIntensity={0.1}
        roughness={0.6}
      />
    </mesh>
  );

  const DrawerWoodMesh = ({ args, pos, hl }: any) => (
    <mesh castShadow position={pos} receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={getCol(DRAWER_WOOD, HL_WOOD, hl)}
        emissive={hl ? HL_WOOD : '#000'}
        emissiveIntensity={0.1}
        roughness={0.6}
      />
    </mesh>
  );

  const bodyCorners: [number, number, number][] = [];
  if (!config.hasFrontLid)
    bodyCorners.push([1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1]);
  if (!config.hasBackLid)
    bodyCorners.push([1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-[#f0f0f0]">
      <Canvas camera={{ position: [1.3, 0.9, 1.3], fov: 45 }} shadows>
        <color args={['#e0e0e0']} attach="background" />
        <ambientLight intensity={1.5} />
        <directionalLight castShadow intensity={2.5} position={[5, 10, 10]} />
        <directionalLight intensity={1.5} position={[-5, 0, 10]} />
        <directionalLight intensity={1} position={[0, -5, -5]} />
        <Environment preset="city" />

        <group position={[0, h / 2, 0]}>
          {/* AS COTAS PRINCIPAIS */}
          <group name="DimensionLines">
            {/* Altura Interna (U) - Esquerda */}
            <Cota3D
              end={[-w / 2, internalH / 2, d / 2]}
              label={`${config.units}U`}
              offset={[-0.15, 0, 0]}
              start={[-w / 2, -internalH / 2, d / 2]}
            />
            {/* Profundidade Principal - Direita */}
            <Cota3D
              end={[w / 2, h / 2, -d / 2]}
              label={`${config.depth} mm`}
              offset={[0.15, 0, 0]}
              start={[w / 2, h / 2, d / 2]}
            />
            {/* Largura Standard (19") - Topo */}
            <Cota3D
              end={[internalW / 2, h / 2, d / 2]}
              label={`19" (482.6 mm)`}
              offset={[0, 0.15, 0]}
              start={[-internalW / 2, h / 2, d / 2]}
            />
            {/* Profundidade Tampa Frontal - (Visível apenas se houver tampa) */}
            {config.hasFrontLid && (
              <Cota3D
                end={[w / 2, h / 2, d / 2 + ld + LID_OFFSET]}
                label={`${config.lidDepth} mm`}
                offset={[0.15, 0, 0]}
                start={[w / 2, h / 2, d / 2 + LID_OFFSET]}
              />
            )}
            {/* Profundidade Tampa Traseira - (Visível apenas se houver tampa) */}
            {config.hasBackLid && (
              <Cota3D
                end={[w / 2, h / 2, -d / 2 - ld - LID_OFFSET]}
                label={`${config.lidDepth} mm`}
                offset={[0.15, 0, 0]}
                start={[w / 2, h / 2, -d / 2 - LID_OFFSET]}
              />
            )}
          </group>

          <group>
            <WoodMesh
              args={[w, t, d]}
              hl={hlWoodBodyTB}
              pos={[0, h / 2 - t / 2 + EXP, 0]}
            />
            <WoodMesh
              args={[w, t, d]}
              hl={hlWoodBodyTB}
              pos={[0, -h / 2 + t / 2 - EXP, 0]}
            />
            <WoodMesh
              args={[t, h - 2 * t, d]}
              hl={hlWoodBodySides}
              pos={[-w / 2 + t / 2 - EXP, 0, 0]}
            />
            <WoodMesh
              args={[t, h - 2 * t, d]}
              hl={hlWoodBodySides}
              pos={[w / 2 - t / 2 + EXP, 0, 0]}
            />
            {!config.hasBackLid && (
              <WoodMesh
                args={[w - 2 * t, h - 2 * t, t]}
                hl={hlWoodFaces}
                pos={[0, 0, -d / 2 + t / 2 - EXP]}
              />
            )}
            {!config.hasFrontLid && (
              <WoodMesh
                args={[w - 2 * t, h - 2 * t, t]}
                hl={hlWoodFaces}
                pos={[0, 0, d / 2 - t / 2 + EXP]}
              />
            )}

            <LBracket
              axis="z"
              exp={EXP}
              hl={hlLAngleBody}
              in1={-1}
              in2={-1}
              len={d}
              pos={[w / 2, h / 2, 0]}
            />
            <LBracket
              axis="z"
              exp={EXP}
              hl={hlLAngleBody}
              in1={1}
              in2={-1}
              len={d}
              pos={[-w / 2, h / 2, 0]}
            />
            <LBracket
              axis="z"
              exp={EXP}
              hl={hlLAngleBody}
              in1={1}
              in2={1}
              len={d}
              pos={[-w / 2, -h / 2, 0]}
            />
            <LBracket
              axis="z"
              exp={EXP}
              hl={hlLAngleBody}
              in1={-1}
              in2={1}
              len={d}
              pos={[w / 2, -h / 2, 0]}
            />

            {config.hasFrontLid && (
              <>
                <PerfilHibridoMachoFemea
                  exp={EXP}
                  h={h}
                  hl={hlProfile}
                  invert={false}
                  w={w}
                  zPos={d / 2}
                />
                {[
                  [1, 1],
                  [-1, 1],
                  [1, -1],
                  [-1, -1],
                ].map((p, i) => (
                  <MataJunta
                    dirZ={-1}
                    exp={EXP}
                    hl={hlMataJunta}
                    key={`mj-bf-${i}`}
                    pos={[(p[0] * w) / 2, (p[1] * h) / 2, d / 2]}
                    qX={p[0]}
                    qY={p[1]}
                  />
                ))}
              </>
            )}
            {config.hasBackLid && (
              <>
                <PerfilHibridoMachoFemea
                  exp={EXP}
                  h={h}
                  hl={hlProfile}
                  invert={false}
                  w={w}
                  zPos={-d / 2}
                />
                {[
                  [1, 1],
                  [-1, 1],
                  [1, -1],
                  [-1, -1],
                ].map((p, i) => (
                  <MataJunta
                    dirZ={1}
                    exp={EXP}
                    hl={hlMataJunta}
                    key={`mj-bb-${i}`}
                    pos={[(p[0] * w) / 2, (p[1] * h) / 2, -d / 2]}
                    qX={p[0]}
                    qY={p[1]}
                  />
                ))}
              </>
            )}
          </group>

          {railH > 0 && (
            <>
              <RackRail
                exp={EXP}
                h={railH}
                hl={hlRailFront}
                isFront={true}
                isLeft={true}
                pos={[-internalW / 2, railPosY, d / 2 - railRecess]}
              />
              <RackRail
                exp={EXP}
                h={railH}
                hl={hlRailFront}
                isFront={true}
                isLeft={false}
                pos={[internalW / 2, railPosY, d / 2 - railRecess]}
              />
              {config.hasBackLid && (
                <>
                  <RackRail
                    exp={EXP}
                    h={railH}
                    hl={hlRailBack}
                    isFront={false}
                    isLeft={true}
                    pos={[-internalW / 2, railPosY, -d / 2 + railRecess]}
                  />
                  <RackRail
                    exp={EXP}
                    h={railH}
                    hl={hlRailBack}
                    isFront={false}
                    isLeft={false}
                    pos={[internalW / 2, railPosY, -d / 2 + railRecess]}
                  />
                </>
              )}
            </>
          )}

          {config.hasDrawer &&
            (() => {
              const drwD = d - 0.05,
                slideW = 0.013,
                drwW = internalW - slideW * 2;
              const drwH =
                config.drawerUnits * U_MM * scale -
                0.025 -
                config.drawerThickness * scale;
              const dtRaw = config.drawerThickness * scale;
              const baseZ = d / 2 - railRecess - drwD / 2;
              const coverY =
                -internalH / 2 + config.drawerUnits * U_MM * scale - dtRaw / 2;
              const boxY = -internalH / 2 + 0.025 + drwH / 2;

              return (
                <group>
                  <DrawerWoodMesh
                    args={[internalW, dtRaw, drwD]}
                    hl={hlDrwCover}
                    pos={[0, coverY + EXP, baseZ]}
                  />
                  <group position={[0, boxY, baseZ + DRAWER_OFFSET]}>
                    <DrawerWoodMesh
                      args={[drwW, drwH, dtRaw]}
                      hl={hlDrwFrontBack}
                      pos={[0, 0, drwD / 2 - dtRaw / 2 + EXP]}
                    />
                    <DrawerWoodMesh
                      args={[drwW, drwH, dtRaw]}
                      hl={hlDrwFrontBack}
                      pos={[0, 0, -drwD / 2 + dtRaw / 2 - EXP]}
                    />
                    <DrawerWoodMesh
                      args={[dtRaw, drwH, drwD - 2 * dtRaw]}
                      hl={hlDrwSides}
                      pos={[-drwW / 2 + dtRaw / 2 - EXP, 0, 0]}
                    />
                    <DrawerWoodMesh
                      args={[dtRaw, drwH, drwD - 2 * dtRaw]}
                      hl={hlDrwSides}
                      pos={[drwW / 2 - dtRaw / 2 + EXP, 0, 0]}
                    />
                    <DrawerWoodMesh
                      args={[drwW - 2 * dtRaw, dtRaw, drwD - 2 * dtRaw]}
                      hl={hlDrwBase}
                      pos={[0, -drwH / 2 + dtRaw / 2 - EXP, 0]}
                    />

                    <mesh position={[-drwW / 2 - slideW / 2 - EXP, 0, 0]}>
                      <boxGeometry args={[slideW, drwH * 0.4, drwD]} />
                      <meshStandardMaterial
                        color={getCol('#a0a0a0', HL_METAL, hlDrawerSlides)}
                        emissive={hlDrawerSlides ? HL_METAL : '#000'}
                        emissiveIntensity={0.2}
                        metalness={1}
                        roughness={0.3}
                      />
                    </mesh>
                    <mesh position={[drwW / 2 + slideW / 2 + EXP, 0, 0]}>
                      <boxGeometry args={[slideW, drwH * 0.4, drwD]} />
                      <meshStandardMaterial
                        color={getCol('#a0a0a0', HL_METAL, hlDrawerSlides)}
                        emissive={hlDrawerSlides ? HL_METAL : '#000'}
                        emissiveIntensity={0.2}
                        metalness={1}
                        roughness={0.3}
                      />
                    </mesh>
                  </group>
                </group>
              );
            })()}

          {bodyCorners.map((p, i) => (
            <BallCorner
              exp={EXP}
              hl={hlCorners}
              key={`body-corner-${i}`}
              position={[(p[0] * w) / 2, (p[1] * h) / 2, (p[2] * d) / 2]}
            />
          ))}
          <Handle exp={EXP} hl={hlHandles} position={[w / 2 + 0.005, 0, 0]} />
          <Handle
            exp={EXP}
            hl={hlHandles}
            position={[-w / 2 - 0.005, 0, 0]}
            rotation={[0, Math.PI, 0]}
          />

          {config.hasFrontLid &&
            latchYPositions.map((y, i) => (
              <group key={`front-latch-b-${i}`}>
                <LatchHalf
                  exp={EXP}
                  hl={hlCatches}
                  position={[w / 2 + 0.006, y, d / 2 - 0.02]}
                />
                <LatchHalf
                  exp={EXP}
                  hl={hlCatches}
                  position={[-w / 2 - 0.006, y, d / 2 - 0.02]}
                />
              </group>
            ))}
          {config.hasBackLid &&
            latchYPositions.map((y, i) => (
              <group key={`back-latch-b-${i}`}>
                <LatchHalf
                  exp={EXP}
                  hl={hlCatches}
                  position={[w / 2 + 0.006, y, -d / 2 + 0.02]}
                />
                <LatchHalf
                  exp={EXP}
                  hl={hlCatches}
                  position={[-w / 2 - 0.006, y, -d / 2 + 0.02]}
                />
              </group>
            ))}

          {config.hasFrontLid && (
            <group position={[0, 0, d / 2 + ld / 2 + LID_OFFSET]}>
              <WoodMesh
                args={[w, t, ld]}
                hl={hlWoodLidTB}
                pos={[0, h / 2 - t / 2 + EXP, 0]}
              />
              <WoodMesh
                args={[w, t, ld]}
                hl={hlWoodLidTB}
                pos={[0, -h / 2 + t / 2 - EXP, 0]}
              />
              <WoodMesh
                args={[t, h - 2 * t, ld]}
                hl={hlWoodLidSides}
                pos={[-w / 2 + t / 2 - EXP, 0, 0]}
              />
              <WoodMesh
                args={[t, h - 2 * t, ld]}
                hl={hlWoodLidSides}
                pos={[w / 2 - t / 2 + EXP, 0, 0]}
              />
              <WoodMesh
                args={[w - 2 * t, h - 2 * t, t]}
                hl={hlWoodFaces}
                pos={[0, 0, ld / 2 - t / 2 + EXP]}
              />

              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={-1}
                len={ld}
                pos={[w / 2, h / 2, 0]}
              />
              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={-1}
                len={ld}
                pos={[-w / 2, h / 2, 0]}
              />
              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={1}
                len={ld}
                pos={[-w / 2, -h / 2, 0]}
              />
              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={1}
                len={ld}
                pos={[w / 2, -h / 2, 0]}
              />
              <LBracket
                axis="x"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={-1}
                len={w}
                pos={[0, h / 2, ld / 2]}
              />
              <LBracket
                axis="x"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={-1}
                len={w}
                pos={[0, -h / 2, ld / 2]}
              />
              <LBracket
                axis="y"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={-1}
                len={h}
                pos={[w / 2, 0, ld / 2]}
              />
              <LBracket
                axis="y"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={-1}
                len={h}
                pos={[-w / 2, 0, ld / 2]}
              />

              <PerfilHibridoMachoFemea
                exp={EXP}
                h={h}
                hl={hlProfile}
                invert={true}
                w={w}
                zPos={-ld / 2}
              />
              {[
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
              ].map((p, i) => (
                <MataJunta
                  dirZ={1}
                  exp={EXP}
                  hl={hlMataJunta}
                  key={`mj-lid-${i}`}
                  pos={[(p[0] * w) / 2, (p[1] * h) / 2, -ld / 2]}
                  qX={p[0]}
                  qY={p[1]}
                />
              ))}
              {[
                [1, 1, 1],
                [-1, 1, 1],
                [1, -1, 1],
                [-1, -1, 1],
              ].map((p, i) => (
                <BallCorner
                  exp={EXP}
                  hl={hlCorners}
                  key={`fl-corner-${i}`}
                  position={[(p[0] * w) / 2, (p[1] * h) / 2, (p[2] * ld) / 2]}
                />
              ))}
              {latchYPositions.map((y, i) => (
                <group key={`front-latch-lid-${i}`}>
                  <LatchHalf
                    exp={EXP}
                    hl={hlCatches}
                    position={[w / 2 + 0.006, y, -ld / 2 + 0.02]}
                  />
                  <LatchHalf
                    exp={EXP}
                    hl={hlCatches}
                    position={[-w / 2 - 0.006, y, -ld / 2 + 0.02]}
                  />
                </group>
              ))}
            </group>
          )}

          {config.hasBackLid && (
            <group position={[0, 0, -(d / 2 + ld / 2 + LID_OFFSET)]}>
              <WoodMesh
                args={[w, t, ld]}
                hl={hlWoodLidTB}
                pos={[0, h / 2 - t / 2 + EXP, 0]}
              />
              <WoodMesh
                args={[w, t, ld]}
                hl={hlWoodLidTB}
                pos={[0, -h / 2 + t / 2 - EXP, 0]}
              />
              <WoodMesh
                args={[t, h - 2 * t, ld]}
                hl={hlWoodLidSides}
                pos={[-w / 2 + t / 2 - EXP, 0, 0]}
              />
              <WoodMesh
                args={[t, h - 2 * t, ld]}
                hl={hlWoodLidSides}
                pos={[w / 2 - t / 2 + EXP, 0, 0]}
              />
              <WoodMesh
                args={[w - 2 * t, h - 2 * t, t]}
                hl={hlWoodFaces}
                pos={[0, 0, -ld / 2 + t / 2 - EXP]}
              />

              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={-1}
                len={ld}
                pos={[w / 2, h / 2, 0]}
              />
              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={-1}
                len={ld}
                pos={[-w / 2, h / 2, 0]}
              />
              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={1}
                len={ld}
                pos={[-w / 2, -h / 2, 0]}
              />
              <LBracket
                axis="z"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={1}
                len={ld}
                pos={[w / 2, -h / 2, 0]}
              />
              <LBracket
                axis="x"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={1}
                len={w}
                pos={[0, h / 2, -ld / 2]}
              />
              <LBracket
                axis="x"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={1}
                len={w}
                pos={[0, -h / 2, -ld / 2]}
              />
              <LBracket
                axis="y"
                exp={EXP}
                hl={hlLAngleLid}
                in1={-1}
                in2={1}
                len={h}
                pos={[w / 2, 0, -ld / 2]}
              />
              <LBracket
                axis="y"
                exp={EXP}
                hl={hlLAngleLid}
                in1={1}
                in2={1}
                len={h}
                pos={[-w / 2, 0, -ld / 2]}
              />

              <PerfilHibridoMachoFemea
                exp={EXP}
                h={h}
                hl={hlProfile}
                invert={true}
                w={w}
                zPos={ld / 2}
              />
              {[
                [1, 1],
                [-1, 1],
                [1, -1],
                [-1, -1],
              ].map((p, i) => (
                <MataJunta
                  dirZ={-1}
                  exp={EXP}
                  hl={hlMataJunta}
                  key={`mj-lid-${i}`}
                  pos={[(p[0] * w) / 2, (p[1] * h) / 2, ld / 2]}
                  qX={p[0]}
                  qY={p[1]}
                />
              ))}
              {[
                [1, 1, -1],
                [-1, 1, -1],
                [1, -1, -1],
                [-1, -1, -1],
              ].map((p, i) => (
                <BallCorner
                  exp={EXP}
                  hl={hlCorners}
                  key={`bl-corner-${i}`}
                  position={[(p[0] * w) / 2, (p[1] * h) / 2, (p[2] * ld) / 2]}
                />
              ))}
              {latchYPositions.map((y, i) => (
                <group key={`back-latch-lid-${i}`}>
                  <LatchHalf
                    exp={EXP}
                    hl={hlCatches}
                    position={[w / 2 + 0.006, y, ld / 2 - 0.02]}
                  />
                  <LatchHalf
                    exp={EXP}
                    hl={hlCatches}
                    position={[-w / 2 - 0.006, y, ld / 2 - 0.02]}
                  />
                </group>
              ))}
            </group>
          )}
        </group>

        <OrbitControls makeDefault />
        <ContactShadows
          blur={2.5}
          far={4}
          opacity={0.6}
          position={[0, 0, 0]}
          scale={10}
        />
      </Canvas>
    </div>
  );
}
