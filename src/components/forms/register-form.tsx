"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { useState } from "react"
import { PawPrint } from "lucide-react"

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
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAuth, setDocumentNonBlocking } from "@/firebase"
import { Spinner } from "../ui/spinner"
import { useFirebase } from "@/firebase"
import { doc } from "firebase/firestore"

const registerFormSchema = z.object({
  name: z.string().min(1, "Nama harus diisi."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
})

type RegisterFormValues = z.infer<typeof registerFormSchema>

interface RegisterFormProps {
  onSwitchView: () => void;
}

export default function RegisterForm({ onSwitchView }: RegisterFormProps) {
  const { toast } = useToast()
  const auth = useAuth()
  const { firestore } = useFirebase()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user;

      // Create a doctor profile with the same UID
      const doctorRef = doc(firestore, "doctors", user.uid);
      const doctorData = {
        id: user.uid,
        name: data.name,
        email: data.email,
        gender: "", 
        address: "", 
        phoneNumber: "",
        schedule: [],
      };
      setDocumentNonBlocking(doctorRef, doctorData, { merge: true });

      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun Anda telah dibuat. Anda akan masuk secara otomatis.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Pendaftaran Gagal",
        description: error.message || "Terjadi kesalahan saat pendaftaran.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
       <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
            <PawPrint className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Daftar Akun Admin</CardTitle>
        <CardDescription>Buat akun baru untuk mengelola VetClinic Connect.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="admin@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2" />}
              Daftar
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 text-center text-sm">
        <p>
            Sudah punya akun?{" "}
            <Button variant="link" onClick={onSwitchView} className="p-0 h-auto">
              Masuk di sini
            </Button>
        </p>
      </CardFooter>
    </Card>
  )
}
