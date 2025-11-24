"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { collection, collectionGroup, doc } from "firebase/firestore"
import Select from "react-select"

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
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useFirebase, setDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase"

// Schemas for fetching data
interface Doctor { id: string; name: string; }
interface Patient { id: string; name: string; }
interface Disease { id: string; name: string; }

const examinationFormSchema = z.object({
  id: z.string().optional(),
  date: z.date({
    required_error: "Tanggal periksa harus diisi.",
  }),
  doctorId: z.string().min(1, "Dokter harus dipilih."),
  patientId: z.string().min(1, "Pasien harus dipilih."),
  diseaseIds: z.array(z.string()).min(1, "Minimal satu penyakit harus dipilih."),
  complaints: z.string().min(1, "Keluhan harus diisi."),
  diagnosis: z.string().min(1, "Diagnosis harus diisi."),
})

type ExaminationFormValues = z.infer<typeof examinationFormSchema>

interface ExaminationFormProps {
    initialData?: ExaminationFormValues;
    isEditMode?: boolean;
    closeDialog?: () => void;
}

export default function ExaminationForm({ initialData, isEditMode = false, closeDialog }: ExaminationFormProps) {
  const { toast } = useToast()
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();

  // Fetch data for selects
  const doctorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'doctors') : null, [firestore]);
  const patientsQuery = useMemoFirebase(() => firestore ? collectionGroup(firestore, 'patients') : null, [firestore]);
  const diseasesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'diseases') : null, [firestore]);

  const { data: doctors, isLoading: loadingDoctors } = useCollection<Doctor>(doctorsQuery);
  const { data: patients, isLoading: loadingPatients } = useCollection<Patient>(patientsQuery);
  const { data: diseases, isLoading: loadingDiseases } = useCollection<Disease>(diseasesQuery);

 const form = useForm<ExaminationFormValues>({
    resolver: zodResolver(examinationFormSchema),
    defaultValues: initialData || {
      doctorId: "",
      patientId: "",
      diseaseIds: [],
      complaints: "",
      diagnosis: "",
    },
  })

 useEffect(() => {
    if (user && !form.getValues('doctorId') && !initialData) {
        form.setValue('doctorId', user.uid);
    }
  }, [user, form, initialData]);


  function onSubmit(data: ExaminationFormValues) {
     if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda harus login untuk menyimpan data.",
      });
      return;
    }
    
    // The doctorId for the path is the logged-in user
    const loggedInDoctorId = user.uid;
    // Use existing ID for edit, or generate a new one for create
    const examId = isEditMode && data.id ? data.id : doc(collection(firestore, 'dummy')).id;

    const examinationDocRef = doc(firestore, `doctors/${loggedInDoctorId}/patients/${data.patientId}/examinations`, examId);
    
    const dataToSave = {
        ...data,
        id: examId, // ensure id is part of the data
        date: data.date.toISOString(),
    };
    setDocumentNonBlocking(examinationDocRef, dataToSave, { merge: true });

    toast({
      title: isEditMode ? "Data Pemeriksaan Diperbarui" : "Data Pemeriksaan Tersimpan",
      description: "Data pemeriksaan telah berhasil disimpan ke Firestore.",
    })
    
     if (closeDialog) {
        closeDialog();
    } else if (!isEditMode) {
       form.reset({
        doctorId: user.uid,
        patientId: "",
        diseaseIds: [],
        complaints: "",
        diagnosis: "",
        date: new Date(),
      });
    }
  }

  const diseaseOptions = diseases?.map(d => ({ value: d.id, label: `${d.id} - ${d.name}` })) || [];
  
  const isLoading = isUserLoading || loadingDoctors || loadingPatients || loadingDiseases;
  
  const Wrapper = isEditMode ? 'div' : Card;
  const wrapperProps = isEditMode ? {} : { className: "w-full max-w-4xl mx-auto" };

  const formContent = (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={isEditMode ? "space-y-8 p-1" : "space-y-8"}>
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
                <FormLabel>Dokter Pemeriksa</FormLabel>
                    <ShadSelect onValueChange={field.onChange} value={field.value} disabled={isLoading || isEditMode}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Dokter" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {doctors?.map(doc => <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>)}
                    </SelectContent>
                </ShadSelect>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="patientId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Pasien</FormLabel>
                <ShadSelect onValueChange={field.onChange} value={field.value} disabled={isLoading || isEditMode}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih Pasien" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>)}
                    </SelectContent>
                </ShadSelect>
                <FormMessage />
                </FormItem>
            )}
            />
            
            <div className="md:col-span-2">
            <FormField
                control={form.control}
                name="diseaseIds"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Penyakit</FormLabel>
                    <FormControl>
                        <Controller
                            name="diseaseIds"
                            control={form.control}
                            render={({ field }) => (
                                <Select
                                    isMulti
                                    options={diseaseOptions}
                                    isLoading={loadingDiseases}
                                    value={diseaseOptions.filter(opt => field.value?.includes(opt.value))}
                                    onChange={opts => field.onChange(opts.map(opt => opt.value))}
                                    className="text-sm"
                                    classNamePrefix="select"
                                />
                            )}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>

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
            <Button type="submit" disabled={isLoading}>{isEditMode ? "Simpan Perubahan" : "Simpan Hasil Pemeriksaan"}</Button>
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
            <CardTitle>Form Pemeriksaan</CardTitle>
            <CardDescription>Catat hasil pemeriksaan pasien pada kunjungan ini.</CardDescription>
        </CardHeader>
        <CardContent>
            {formContent}
        </CardContent>
    </Wrapper>
  )
}
