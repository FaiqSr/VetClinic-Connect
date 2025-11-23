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

interface Patient {
  id: string;
  name: string;
  breed: string;
  species: string;
  age: number;
  weight: number;
  gender: string;
}

export function PatientList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading: isUserLoadingAuth } = useUser();

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // Querying the collection group 'patients' to get patients from all doctors for the current user.
    // Assuming security rules allow this. For a per-doctor view, you would use:
    // return collection(firestore, `doctors/${user.uid}/patients`);
    return collectionGroup(firestore, 'patients');
  }, [firestore, user]);

  const { data: patients, isLoading: isPatientsLoading } = useCollection<Patient>(patientsQuery);

  const displayLoading = isPatientsLoading || isUserLoadingAuth;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pasien</CardTitle>
        <CardDescription>Berikut adalah daftar semua pasien yang terdaftar di sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis Hewan</TableHead>
              <TableHead>Ras</TableHead>
              <TableHead>Umur (Tahun)</TableHead>
              <TableHead>Berat (kg)</TableHead>
              <TableHead>Jenis Kelamin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && patients && patients.length > 0 ? (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.species}</TableCell>
                  <TableCell>{patient.breed}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.weight}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Tidak ada data pasien.
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
