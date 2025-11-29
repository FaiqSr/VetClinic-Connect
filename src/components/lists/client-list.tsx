
'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { collectionGroup, doc } from 'firebase/firestore';
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
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import FormDialog from '../forms/form-dialog';
import ClientForm from '../forms/client-form';

interface Client {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  visitDate: string;
  responsiblePerson: string;
  patientId: string;
  __path: string;
}

export function ClientList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return collectionGroup(firestore, 'clients');
  }, [firestore, isUserLoading]);

  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery, { includePath: true });

  const displayLoading = isClientsLoading || isUserLoading;

  const handleDelete = (client: Client) => {
    if (!firestore || !client.__path) return;
    const docRef = doc(firestore, client.__path);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Data Klien Dihapus",
        description: `Klien dengan nama ${client.name} telah dihapus.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Klien</CardTitle>
        <CardDescription>Berikut adalah daftar semua klien yang terdaftar di sistem.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Klien</TableHead>
              <TableHead>Nama Klien</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Tanggal Kunjungan</TableHead>
              <TableHead>Penanggung Jawab</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!displayLoading && clients && clients.length > 0 ? (
              clients.map((client) => (
                <TableRow key={client.__path}>
                  <TableCell className="font-medium whitespace-nowrap">{client.id}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{client.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{client.address}</TableCell>
                  <TableCell>{client.phoneNumber}</TableCell>
                  <TableCell>{format(new Date(client.visitDate), 'PPP')}</TableCell>
                  <TableCell className="whitespace-nowrap">{client.responsiblePerson}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <FormDialog
                        title="Edit Klien"
                        description="Ubah detail klien di bawah ini."
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <ClientForm 
                          initialData={{...client, visitDate: new Date(client.visitDate), patientId: client.__path.split('/')[1]}}
                          isEditMode
                        />
                      </FormDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data klien ({client.name}) secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(client)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
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

    