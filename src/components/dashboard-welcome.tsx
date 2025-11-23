"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { PawPrint } from "lucide-react"

export function DashboardWelcome() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-2xl text-center shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <PawPrint className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Selamat Datang di VetClinic Connect</CardTitle>
          <CardDescription className="text-lg">
            Sistem Manajemen Rekam Medis Klinik Hewan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Pilih menu dari panel navigasi di sebelah kiri untuk mulai mengelola data pasien, klien, pemeriksaan, dan lainnya.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
