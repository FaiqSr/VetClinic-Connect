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
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import FormDialog from '../forms/form-dialog';
import StatusForm from '../forms/status-form';

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
  __path: string;
}

export function StatusList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const statusesQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return collectionGroup(firestore, 'presentStatuses');
  }, [firestore, isUserLoading]);

  const { data: statuses, isLoading: isStatusesLoading } = useCollection<PresentStatus>(statusesQuery, { includePath: true });

  const isLoading = isStatusesLoading || isUserLoading;
  
  const handleDelete = (status: PresentStatus) => {
    if (!firestore || !status.__path) return;
    const docRef = doc(firestore, status.__path);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Data Status Dihapus",
        description: `Status untuk pasien ${status.patientId} telah dihapus.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Status Present</CardTitle>
        <CardDescription>Berikut adalah daftar status present pasien yang tercatat.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pasien</TableHead>
              <TableHead>Suhu (°C)</TableHead>
              <TableHead>Jantung (bpm)</TableHead>
              <TableHead>Nafas (/menit)</TableHead>
              <TableHead>Hidrasi</TableHead>
              <TableHead>Tingkah Laku</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && statuses && statuses.length > 0 ? (
              statuses.map((status) => (
                <TableRow key={status.__path}>
                  <TableCell className="whitespace-nowrap">{status.patientId}</TableCell>
                  <TableCell>{status.temperature}</TableCell>
                  <TableCell>{status.heartRate}</TableCell>
                  <TableCell>{status.respiratoryRate}</TableCell>
                  <TableCell>{status.hydration}</TableCell>
                  <TableCell>{status.behavior}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <FormDialog
                        title="Edit Status Present"
                        description="Ubah detail status di bawah ini."
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <StatusForm initialData={status} isEditMode />
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
                              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data status untuk pasien ({status.patientId}) secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(status)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
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
                  <TableCell colSpan={7} className="text-center">
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
