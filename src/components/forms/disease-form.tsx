"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, doc } from "firebase/firestore"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useFirebase, setDocumentNonBlocking, useUser, initiateAnonymousSignIn } from "@/firebase"

const diseaseFormSchema = z.object({
  id: z.string().min(1, "Kode penyakit harus diisi."),
  name: z.string().min(1, "Nama penyakit harus diisi."),
  description: z.string().min(1, "Keterangan harus diisi."),
})

type DiseaseFormValues = z.infer<typeof diseaseFormSchema>

export default function DiseaseForm() {
  const { toast } = useToast()
  const { firestore, auth } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const form = useForm<DiseaseFormValues>({
    resolver: zodResolver(diseaseFormSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
    },
  })

  function onSubmit(data: DiseaseFormValues) {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore atau pengguna belum siap.",
      });
      return;
    }

    const diseaseRef = doc(collection(firestore, "diseases"), data.id);
    setDocumentNonBlocking(diseaseRef, data, { merge: true });

    toast({
      title: "Data Penyakit Tersimpan",
      description: "Data penyakit telah berhasil disimpan ke Firestore.",
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Form Informasi Penyakit</CardTitle>
        <CardDescription>Masukkan detail mengenai jenis-jenis penyakit.</CardDescription>
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
                    <FormLabel>Kode Penyakit</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PEN-001" {...field} />
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
                    <FormLabel>Nama Penyakit</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Flu Anjing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keterangan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan gejala, penyebab, dan penanganan umum penyakit ini."
                        className="resize-y min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit" disabled={isUserLoading}>Simpan Data Penyakit</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
