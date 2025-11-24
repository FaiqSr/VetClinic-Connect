
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc } from "firebase/firestore"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useFirebase, setDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase"

const patientFormSchema = z.object({
  id: z.string().min(1, "ID Pasien harus diisi."),
  name: z.string().min(1, "Nama pasien harus diisi."),
  breed: z.string().min(1, "Ras harus diisi."),
  species: z.string().min(1, "Jenis hewan harus diisi."),
  age: z.coerce.number().int().positive("Umur harus angka positif."),
  weight: z.coerce.number().positive("Berat badan harus angka positif."),
  gender: z.string({
    required_error: "Jenis kelamin harus dipilih.",
  }),
})

type PatientFormValues = z.infer<typeof patientFormSchema>

interface Patient {
    id: string;
}
interface PatientFormProps {
    initialData?: PatientFormValues;
    isEditMode?: boolean;
    closeDialog?: () => void;
}

export default function PatientForm({ initialData, isEditMode = false, closeDialog }: PatientFormProps) {
  const { toast } = useToast()
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: initialData || {
      id: "",
      name: "",
      breed: "",
      species: "",
      age: 0,
      weight: 0,
    },
  })

  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `doctors/${user.uid}/patients`);
  }, [firestore, user]);

  const { data: patients, isLoading: isLoadingPatients } = useCollection<Patient>(patientsQuery);

  function onSubmit(data: PatientFormValues) {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda harus login untuk menyimpan data.",
      });
      return;
    }

    if (!isEditMode && patients?.some(p => p.id === data.id)) {
        form.setError("id", {
            type: "manual",
            message: "ID Pasien sudah digunakan.",
        });
        return;
    }
    
    const patientRef = doc(firestore, `doctors/${user.uid}/patients`, data.id);
    setDocumentNonBlocking(patientRef, data, { merge: true });

    toast({
      title: isEditMode ? "Data Pasien Diperbarui" : "Data Pasien Tersimpan",
      description: `Data untuk pasien ${data.name} telah berhasil disimpan.`,
    })
    
    if (closeDialog) {
        closeDialog();
    } else if (!isEditMode) {
        form.reset();
    }
  }

  const isLoading = isUserLoading || isLoadingPatients;
  const Wrapper = isEditMode ? 'div' : Card;
  const wrapperProps = isEditMode ? {} : { className: "w-full max-w-4xl mx-auto" };

  const formContent = (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={isEditMode ? "space-y-8 p-1" : "space-y-8"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
                <FormItem>
                <FormLabel>ID Pasien (Kode Pasien)</FormLabel>
                <FormControl>
                    <Input placeholder="Contoh: PASIEN-001" {...field} disabled={isEditMode} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nama Pasien</FormLabel>
                <FormControl>
                    <Input placeholder="Contoh: Mochi" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Jenis Hewan</FormLabel>
                <FormControl>
                    <Input placeholder="Contoh: Anjing, Kucing" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Ras</FormLabel>
                <FormControl>
                    <Input placeholder="Contoh: Golden Retriever, Persia" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Umur (Tahun)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="3" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Berat Badan (kg)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder="5.5" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Jenis Kelamin</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis kelamin" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Jantan">Jantan</SelectItem>
                    <SelectItem value="Betina">Betina</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <CardFooter className="flex justify-end p-0 pt-6">
            <Button type="submit" disabled={isLoading}>{isEditMode ? "Simpan Perubahan" : "Simpan Data Pasien"}</Button>
        </CardFooter>
        </form>
    </Form>
  );

  if (isEditMode) {
    return formContent;
  }

  return (
    <Wrapper {...wrapperProps}>
        <CardHeader>
            <CardTitle>Form Identitas Pasien</CardTitle>
            <CardDescription>Masukkan detail informasi mengenai hewan pasien.</CardDescription>
        </CardHeader>
        <CardContent>
            {formContent}
        </CardContent>
    </Wrapper>
  )
}
