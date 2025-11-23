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

interface PresentStatus {
  id: string;
  patientId: string;
  actions: string;
  behavior: string;
  hydration: string;
  posture: string;
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
}

export function StatusList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading: isUserLoadingAuth } = useUser();

  const statusesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collectionGroup(firestore, 'presentStatuses');
  }, [firestore, user]);

  const { data: statuses, isLoading: isStatusesLoading } = useCollection<PresentStatus>(statusesQuery);

  const displayLoading = isStatusesLoading || isUserLoadingAuth;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Status Present</CardTitle>
        <CardDescription>Berikut adalah daftar status present pasien yang tercatat.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pasien</TableHead>
              <TableHead>Suhu (°C)</TableHead>
              <TableHead>Jantung (bpm)</TableHead>
              <TableHead>Nafas (/menit)</TableHead>
              <TableHead>Hidrasi</TableHead>
              <TableHead>Tingkah Laku</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && statuses && statuses.length > 0 ? (
              statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>{status.patientId}</TableCell>
                  <TableCell>{status.temperature}</TableCell>
                  <TableCell>{status.heartRate}</TableCell>
                  <TableCell>{status.respiratoryRate}</TableCell>
                  <TableCell>{status.hydration}</TableCell>
                  <TableCell>{status.behavior}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Tidak ada data status.
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
