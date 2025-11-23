"use client"

import type { Dispatch, SetStateAction } from "react"
import type { View } from "@/app/page"
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  PawPrint,
  Pill,
  Stethoscope,
  Users,
  Bug,
  LifeBuoy,
  Settings,
  Calendar,
  List,
} from "lucide-react"

interface DashboardNavProps {
  activeView: View
  setActiveView: Dispatch<SetStateAction<View>>
}

export function DashboardNav({ activeView, setActiveView }: DashboardNavProps) {
  const navItems = [
    { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { view: "patient", label: "Identitas Pasien", icon: PawPrint },
    { view: "client", label: "Identitas Klien", icon: Users },
    { view: "status", label: "Status Present", icon: Activity },
    { view: "examination", label: "Pemeriksaan", icon: ClipboardList },
    { view: "doctor", label: "Data Dokter", icon: Stethoscope },
    { view: "medication", label: "Data Obat", icon: Pill },
    { view: "disease", label: "Data Penyakit", icon: Bug },
    { view: "schedule", label: "Jadwal", icon: Calendar },
    { view: "doctor-list", label: "Daftar Dokter", icon: List },
  ]

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <PawPrint className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold font-headline">VetClinic</span>
        </div>
      </SidebarHeader>

      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.view}>
            <SidebarMenuButton
              onClick={() => setActiveView(item.view as View)}
              isActive={activeView === item.view}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <SidebarFooter className="mt-auto">
        <SidebarSeparator />
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings">
                    <Settings/>
                    <span>Settings</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Support">
                    <LifeBuoy/>
                    <span>Support</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )
}
