"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useFirebase, addDocumentNonBlocking, useUser, initiateAnonymousSignIn } from "@/firebase"

const examinationFormSchema = z.object({
  date: z.date({
    required_error: "Tanggal periksa harus diisi.",
  }),
  doctorId: z.string().min(1, "Kode dokter harus diisi.").optional(),
  patientId: z.string().min(1, "Kode pasien harus diisi."),
  diseaseId: z.string().min(1, "Kode penyakit harus diisi."),
  complaints: z.string().min(1, "Keluhan harus diisi."),
  diagnosis: z.string().min(1, "Diagnosis harus diisi."),
})

type ExaminationFormValues = z.infer<typeof examinationFormSchema>

export default function ExaminationForm() {
  const { toast } = useToast()
  const { firestore, auth } = useFirebase();
  const { user, isUserLoading } = useUser();

 const form = useForm<ExaminationFormValues>({
    resolver: zodResolver(examinationFormSchema),
    defaultValues: {
      patientId: "",
      diseaseId: "",
      complaints: "",
      diagnosis: "",
    },
  })

 useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
    if (user) {
        form.setValue('doctorId', user.uid);
    }
  }, [isUserLoading, user, auth, form]);


  function onSubmit(data: ExaminationFormValues) {
     if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore atau pengguna belum siap.",
      });
      return;
    }
    
    const doctorId = data.doctorId || user.uid;
    const examinationRefPath = `doctors/${doctorId}/patients/${data.patientId}/examinations`;
    const dataToSave = {
        ...data,
        date: data.date.toISOString(),
        doctorId: doctorId,
    };
    addDocumentNonBlocking(firestore, examinationRefPath, dataToSave);

    toast({
      title: "Data Pemeriksaan Tersimpan",
      description: "Data pemeriksaan telah berhasil disimpan ke Firestore.",
    })
    form.reset();
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Form Pemeriksaan</CardTitle>
        <CardDescription>Catat hasil pemeriksaan pasien pada kunjungan ini.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Periksa</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pilih tanggal</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doctorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Dokter</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: DR-001" {...field} disabled={!!user}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Pasien</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PASIEN-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diseaseId"
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
                name="complaints"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Keluhan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan keluhan yang disampaikan oleh pemilik hewan."
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Diagnosis</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan diagnosis dari hasil pemeriksaan."
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit" disabled={isUserLoading}>Simpan Hasil Pemeriksaan</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
