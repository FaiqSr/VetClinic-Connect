'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
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

interface Medication {
  id: string;
  type: string;
  name: string;
  price: number;
}

export function MedicationList() {
  const { firestore } = useFirebase();
  const { isUserLoading } = useUser();

  const medicationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'medications');
  }, [firestore]);

  const { data: medications, isLoading: isMedicationsLoading } = useCollection<Medication>(medicationsQuery);

  const displayLoading = isMedicationsLoading || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Obat</CardTitle>
        <CardDescription>Berikut adalah daftar semua obat yang tersedia.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Obat</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Harga (Rp)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && medications && medications.length > 0 ? (
              medications.map((med) => (
                <TableRow key={med.id}>
                  <TableCell className="font-medium">{med.name}</TableCell>
                  <TableCell>{med.type}</TableCell>
                  <TableCell>{med.price.toLocaleString('id-ID')}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Tidak ada data obat.
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
