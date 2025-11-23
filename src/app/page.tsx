'use client';

import { useState } from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardWelcome } from '@/components/dashboard-welcome';
import PatientForm from '@/components/forms/patient-form';
import ClientForm from '@/components/forms/client-form';
import StatusForm from '@/components/forms/status-form';
import DoctorForm from '@/components/forms/doctor-form';
import MedicationForm from '@/components/forms/medication-form';
import ExaminationForm from '@/components/forms/examination-form';
import DiseaseForm from '@/components/forms/disease-form';
import { DoctorList } from '@/components/lists/doctor-list';
import { PatientList } from '@/components/lists/patient-list';
import { ClientList } from '@/components/lists/client-list';
import { ExaminationList } from '@/components/lists/examination-list';
import { StatusList } from '@/components/lists/status-list';
import { MedicationList } from '@/components/lists/medication-list';
import { DiseaseList } from '@/components/lists/disease-list';
import { ScheduleCalendar } from '@/components/schedule-calendar';

export type View = 'dashboard' | 'patient' | 'client' | 'status' | 'doctor' | 'medication' | 'examination' | 'disease' | 'schedule' | 'doctor-list' | 'patient-list' | 'client-list' | 'examination-list' | 'status-list' | 'medication-list' | 'disease-list';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'patient':
        return <PatientForm />;
      case 'client':
        return <ClientForm />;
      case 'status':
        return <StatusForm />;
      case 'doctor':
        return <DoctorForm />;
      case 'medication':
        return <MedicationForm />;
      case 'examination':
        return <ExaminationForm />;
      case 'disease':
        return <DiseaseForm />;
      case 'schedule':
        return <ScheduleCalendar />;
      case 'doctor-list':
        return <DoctorList />;
      case 'patient-list':
        return <PatientList />;
      case 'client-list':
        return <ClientList />;
      case 'examination-list':
        return <ExaminationList />;
      case 'status-list':
        return <StatusList />;
      case 'medication-list':
        return <MedicationList />;
      case 'disease-list':
        return <DiseaseList />;
      case 'dashboard':
      default:
        return <DashboardWelcome />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <DashboardNav activeView={activeView} setActiveView={setActiveView} />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-svh flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 pt-0 md:p-6 md:pt-0">
            <div className="animate-in fade-in-50">
              {renderView()}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
