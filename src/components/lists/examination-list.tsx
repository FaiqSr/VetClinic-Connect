'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';

interface Examination {
  id: string;
  date: string;
  doctorId: string;
  patientId: string;
  diseaseId: string;
  complaints: string;
  diagnosis: string;
}

export function ExaminationList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const examinationsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collectionGroup(firestore, 'examinations');
  }, [firestore, user]);

  const { data: examinations, isLoading: isExaminationsLoading } = useCollection<Examination>(examinationsQuery);

  const displayLoading = isExaminationsLoading || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pemeriksaan</CardTitle>
        <CardDescription>Berikut adalah riwayat pemeriksaan yang tercatat.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>ID Pasien</TableHead>
              <TableHead>ID Dokter</TableHead>
              <TableHead>Keluhan</TableHead>
              <TableHead>Diagnosis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && examinations && examinations.length > 0 ? (
              examinations.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{format(new Date(exam.date), 'PPP')}</TableCell>
                  <TableCell>{exam.patientId}</TableCell>
                  <TableCell>{exam.doctorId}</TableCell>
                  <TableCell>{exam.complaints}</TableCell>
                  <TableCell>{exam.diagnosis}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada data pemeriksaan.
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
