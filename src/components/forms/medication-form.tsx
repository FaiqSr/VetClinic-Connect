"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { doc } from "firebase/firestore"

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
import { useFirebase, setDocumentNonBlocking, useUser } from "@/firebase"

const medicationFormSchema = z.object({
  id: z.string().min(1, "Kode obat harus diisi."),
  type: z.string({ required_error: "Jenis obat harus dipilih." }),
  name: z.string().min(1, "Nama obat harus diisi."),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif."),
})

type MedicationFormValues = z.infer<typeof medicationFormSchema>

interface MedicationFormProps {
    initialData?: MedicationFormValues;
    isEditMode?: boolean;
    closeDialog?: () => void;
}

export default function MedicationForm({ initialData, isEditMode = false, closeDialog }: MedicationFormProps) {
  const { toast } = useToast()
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: initialData || {
      id: "",
      name: "",
      price: 0,
    },
  })

  function onSubmit(data: MedicationFormValues) {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Anda harus login sebagai admin untuk menyimpan data obat.",
      });
      return;
    }

    const medicationRef = doc(firestore, "medications", data.id);
    setDocumentNonBlocking(medicationRef, data, { merge: true });

    toast({
      title: isEditMode ? "Data Obat Diperbarui" : "Data Obat Tersimpan",
      description: `Data untuk obat ${data.name} telah berhasil disimpan.`,
    })
    
    if (closeDialog) {
        closeDialog();
    } else if (!isEditMode) {
        form.reset();
    }
  }

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
                <FormLabel>Kode Obat</FormLabel>
                <FormControl>
                    <Input placeholder="Contoh: OBAT-001" {...field} disabled={isEditMode} />
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
                <FormLabel>Nama Obat</FormLabel>
                <FormControl>
                    <Input placeholder="Contoh: Paracetamol 500mg" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Jenis Obat</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis obat" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Kapsul">Kapsul</SelectItem>
                    <SelectItem value="Sirup">Sirup</SelectItem>
                    <SelectItem value="Salep">Salep</SelectItem>
                    <SelectItem value="Injeksi">Injeksi</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Harga Obat (Rp)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="50000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <CardFooter className="flex justify-end p-0 pt-6">
            <Button type="submit" disabled={isUserLoading}>{isEditMode ? "Simpan Perubahan" : "Simpan Data Obat"}</Button>
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
            <CardTitle>Form Inventaris Obat</CardTitle>
            <CardDescription>Masukkan detail informasi mengenai stok obat-obatan.</CardDescription>
        </CardHeader>
        <CardContent>
            {formContent}
        </CardContent>
    </Wrapper>
  )
}
