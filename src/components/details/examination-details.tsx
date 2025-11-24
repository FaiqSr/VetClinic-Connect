
'use client';

import { useMemo } from 'react';
import { doc, collection, where, query, documentId } from 'firebase/firestore';
import { useFirebase, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Examination {
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

interface Doctor { name: string; }
interface Patient { name: string; species: string; breed: string; }
interface Disease { diseaseId: string; name: string; }
interface PresentStatus {
    actions: string;
    behavior: string;
    hydration: string;
    posture: string;
    temperature: number;
    heartRate: number;
    respiratoryRate: number;
}


interface ExaminationDetailsProps {
  examination: Examination;
  closeDialog?: () => void;
}

export default function ExaminationDetails({ examination }: ExaminationDetailsProps) {
  const { firestore } = useFirebase();

  // Memoize document and query references to prevent re-renders
  const doctorRef = useMemoFirebase(() => firestore ? doc(firestore, 'doctors', examination.doctorId) : null, [firestore, examination.doctorId]);
  const patientRef = useMemoFirebase(() => firestore ? doc(firestore, `doctors/${examination.doctorId}/patients`, examination.patientId) : null, [firestore, examination.doctorId, examination.patientId]);
  const statusRef = useMemoFirebase(() => firestore ? doc(firestore, `doctors/${examination.doctorId}/patients/${examination.patientId}/presentStatuses`, examination.presentStatusId) : null, [firestore, examination.doctorId, examination.patientId, examination.presentStatusId]);
  const diseasesQuery = useMemoFirebase(() => {
    if (!firestore || !examination.diseaseIds || examination.diseaseIds.length === 0) return null;
    return query(collection(firestore, 'diseases'), where(documentId(), 'in', examination.diseaseIds));
  }, [firestore, examination.diseaseIds]);

  // Fetch the data
  const { data: doctor, isLoading: loadingDoctor } = useDoc<Doctor>(doctorRef);
  const { data: patient, isLoading: loadingPatient } = useDoc<Patient>(patientRef);
  const { data: diseases, isLoading: loadingDiseases } = useCollection<Disease>(diseasesQuery);
  const { data: status, isLoading: loadingStatus } = useDoc<PresentStatus>(statusRef);

  const isLoading = loadingDoctor || loadingPatient || loadingDiseases || loadingStatus;

  const DetailItem = ({ label, value, isLoading }: { label: string; value: React.ReactNode; isLoading?: boolean }) => (
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="h-5 w-3/4 mt-1" />
      ) : typeof value === 'string' || value === null || value === undefined ? (
        <p className="text-base">{value || '-'}</p>
      ) : (
        value
      )}
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <DetailItem label="Tanggal Pemeriksaan" value={format(new Date(examination.date), 'PPP')} isLoading={isLoading} />
        <DetailItem label="Dokter Pemeriksa" value={doctor?.name} isLoading={isLoading} />
      </div>

      <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
        <h3 className="text-md font-semibold mb-2">Informasi Pasien</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <DetailItem label="Nama Pasien" value={patient?.name} isLoading={isLoading} />
            <DetailItem label="Spesies / Ras" value={`${patient?.species || ''} / ${patient?.breed || ''}`} isLoading={isLoading} />
        </div>
      </div>
      
      <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
        <h3 className="text-md font-semibold mb-2">Status Present</h3>
        {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : status ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                <DetailItem label="Suhu" value={`${status.temperature}°C`} />
                <DetailItem label="Detak Jantung" value={`${status.heartRate} bpm`} />
                <DetailItem label="Pernapasan" value={`${status.respiratoryRate}/menit`} />
                <DetailItem label="Hidrasi" value={status.hydration} />
                <DetailItem label="Postur" value={status.posture} />
                <DetailItem label="Tingkah Laku" value={status.behavior} />
            </div>
        ) : (
            <p className="text-sm text-muted-foreground">Data status present tidak ditemukan.</p>
        )}
      </div>

      <div className="space-y-2">
        <DetailItem label="Teridentifikasi Penyakit" value={
            <div className="flex flex-wrap gap-2 mt-1">
                {diseases && diseases.length > 0
                    ? diseases.map(d => <Badge key={d.id} variant="secondary">{d.name}</Badge>)
                    : '-'
                }
            </div>
        } isLoading={isLoading} />
        <DetailItem label="Diagnosis" value={examination.diagnosis} isLoading={isLoading} />
        <DetailItem label="Tindakan/Perawatan" value={examination.treatment} isLoading={isLoading} />
      </div>
    </div>
  );
}
