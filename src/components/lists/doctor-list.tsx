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
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import FormDialog from '../forms/form-dialog';
import DoctorForm from '../forms/doctor-form';


interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
}

interface Doctor {
  id: string;
  name: string;
  gender: string;
  address: string;
  phoneNumber: string;
  schedule: Schedule[];
}

export function DoctorList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return collection(firestore, 'doctors');
  }, [firestore, isUserLoading]);

  const { data: doctors, isLoading: isDoctorsLoading } = useCollection<Doctor>(doctorsQuery);

  const isLoading = isDoctorsLoading || isUserLoading;
  
  const handleDelete = (doctorId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'doctors', doctorId);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Data Dokter Dihapus",
        description: `Dokter dengan ID ${doctorId} telah dihapus.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Dokter</CardTitle>
        <CardDescription>Berikut adalah daftar dokter yang terdaftar di sistem.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis Kelamin</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Jadwal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
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
                   <TableCell className="text-right">
                    <Skeleton className="h-8 w-20 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && doctors && doctors.length > 0 ? (
              doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium whitespace-nowrap">{doctor.name}</TableCell>
                  <TableCell>{doctor.gender}</TableCell>
                  <TableCell className="whitespace-nowrap">{doctor.address}</TableCell>
                  <TableCell>{doctor.phoneNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2 min-w-[200px]">
                       {doctor.schedule?.map((s, index) => (
                        <Badge key={index} variant="secondary" className="whitespace-nowrap">
                          {s.day}: {s.startTime} - {s.endTime}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                   <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                      <FormDialog
                        title="Edit Dokter"
                        description="Ubah detail dokter di bawah ini."
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <DoctorForm initialData={doctor} isEditMode />
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
                              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data dokter ({doctor.name}) secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(doctor.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
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
                  <TableCell colSpan={6} className="text-center">
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
