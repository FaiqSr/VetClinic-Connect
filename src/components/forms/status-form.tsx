

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, collectionGroup, doc } from "firebase/firestore"

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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useFirebase, setDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase"

const statusFormSchema = z.object({
  id: z.string().optional(), // ID is optional, will be auto-generated
  patientId: z.string().min(1, "ID Pasien harus diisi."),
  actions: z.string().min(1, "Tindakan harus diisi."),
  behavior: z.string().min(1, "Tingkah laku harus diisi."),
  hydration: z.string().min(1, "Status hidrasi harus diisi."),
  posture: z.string().min(1, "Sikap berdiri harus diisi."),
  temperature: z.coerce.number().positive("Suhu tubuh harus angka positif."),
  heartRate: z.coerce.number().int().positive("Frekuensi jantung harus angka positif."),
  respiratoryRate: z.coerce.number().int().positive("Frekuensi nafas harus angka positif."),
})

type StatusFormValues = z.infer<typeof statusFormSchema>

interface Patient {
  id: string;
  name: string;
}

interface StatusFormProps {
    initialData?: StatusFormValues;
    isEditMode?: boolean;
    closeDialog?: () => void;
}

export default function StatusForm({ initialData, isEditMode = false, closeDialog }: StatusFormProps) {
  const { toast } = useToast()
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: initialData || {
      patientId: "",
      actions: "",
      behavior: "",
      hydration: "",
      posture: "",
    },
  })
  
  const patientsQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'patients') : null, [firestore]);
  const { data: patients, isLoading: isLoadingPatients } = useCollection<Patient>(patientsQuery);


  function onSubmit(data: StatusFormValues) {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda harus login untuk menyimpan data.",
      });
      return;
    }

    // Use existing ID for edit mode, or generate a new one for create mode
    const statusId = (isEditMode && data.id) ? data.id : doc(collection(firestore, 'dummy')).id;
    const statusRef = doc(firestore, `doctors/${user.uid}/patients/${data.patientId}/presentStatuses`, statusId);
    
    // Ensure the ID is part of the data being saved
    const dataToSave = { ...data, id: statusId };
    setDocumentNonBlocking(statusRef, dataToSave, { merge: true });
    
    toast({
      title: isEditMode ? "Data Status Diperbarui" : "Data Status Present Tersimpan",
      description: "Data status telah berhasil disimpan ke Firestore.",
    })
    
    if (closeDialog) {
        closeDialog();
    } else if (!isEditMode) {
        form.reset({
          patientId: "",
          actions: "",
          behavior: "",
          hydration: "",
          posture: "",
          temperature: 0,
          heartRate: 0,
          respiratoryRate: 0,
        });
    }
  }

  const Wrapper = isEditMode ? 'div' : Card;
  const wrapperProps = isEditMode ? {} : { className: "w-full max-w-4xl mx-auto" };
  const isLoading = isUserLoading || isLoadingPatients;

  const formContent = (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={isEditMode ? "space-y-8 p-1" : "space-y-8"}>
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pasien</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} disabled={isLoading || isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pasien" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Suhu Tubuh (°C)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" placeholder="38.5" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="heartRate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Frekuensi Jantung (bpm)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="120" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="respiratoryRate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Frekuensi Nafas (per menit)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
            control={form.control}
            name="hydration"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Hidrasi</FormLabel>
                <FormControl>
                    <Input placeholder="Baik, cukup, dehidrasi ringan" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="posture"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sikap Berdiri</FormLabel>
                <FormControl>
                    <Input placeholder="Normal, bungkuk, pincang" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="behavior"
            render={({ field }) => (
                <FormItem className="md:col-span-2">
                <FormLabel>Tingkah Laku</FormLabel>
                <FormControl>
                    <Textarea placeholder="Aktif, lesu, agresif, cemas, dll." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="actions"
            render={({ field }) => (
                <FormItem className="md:col-span-2">
                <FormLabel>Tindakan</FormLabel>
                <FormControl>
                    <Textarea placeholder="Tindakan awal yang dilakukan: pemeriksaan fisik, pemberian cairan, dll." {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <CardFooter className="flex justify-end p-0 pt-6">
            <Button type="submit" disabled={isLoading}>{isEditMode ? "Simpan Perubahan" : "Simpan Data Status"}</Button>
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
        <CardTitle>Form Status Present</CardTitle>
        <CardDescription>Catat status dan kondisi terkini pasien saat kunjungan.</CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Wrapper>
  )
}

    