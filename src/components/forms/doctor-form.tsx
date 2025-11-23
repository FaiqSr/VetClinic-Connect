"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { doc } from "firebase/firestore"
import { PlusCircle, XCircle } from "lucide-react"

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
import { Separator } from "../ui/separator"

const scheduleSchema = z.object({
  day: z.string().min(1, "Hari harus dipilih."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam tidak valid."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam tidak valid."),
})

const doctorFormSchema = z.object({
  id: z.string().min(1, "ID Dokter harus diisi"),
  name: z.string().min(1, "Nama dokter harus diisi."),
  gender: z.string({ required_error: "Jenis kelamin harus dipilih." }),
  address: z.string().min(1, "Alamat harus diisi."),
  phoneNumber: z.string().min(10, "Nomor HP minimal 10 digit.").max(15, "Nomor HP maksimal 15 digit."),
  schedule: z.array(scheduleSchema).min(1, "Minimal harus ada satu jadwal."),
})

type DoctorFormValues = z.infer<typeof doctorFormSchema>

const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function DoctorForm() {
  const { toast } = useToast()
  const { firestore } = useFirebase()
  const { user, isUserLoading } = useUser();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      id: "",
      name: "",
      address: "",
      phoneNumber: "",
      schedule: [{ day: "Senin", startTime: "09:00", endTime: "17:00" }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedule",
  });

  function onSubmit(data: DoctorFormValues) {
    if (!firestore || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Anda harus login untuk menyimpan data.",
        });
        return;
    }

    const doctorRef = doc(firestore, "doctors", data.id);
    setDocumentNonBlocking(doctorRef, data, { merge: true });

    toast({
      title: "Data Dokter Tersimpan",
      description: "Data dokter telah berhasil disimpan atau diperbarui.",
    })
    form.reset();
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Form Data Dokter</CardTitle>
        <CardDescription>Masukkan detail informasi mengenai profil dokter.</CardDescription>
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
                    <FormLabel>ID Dokter</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: DOK-001" {...field} />
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
                    <FormLabel>Nama Dokter</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. John Smith" {...field} />
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
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor HP</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="081234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Input placeholder="Jl. Profesional No. 1, Jakarta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <FormLabel>Jadwal Dokter</FormLabel>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-md relative">
                    <FormField
                      control={form.control}
                      name={`schedule.${index}.day`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hari</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih hari" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`schedule.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jam Mulai</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`schedule.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jam Selesai</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                        <XCircle />
                        <span className="sr-only">Hapus Jadwal</span>
                      </Button>
                </div>
              ))}
               <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ day: "Senin", startTime: "09:00", endTime: "17:00" })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Jadwal
              </Button>
               <FormField
                  control={form.control}
                  name="schedule"
                  render={() => (
                     <FormItem>
                        <FormMessage />
                     </FormItem>
                  )}
               />
            </div>
            
            <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit" disabled={isUserLoading}>Simpan Data Dokter</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
