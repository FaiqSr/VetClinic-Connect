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

interface Doctor {
  id: string;
  name: string;
  gender: string;
  address: string;
  phoneNumber: string;
  schedule: string;
}

export function DoctorList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const doctorsQuery = useMemoFirebase(() => {
    // Wait for firestore and user to be available
    if (!firestore || !user) return null;
    return collection(firestore, 'doctors');
  }, [firestore, user]);

  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  const displayLoading = isLoading || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Dokter</CardTitle>
        <CardDescription>Berikut adalah daftar dokter yang terdaftar di sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis Kelamin</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Jadwal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                </TableRow>
              ))}
            {!displayLoading && doctors && doctors.length > 0 ? (
              doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.gender}</TableCell>
                  <TableCell>{doctor.address}</TableCell>
                  <TableCell>{doctor.phoneNumber}</TableCell>
                  <TableCell>{doctor.schedule}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada data dokter.
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
