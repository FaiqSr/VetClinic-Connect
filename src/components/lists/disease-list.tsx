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

interface Disease {
  id: string;
  name: string;
  description: string;
}

export function DiseaseList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const diseasesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'diseases');
  }, [firestore]);

  const { data: diseases, isLoading: isDiseasesLoading } = useCollection<Disease>(diseasesQuery);

  const displayLoading = isDiseasesLoading || isUserLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Penyakit</CardTitle>
        <CardDescription>Berikut adalah daftar penyakit yang terdaftar.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Penyakit</TableHead>
              <TableHead>Deskripsi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[300px]" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && diseases && diseases.length > 0 ? (
              diseases.map((disease) => (
                <TableRow key={disease.id}>
                  <TableCell className="font-medium">{disease.name}</TableCell>
                  <TableCell>{disease.description}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Tidak ada data penyakit.
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
