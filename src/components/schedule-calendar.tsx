'use client';

import { useState, useMemo, useEffect } from 'react';
import { collectionGroup, onSnapshot, QuerySnapshot, DocumentData, Unsubscribe, FirestoreError, collection } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
}

interface Doctor {
  id: string;
  name: string;
  schedule: Schedule[];
}

interface CalendarEvent {
  date: Date;
  title: string;
  type: 'visit' | 'exam';
  doctorName?: string;
  patientName?: string;
}

const dayNameToNumber: { [key: string]: number } = {
  'minggu': 0,
  'senin': 1,
  'selasa': 2,
  'rabu': 3,
  'kamis': 4,
  'jumat': 5,
  'sabtu': 6,
};

const daysOfWeek = [
    { name: 'Senin', value: 1 },
    { name: 'Selasa', value: 2 },
    { name: 'Rabu', value: 3 },
    { name: 'Kamis', value: 4 },
    { name: 'Jumat', value: 5 },
    { name: 'Sabtu', value: 6 },
    { name: 'Minggu', value: 0 },
];

export function ScheduleCalendar() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [appointmentEvents, setAppointmentEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  const doctorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'doctors');
  }, [firestore]);
  const { data: doctors, isLoading: isLoadingDoctors } = useCollection<Doctor>(doctorsQuery);

  useEffect(() => {
    if (!firestore || !user) return;

    setIsLoadingAppointments(true);
    const unsubscribes: Unsubscribe[] = [];

    const processSnapshot = (snapshot: QuerySnapshot<DocumentData>, type: 'visit' | 'exam') => {
      const fetchedEvents: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const dateKey = type === 'visit' ? 'visitDate' : 'date';
        if (data[dateKey]) {
          fetchedEvents.push({
            date: new Date(data[dateKey]),
            title: type === 'visit' ? `Kunjungan: ${data.name}` : `Pemeriksaan: ${data.patientId}`,
            type: type,
          });
        }
      });
      return fetchedEvents;
    };
    
    const handleError = (error: FirestoreError, path: string) => {
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: path
        });
        errorEmitter.emit('permission-error', contextualError);
    };

    const clientQuery = collectionGroup(firestore, 'clients');
    const examQuery = collectionGroup(firestore, 'examinations');
    
    let clientEvents: CalendarEvent[] = [];
    let examEvents: CalendarEvent[] = [];

    const clientUnsubscribe = onSnapshot(clientQuery, 
        (snapshot) => {
            clientEvents = processSnapshot(snapshot, 'visit');
            setAppointmentEvents([...clientEvents, ...examEvents]);
            setIsLoadingAppointments(false);
        },
        (error) => {
            handleError(error, 'clients');
            setIsLoadingAppointments(false);
        }
    );
    unsubscribes.push(clientUnsubscribe);

    const examUnsubscribe = onSnapshot(examQuery, 
        (snapshot) => {
            examEvents = processSnapshot(snapshot, 'exam');
            setAppointmentEvents([...clientEvents, ...examEvents]);
            setIsLoadingAppointments(false);
        },
        (error) => {
            handleError(error, 'examinations');
            setIsLoadingAppointments(false);
        }
    );
    unsubscribes.push(examUnsubscribe);


    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [firestore, user]);
  
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const schedulesByDay = useMemo(() => {
    const schedules: { [key: number]: { doctor: Doctor, schedule: Schedule }[] } = {};
    if (doctors) {
      doctors.forEach(doctor => {
        doctor.schedule?.forEach(slot => {
          const dayIndex = dayNameToNumber[slot.day.toLowerCase()];
          if (schedules[dayIndex] === undefined) {
            schedules[dayIndex] = [];
          }
          schedules[dayIndex].push({ doctor, schedule: slot });
        });
      });
    }
    return schedules;
  }, [doctors]);

  const appointmentsByDay = useMemo(() => {
    const appointments: { [key: string]: CalendarEvent[] } = {};
    appointmentEvents.forEach(event => {
        const dateString = format(event.date, 'yyyy-MM-dd');
        if (!appointments[dateString]) {
            appointments[dateString] = [];
        }
        appointments[dateString].push(event);
    });
    return appointments;
  }, [appointmentEvents]);


  const goToPreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const goToNextWeek = () => setCurrentDate(prev => addDays(prev, 7));

  const displayLoading = isLoadingAppointments || isLoadingDoctors || isUserLoading;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
                <CardTitle>Jadwal Mingguan Dokter</CardTitle>
                <CardDescription className="mt-1">
                    Menampilkan jadwal praktik dan janji temu untuk minggu ini.
                </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-48 text-center">
                    {format(weekDates[0], 'd MMM', { locale: id })} - {format(weekDates[6], 'd MMM yyyy', { locale: id })}
                </span>
                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {displayLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
                 {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="p-2 border rounded-lg min-h-[200px]">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <Skeleton className="h-10 w-full mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2 items-start">
                {weekDates.map(date => {
                    const dayIndex = date.getDay();
                    const daySchedules = schedulesByDay[dayIndex] || [];
                    const dayAppointments = appointmentsByDay[format(date, 'yyyy-MM-dd')] || [];

                    return (
                        <div key={date.toString()} className="border rounded-lg p-3 bg-muted/50 min-h-[200px]">
                            <h3 className="font-semibold text-center mb-1">{format(date, 'EEEE', { locale: id })}</h3>
                            <p className="text-xs text-muted-foreground text-center mb-3">{format(date, 'd MMM', { locale: id })}</p>
                            <div className="space-y-3">
                                {daySchedules.length > 0 && (
                                    <div className="space-y-1">
                                         <h4 className="text-xs font-bold text-primary">Jadwal Praktek</h4>
                                         {daySchedules.sort((a,b) => a.schedule.startTime.localeCompare(b.schedule.startTime)).map(({ doctor, schedule }, i) => (
                                            <div key={i} className="text-xs p-2 bg-background rounded-md shadow-sm">
                                                <p className="font-semibold">{doctor.name}</p>
                                                <p className="text-muted-foreground">{schedule.startTime} - {schedule.endTime}</p>
                                            </div>
                                         ))}
                                    </div>
                                )}
                                {dayAppointments.length > 0 && (
                                    <div className="space-y-1">
                                        <h4 className="text-xs font-bold text-green-600">Janji Temu</h4>
                                        {dayAppointments.map((event, i) => (
                                             <div key={i} className="text-xs p-2 bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 rounded-md">
                                                <p className="font-semibold">{event.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {daySchedules.length === 0 && dayAppointments.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center pt-4">Tidak ada jadwal.</p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
