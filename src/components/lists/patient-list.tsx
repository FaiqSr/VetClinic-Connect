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
import { Pencil, Trash2, BookOpen, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import FormDialog from '../forms/form-dialog';
import PatientForm from '../forms/patient-form';
import { useState, useMemo } from 'react';
import { Input } from '../ui/input';

interface Patient {
  id: string;
  name: string;
  breed: string;
  species: string;
  age: number;
  weight: number;
  gender: string;
  __path: string;
}

interface PatientListProps {
  onSelectPatient: (patient: Patient) => void;
}


export function PatientList({ onSelectPatient }: PatientListProps) {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return collectionGroup(firestore, 'patients');
  }, [firestore, isUserLoading]);

  const { data: patients, isLoading: isPatientsLoading } = useCollection<Patient>(patientsQuery, { includePath: true });

  const isLoading = isPatientsLoading || isUserLoading;

  const filteredPatients = useMemo(() => {
    if (!patients) return [];
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  const handleDelete = (patient: Patient) => {
    if (!firestore || !patient.__path) return;
    const docRef = doc(firestore, patient.__path);
    deleteDocumentNonBlocking(docRef);
    toast({
        title: "Data Pasien Dihapus",
        description: `Pasien dengan nama ${patient.name} telah dihapus.`,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pasien</CardTitle>
        <CardDescription>Berikut adalah daftar semua pasien yang terdaftar di sistem. Anda dapat mencari berdasarkan nama atau ID.</CardDescription>
        <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Cari Pasien..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pasien</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis Hewan</TableHead>
              <TableHead>Ras</TableHead>
              <TableHead>Umur (Tahun)</TableHead>
              <TableHead>Berat (kg)</TableHead>
              <TableHead>Jenis Kelamin</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                </TableRow>
              ))}
            {!isLoading && filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <TableRow key={patient.__path}>
                  <TableCell className="font-medium whitespace-nowrap">{patient.id}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{patient.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{patient.species}</TableCell>
                  <TableCell className="whitespace-nowrap">{patient.breed}</TableCell>
                  <TableCell>{patient.age}</TableCell>
                  <TableCell>{patient.weight}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-2">
                       <Button variant="outline" size="sm" onClick={() => onSelectPatient(patient)}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Lihat Riwayat
                       </Button>
                       <FormDialog
                        title="Edit Pasien"
                        description="Ubah detail pasien di bawah ini."
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <PatientForm initialData={patient} isEditMode />
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
                              Tindakan ini tidak dapat diurungkan. Ini akan menghapus data pasien ({patient.name}) secara permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(patient)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
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
                  <TableCell colSpan={8} className="text-center">
                    {searchTerm ? `Tidak ada pasien yang cocok dengan "${searchTerm}".` : "Tidak ada data pasien."}
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
