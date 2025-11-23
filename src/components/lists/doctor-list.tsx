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
import { Trash2 } from 'lucide-react';
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
  const { user, isUserLoading: isUserLoadingAuth } = useUser();
  const { toast } = useToast();

  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'doctors');
  }, [firestore, user]);

  const { data: doctors, isLoading: isDoctorsLoading } = useCollection<Doctor>(doctorsQuery);

  const displayLoading = isDoctorsLoading || isUserLoadingAuth;
  
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
      <CardContent>
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
                   <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
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
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                       {doctor.schedule?.map((s, index) => (
                        <Badge key={index} variant="secondary" className="whitespace-nowrap">
                          {s.day}: {s.startTime} - {s.endTime}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                   <TableCell className="text-right">
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
                            Tindakan ini tidak dapat diurungkan. Ini akan menghapus data dokter secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(doctor.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              !displayLoading && (
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
