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

interface Client {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  visitDate: string;
  responsiblePerson: string;
}

export function ClientList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading: isUserLoadingAuth } = useUser();

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collectionGroup(firestore, 'clients');
  }, [firestore, user]);

  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);

  const displayLoading = isClientsLoading || isUserLoadingAuth;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Klien</CardTitle>
        <CardDescription>Berikut adalah daftar semua klien yang terdaftar di sistem.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Klien</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Tanggal Kunjungan</TableHead>
              <TableHead>Penanggung Jawab</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && clients && clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.address}</TableCell>
                  <TableCell>{client.phoneNumber}</TableCell>
                  <TableCell>{format(new Date(client.visitDate), 'PPP')}</TableCell>
                  <TableCell>{client.responsiblePerson}</TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada data klien.
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
