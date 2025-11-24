"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { signInWithEmailAndPassword } from "firebase/auth"
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
import { useAuth } from "@/firebase"
import { Spinner } from "../ui/spinner"

const loginFormSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

interface LoginFormProps {
  onSwitchView: () => void;
}

export default function LoginForm({ onSwitchView }: LoginFormProps) {
  const { toast } = useToast()
  const auth = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      toast({
        title: "Login Berhasil",
        description: "Selamat datang kembali!",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: error.message || "Terjadi kesalahan saat login.",
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
        <CardTitle className="text-2xl">Login Admin</CardTitle>
        <CardDescription>Masuk untuk mengelola Pawvet Connect.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              Masuk
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 text-center text-sm">
         <p>
            Belum punya akun?{" "}
            <Button variant="link" onClick={onSwitchView} className="p-0 h-auto">
              Daftar di sini
            </Button>
          </p>
      </CardFooter>
    </Card>
  )
}
