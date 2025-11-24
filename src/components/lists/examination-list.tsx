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
import ExaminationForm from '../forms/examination-form';
import { Badge } from '../ui/badge';

interface Examination {
  id: string;
  date: string;
  doctorId: string;
  patientId: string;
  diseaseIds: string[];
  complaints: string;
  diagnosis: string;
  __path: string;
}

export function ExaminationList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const examinationsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return collectionGroup(firestore, 'examinations');
  }, [firestore, isUserLoading]);

  const { data: examinations, isLoading: isExaminationsLoading } = useCollection<Examination>(examinationsQuery, { includePath: true });

  const isLoading = isExaminationsLoading || isUserLoading;

  const handleDelete = (exam: Examination) => {
    if (!firestore || !exam.__path) return;
    const docRef = doc(firestore, exam.__path);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Data Pemeriksaan Dihapus",
        description: `Pemeriksaan untuk pasien ${exam.patientId} pada tanggal ${format(new Date(exam.date), 'PPP')} telah dihapus.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pemeriksaan</CardTitle>
        <CardDescription>Berikut adalah riwayat pemeriksaan yang tercatat.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>ID Pasien</TableHead>
              <TableHead>ID Dokter</TableHead>
              <TableHead>Penyakit</TableHead>
              <TableHead>Keluhan</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && examinations && examinations.length > 0 ? (
              examinations.map((exam) => (
                <TableRow key={exam.__path}>
                  <TableCell className="whitespace-nowrap">{format(new Date(exam.date), 'PPP')}</TableCell>
                  <TableCell>{exam.patientId}</TableCell>
                  <TableCell>{exam.doctorId}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exam.diseaseIds?.map(id => <Badge key={id} variant="secondary">{id}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell>{exam.complaints}</TableCell>
                  <TableCell>{exam.diagnosis}</TableCell>
                  <TableCell className="text-right">
                     <div className="inline-flex gap-2">
                       <FormDialog
                        title="Edit Pemeriksaan"
                        description="Ubah detail pemeriksaan di bawah ini."
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <ExaminationForm
                          isEditMode
                          initialData={{...exam, date: new Date(exam.date)}}
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
                              Tindakan ini akan menghapus data pemeriksaan untuk pasien {exam.patientId} pada tanggal {format(new Date(exam.date), 'PPP')}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(exam)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
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
