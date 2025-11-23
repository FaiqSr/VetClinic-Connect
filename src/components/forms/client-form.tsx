"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { collection, doc } from "firebase/firestore"
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
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useFirebase, setDocumentNonBlocking, useUser, initiateAnonymousSignIn } from "@/firebase"

const clientFormSchema = z.object({
  id: z.string().min(1, "ID Klien harus diisi."),
  name: z.string().min(1, "Nama Klien harus diisi."),
  address: z.string().min(1, "Alamat harus diisi."),
  phoneNumber: z.string().min(10, "Nomor HP minimal 10 digit.").max(15, "Nomor HP maksimal 15 digit."),
  visitDate: z.date({
    required_error: "Tanggal kunjungan harus diisi.",
  }),
  responsiblePerson: z.string().min(1, "Penanggung jawab harus diisi."),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

export default function ClientForm() {
  const { toast } = useToast()
  const { firestore, auth } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      id: "",
      name: "",
      address: "",
      phoneNumber: "",
      responsiblePerson: "",
    },
  })

  function onSubmit(data: ClientFormValues) {
     if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Firestore atau pengguna belum siap.",
      });
      return;
    }

    // This is a simplification. In a real app, you'd associate this
    // with a specific patient and doctor.
    const clientRef = doc(collection(firestore, "clients"), data.id);
    const dataToSave = {
        ...data,
        visitDate: data.visitDate.toISOString(),
    };
    setDocumentNonBlocking(clientRef, dataToSave, { merge: true });

    toast({
      title: "Data Klien Tersimpan",
      description: "Data klien telah berhasil disimpan ke Firestore.",
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Form Identitas Klien</CardTitle>
        <CardDescription>Masukkan detail informasi mengenai pemilik hewan.</CardDescription>
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
                    <FormLabel>ID Klien</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: KLIEN-001" {...field} />
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
                    <FormLabel>Nama Pemilik</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="Jl. Merdeka No. 10, Jakarta" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="081234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visitDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Tanggal Kunjungan</FormLabel>
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
                name="responsiblePerson"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Penanggung Jawab</FormLabel>
                    <FormControl>
                      <Input placeholder="Nama dokter atau staf yang bertanggung jawab" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <CardFooter className="flex justify-end p-0 pt-6">
                <Button type="submit" disabled={isUserLoading}>Simpan Data Klien</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
