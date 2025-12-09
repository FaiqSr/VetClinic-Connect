
'use client';

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ExaminationDetails from '../details/examination-details';
import { Spinner } from '../ui/spinner';
import type { Patient, Client, Examination } from './patient-report';
import { PawPrint } from 'lucide-react';

interface PrintableReportProps {
  patientId: string;
  examinationId?: string;
  onLoaded: () => void;
}

function PrintableReport({ patientId, examinationId, onLoaded }: PrintableReportProps) {
  const { firestore } = useFirebase();

  const patientRef = useMemoFirebase(() => firestore ? doc(firestore, 'patients', patientId) : null, [firestore, patientId]);
  const { data: patient, isLoading: loadingPatient } = useDoc<Patient>(patientRef);

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    return query(collection(firestore, 'patients', patientId, 'clients'), orderBy('visitDate', 'desc'));
  }, [firestore, patientId]);
  const { data: clients, isLoading: loadingClients } = useCollection<Client>(clientsQuery);
  
  const examinationsQuery = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    const baseQuery = collection(firestore, 'patients', patientId, 'examinations');
    if (examinationId) {
        return query(baseQuery, where('id', '==', examinationId));
    }
    return query(baseQuery, orderBy('date', 'desc'));
  }, [firestore, patientId, examinationId]);
  const { data: examinations, isLoading: loadingExams } = useCollection<Examination>(examinationsQuery, { includePath: true });
  
  const isLoading = loadingPatient || loadingClients || loadingExams;

  useEffect(() => {
    if (!isLoading) {
      onLoaded();
    }
  }, [isLoading, onLoaded]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Spinner size="large" />
            <p className="ml-4">Memuat data laporan...</p>
        </div>
    );
  }

  if (!patient) {
    return <div>Data pasien tidak ditemukan.</div>;
  }
  
  const latestClient = clients && clients.length > 0 ? clients[0] : null;

  return (
    <div className="p-8 font-body bg-white text-black">
      <header className="flex items-center justify-between pb-4 mb-6 border-b-2 border-black">
        <div className="flex items-center gap-3">
          <PawPrint className="w-12 h-12 text-black" />
          <div>
            <h1 className="text-3xl font-bold font-headline">Pawvet Clinic</h1>
            <p className="text-sm">Laporan Rekam Medis Pasien</p>
          </div>
        </div>
        <div className="text-sm text-right">
          <p>Tanggal Cetak:</p>
          <p>{format(new Date(), 'PPP', { locale: id })}</p>
        </div>
      </header>
      
      <main>
        <section className="mb-6">
            <h2 className="text-xl font-bold border-b border-black pb-2 mb-3">Informasi Pasien</h2>
            <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
                <div><p className="font-semibold">ID Pasien</p><p>{patient.id}</p></div>
                <div><p className="font-semibold">Nama</p><p>{patient.name}</p></div>
                <div><p className="font-semibold">Jenis Kelamin</p><p>{patient.gender}</p></div>
                <div><p className="font-semibold">Spesies</p><p>{patient.species}</p></div>
                <div><p className="font-semibold">Ras</p><p>{patient.breed}</p></div>
                <div><p className="font-semibold">Umur / Berat</p><p>{patient.age} tahun / {patient.weight} kg</p></div>
            </div>
        </section>

        {latestClient && (
            <section className="mb-6">
                <h2 className="text-xl font-bold border-b border-black pb-2 mb-3">Informasi Klien (Pemilik)</h2>
                <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
                    <div><p className="font-semibold">Nama Klien</p><p>{latestClient.name}</p></div>
                    <div><p className="font-semibold">No. HP</p><p>{latestClient.phoneNumber}</p></div>
                    <div className="col-span-2"><p className="font-semibold">Alamat</p><p>{latestClient.address}</p></div>
                </div>
            </section>
        )}
        
        <section>
            <h2 className="text-xl font-bold border-b border-black pb-2 mb-3">
                {examinationId ? 'Detail Pemeriksaan' : 'Riwayat Pemeriksaan'}
            </h2>
            {examinations && examinations.length > 0 ? (
                <div className="space-y-6">
                    {examinations.map(exam => (
                        <div key={exam.id} className="p-4 border border-gray-300 rounded-lg break-inside-avoid">
                            <ExaminationDetails examination={exam} />
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-center py-4">Tidak ada data pemeriksaan yang ditemukan.</p>
            )}
        </section>
      </main>
      
      <footer className="mt-12 pt-4 text-center text-xs text-gray-500 border-t">
        Laporan ini dibuat secara otomatis oleh Sistem Manajemen Pawvet Clinic.
      </footer>
    </div>
  );
}

// This function is called from other components to trigger the print popup.
export function openPrintPopup(patientId: string, examinationId?: string) {
  const printWindow = window.open('', '_blank', 'height=800,width=800');
  if (!printWindow) {
    alert('Gagal membuka jendela cetak. Mohon izinkan pop-up untuk situs ini.');
    return;
  }
  
  printWindow.document.write('<html><head><title>Cetak Laporan</title>');
  // Link to the same global stylesheet
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
        try {
            return Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('');
        } catch (e) {
            // This can fail on cross-origin stylesheets, we can ignore them
            return '';
        }
    })
    .filter(Boolean)
    .join('\n');
    
  printWindow.document.write(`<style>${styles}</style>`);
  printWindow.document.write('</head><body class="bg-white">');
  printWindow.document.write('<div id="print-root"></div>');
  printWindow.document.write('</body></html>');
  printWindow.document.close();

  const printRoot = printWindow.document.getElementById('print-root');
  
  if (printRoot) {
    // We need to render a React component into the new window.
    // This requires access to the Firebase context.
    const AppProvider = require('@/firebase').FirebaseClientProvider;
    
    const onLoaded = () => {
        // Give a short delay for images/styles to render before printing
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    ReactDOM.render(
      <AppProvider>
        <PrintableReport patientId={patientId} examinationId={examinationId} onLoaded={onLoaded} />
      </AppProvider>,
      printRoot
    );
  }
}

export default PrintableReport;
