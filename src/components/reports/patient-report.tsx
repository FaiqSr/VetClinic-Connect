
'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ClientList } from '@/components/lists/client-list';
import { Button } from '../ui/button';
import { ArrowLeft, User, PawPrint, ClipboardList, Stethoscope } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import ExaminationDetails from '../details/examination-details';

export interface Patient {
  id: string;
  name: string;
  breed: string;
  species: string;
  age: number;
  weight: number;
  gender: string;
  __path: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  visitDate: string;
  responsiblePerson: string;
  __path: string;
}

export interface Examination {
  id: string;
  date: string;
  doctorId: string;
  patientId: string;
  presentStatusId: string;
  diseaseIds: string[];
  diagnosis: string;
  treatment: string;
  __path: string;
}

interface PatientReportProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientReport({ patient, onBack }: PatientReportProps) {
  const { firestore } = useFirebase();

  const pathParts = patient.__path.split('/');
  const doctorId = pathParts[1];
  const patientId = patient.id;

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'doctors', doctorId, 'patients', patientId, 'clients'), orderBy('visitDate', 'desc'));
  }, [firestore, doctorId, patientId]);

  const examinationsQuery = useMemoFirebase(() => {
    if (!firestore || !patientId) return null;
    // Corrected path for examinations, assuming it's a subcollection of a patient document
    // The patient document itself is inside a doctor's patient subcollection.
    const patientDocPath = `doctors/${doctorId}/patients/${patientId}`;
    return query(collection(firestore, patientDocPath, 'examinations'), orderBy('date', 'desc'));
  }, [firestore, doctorId, patientId]);

  const { data: clients, isLoading: loadingClients } = useCollection<Client>(clientsQuery, { includePath: true });
  const { data: examinations, isLoading: loadingExams } = useCollection<Examination>(examinationsQuery, { includePath: true });

  const isLoading = loadingClients || loadingExams;

  const PatientInfoCard = () => (
     <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <PawPrint />
            Informasi Pasien
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <div><p className="font-semibold">Nama</p><p>{patient.name}</p></div>
            <div><p className="font-semibold">ID Pasien</p><p>{patient.id}</p></div>
            <div><p className="font-semibold">Spesies</p><p>{patient.species}</p></div>
            <div><p className="font-semibold">Ras</p><p>{patient.breed}</p></div>
            <div><p className="font-semibold">Umur</p><p>{patient.age} tahun</p></div>
            <div><p className="font-semibold">Berat</p><p>{patient.weight} kg</p></div>
            <div><p className="font-semibold">Jenis Kelamin</p><p>{patient.gender}</p></div>
        </div>
      </CardContent>
    </Card>
  )

  const ClientInfoCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User />Informasi Klien</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingClients ? <Skeleton className="h-10 w-full" /> : clients && clients.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                <div><p className="font-semibold">Nama</p><p>{clients[0].name}</p></div>
                <div><p className="font-semibold">No. HP</p><p>{clients[0].phoneNumber}</p></div>
                <div className="col-span-2"><p className="font-semibold">Alamat</p><p>{clients[0].address}</p></div>
            </div>
        ) : <p className="text-sm text-muted-foreground">Tidak ada data klien.</p>}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Daftar Pasien
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <PatientInfoCard />
           <ClientInfoCard />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList />Riwayat Pemeriksaan</CardTitle>
                <CardDescription>Daftar semua riwayat pemeriksaan untuk pasien {patient.name}.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : examinations && examinations.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {examinations.map(exam => {
                             const examPathParts = exam.__path.split('/');
                             const examDoctorId = examPathParts[1];
                             return (
                            <AccordionItem value={exam.id} key={exam.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <div className="text-left">
                                            <p className="font-semibold">Pemeriksaan tanggal: {format(new Date(exam.date), 'PPP', { locale: id })}</p>
                                            <p className="text-sm text-muted-foreground">Dokter: {examDoctorId}</p>
                                        </div>
                                        <p className="text-sm font-medium text-right">Diagnosis: {exam.diagnosis}</p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <ExaminationDetails examination={exam} />
                                </AccordionContent>
                            </AccordionItem>
                             )
                        })}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Belum ada riwayat pemeriksaan untuk pasien ini.
                    </p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
