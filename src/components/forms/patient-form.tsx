"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { doc } from "firebase/firestore"
import { useEffect } from "react"

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
import { useFirebase, setDocumentNonBlocking, useUser, initiateAnonymousSignIn } from "@/firebase"

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

export default function PatientForm() {
  const { toast } = useToast()
  const { firestore, auth } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      id: "",
      name: "",
      breed: "",
      species: "",
      age: 0,
      weight: 0,
    },
  })

  function onSubmit(data: PatientFormValues) {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore atau pengguna belum siap.",
      });
      return;
    }
    
    // Correct path based on firestore.rules
    const patientRef = doc(firestore, `doctors/${user.uid}/patients`, data.id);
    setDocumentNonBlocking(patientRef, data, { merge: true });

    toast({
      title: "Data Pasien Tersimpan",
      description: "Data pasien telah berhasil disimpan ke Firestore.",
    })
    form.reset();
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Form Identitas Pasien</CardTitle>
        <CardDescription>Masukkan detail informasi mengenai hewan pasien.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Pasien (Kode Pasien)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PASIEN-001" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Button type="submit" disabled={isUserLoading}>Simpan Data Pasien</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
