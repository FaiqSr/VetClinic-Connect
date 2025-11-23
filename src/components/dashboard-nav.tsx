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
  SidebarGroup,
  SidebarGroupLabel,
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
  const formItems = [
    { view: "patient", label: "Identitas Pasien", icon: PawPrint },
    { view: "client", label: "Identitas Klien", icon: Users },
    { view: "status", label: "Status Present", icon: Activity },
    { view: "examination", label: "Pemeriksaan", icon: ClipboardList },
    { view: "doctor", label: "Data Dokter", icon: Stethoscope },
    { view: "medication", label: "Data Obat", icon: Pill },
    { view: "disease", label: "Data Penyakit", icon: Bug },
  ];

  const listItems = [
    { view: "doctor-list", label: "Daftar Dokter", icon: List },
    { view: "patient-list", label: "Daftar Pasien", icon: List },
    { view: "client-list", label: "Daftar Klien", icon: List },
    { view: "examination-list", label: "Daftar Pemeriksaan", icon: List },
    { view: "status-list", label: "Daftar Status", icon: List },
    { view: "medication-list", label: "Daftar Obat", icon: List },
    { view: "disease-list", label: "Daftar Penyakit", icon: List },
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
        <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveView("dashboard")}
              isActive={activeView === "dashboard"}
              tooltip="Dashboard"
            >
              <LayoutDashboard />
              <span>Dashboard</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
         <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveView("schedule")}
              isActive={activeView === "schedule"}
              tooltip="Jadwal"
            >
              <Calendar />
              <span>Jadwal</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>Form Entri Data</SidebarGroupLabel>
        <SidebarMenu>
          {formItems.map((item) => (
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
      </SidebarGroup>

      <SidebarSeparator />
      
      <SidebarGroup>
        <SidebarGroupLabel>Tampilan Daftar</SidebarGroupLabel>
        <SidebarMenu>
          {listItems.map((item) => (
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
      </SidebarGroup>
      
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
