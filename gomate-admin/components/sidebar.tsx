"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Car, FileText, Zap, CreditCard, Settings, ChevronLeft, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/drivers", label: "Drivers", icon: Car },
  { href: "/dashboard/requests", label: "Requests", icon: FileText },
  { href: "/dashboard/rides", label: "Rides", icon: Zap },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/fare-settings", label: "Fare Settings", icon: Settings },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col border-r border-sidebar-border",
        open ? "w-64" : "w-20",
      )}
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {open && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">G</span>
            </div>
            <h1 className="text-xl font-bold">GoMate</h1>
          </div>
        )}
        {!open && (
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <span className="text-sidebar-primary-foreground font-bold text-lg">G</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {open && <span>Logout</span>}
        </Button>
        {open && <p className="text-xs text-sidebar-foreground/60 text-center">© 2025 GoMate</p>}
      </div>
    </aside>
  )
}
