
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Role } from "@/lib/types"
import { Bot, Calendar, FileText, GraduationCap, Home, LineChart, Users, Wallet, Settings, CircleSlash, Plane, UserCheck } from "lucide-react"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar"


export function DashboardNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) return null

  const navItems = [
    { href: "/dashboard", label: "Dashboard", roles: ["admin", "teacher", "upper-management", "high-level-dashboard"], icon: Home },
    { href: "/dashboard/requests", label: "Requests", roles: ["admin", "upper-management", "high-level-dashboard"], icon: FileText },
    { href: "/dashboard/students", label: "Students", roles: ["admin", "teacher", "upper-management", "high-level-dashboard"], icon: GraduationCap },
    { href: "/dashboard/applicants", label: "Applicants", roles: ["admin"], icon: UserCheck },
    { href: "/dashboard/users", label: "Users", roles: ["admin", "high-level-dashboard"], icon: Users },
    { href: "/dashboard/semesters", label: "Semesters", roles: ["admin"], icon: Calendar },
    { href: "/dashboard/leaves", label: "Leaves", roles: ["admin"], icon: Plane },
    { href: "/dashboard/exclusions", label: "Exclusions", roles: ["admin"], icon: CircleSlash },
    { href: "/dashboard/payments", label: "Payments", roles: ["admin", "upper-management", "high-level-dashboard"], icon: Wallet },
    { href: "/dashboard/reports", label: "Reports", roles: ["admin", "upper-management", "high-level-dashboard"], icon: LineChart },
    { href: "/dashboard/ai-grade-suggester", label: "AI Grade Suggester", roles: ["admin", "teacher", "upper-management", "high-level-dashboard"], icon: Bot },
    { href: "/dashboard/ai-schedule-optimizer", label: "AI Schedule Optimizer", roles: ["admin", "teacher", "upper-management", "high-level-dashboard"], icon: Bot },
    { href: "/dashboard/settings", label: "Settings", roles: ["admin", "high-level-dashboard"], icon: Settings },
  ]

  const userHasRole = (roles: Role[]) => roles.includes(user.activeRole)

  return (
    <nav className="flex flex-col h-full">
      <SidebarMenu>
        {navItems.map((item) =>
          userHasRole(item.roles as Role[]) && (
            <SidebarMenuItem key={item.href}>
               <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon />
                  <span className="flex-1 truncate">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </nav>
  )
}
