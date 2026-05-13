import { createContext, useContext, useState } from 'react'
import type { CaseConfig } from '@/lib/calculator'

interface ConfigContextValue {
  config: CaseConfig
  setConfig: React.Dispatch<React.SetStateAction<CaseConfig>>
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

const DEFAULT_CONFIG: CaseConfig = {
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
}

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<CaseConfig>(DEFAULT_CONFIG)
  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used inside ConfigProvider')
  return ctx
}
