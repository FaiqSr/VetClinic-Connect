'use client';

import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirebase, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import FormDialog from '../forms/form-dialog';
import MedicationForm from '../forms/medication-form';

interface Medication {
  id: string;
  type: string;
  name: string;
  price: number;
  __path: string;
}

export function MedicationList() {
  const { firestore } = useFirebase();
  const { isUserLoading } = useUser();
  const { toast } = useToast();

  const medicationsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return collection(firestore, 'medications');
  }, [firestore, isUserLoading]);

  const { data: medications, isLoading: isMedicationsLoading } = useCollection<Medication>(medicationsQuery, { includePath: true });

  const isLoading = isMedicationsLoading || isUserLoading;

  const handleDelete = (med: Medication) => {
    if (!firestore) return;
    const docRef = doc(firestore, med.__path);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Data Obat Dihapus",
        description: `Obat ${med.name} telah dihapus.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Obat</CardTitle>
        <CardDescription>Berikut adalah daftar semua obat yang tersedia.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Obat</TableHead>
              <TableHead>Nama Obat</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Harga (Rp)</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && medications && medications.length > 0 ? (
              medications.map((med) => (
                <TableRow key={med.__path}>
                  <TableCell className="font-medium whitespace-nowrap">{med.id}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{med.name}</TableCell>
                  <TableCell>{med.type}</TableCell>
                  <TableCell>{med.price.toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                     <div className="inline-flex gap-2">
                       <FormDialog
                        title="Edit Obat"
                        description="Ubah detail obat di bawah ini."
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <MedicationForm initialData={med} isEditMode />
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
                              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data obat ({med.name}) secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(med)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
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
