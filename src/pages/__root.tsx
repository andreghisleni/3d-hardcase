import { Link, Outlet, createRootRoute } from "@tanstack/react-router"
import { Box, Scissors } from "lucide-react"

function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <nav className="flex shrink-0 items-center gap-1 border-b bg-card px-4 py-2">
        <Link
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground"
          to="/"
        >
          <Box className="h-4 w-4" />
          Projeto de Case
        </Link>
        <Link
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent [&.active]:bg-accent [&.active]:text-accent-foreground"
          to="/cutting-plan"
        >
          <Scissors className="h-4 w-4" />
          Plano de Corte
        </Link>
      </nav>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
})
