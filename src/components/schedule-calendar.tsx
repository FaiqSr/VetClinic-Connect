'use client';

import { useState, useMemo, useEffect } from 'react';
import { collectionGroup, onSnapshot, QuerySnapshot, DocumentData, Unsubscribe, FirestoreError } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

interface CalendarEvent {
  date: Date;
  title: string;
  type: 'visit' | 'exam';
}

export function ScheduleCalendar() {
  const { firestore } = useFirebase();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!firestore) return;

    setIsLoading(true);
    const unsubscribes: Unsubscribe[] = [];

    const processSnapshot = (snapshot: QuerySnapshot<DocumentData>, type: 'visit' | 'exam') => {
      const fetchedEvents: CalendarEvent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const dateKey = type === 'visit' ? 'visitDate' : 'date';
        if (data[dateKey]) {
          fetchedEvents.push({
            date: new Date(data[dateKey]),
            title: type === 'visit' ? `Kunjungan: ${data.name}` : `Pemeriksaan Pasien: ${data.patientId}`,
            type: type,
          });
        }
      });
      return fetchedEvents;
    };
    
    const handleError = (error: FirestoreError, path: string) => {
        console.error(`Error fetching ${path} data:`, error);
        const contextualError = new FirestorePermissionError({
            operation: 'list',
            path: path
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({
            variant: 'destructive',
            title: `Gagal memuat data ${path}`,
            description: 'Anda tidak memiliki izin untuk melihat data ini.',
        });
    };

    const clientQuery = collectionGroup(firestore, 'clients');
    const examQuery = collectionGroup(firestore, 'examinations');
    
    let clientEvents: CalendarEvent[] = [];
    let examEvents: CalendarEvent[] = [];

    const clientUnsubscribe = onSnapshot(clientQuery, 
        (snapshot) => {
            clientEvents = processSnapshot(snapshot, 'visit');
            setEvents([...clientEvents, ...examEvents]);
            setIsLoading(false);
        },
        (error) => {
            handleError(error, 'clients');
            setIsLoading(false);
        }
    );
    unsubscribes.push(clientUnsubscribe);

    const examUnsubscribe = onSnapshot(examQuery, 
        (snapshot) => {
            examEvents = processSnapshot(snapshot, 'exam');
            setEvents([...clientEvents, ...examEvents]);
            setIsLoading(false);
        },
        (error) => {
            handleError(error, 'examinations');
            setIsLoading(false);
        }
    );
    unsubscribes.push(examUnsubscribe);


    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [firestore, toast]);
  
  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
        const dateString = event.date.toDateString();
        if (!acc[dateString]) {
            acc[dateString] = [];
        }
        acc[dateString].push(event);
        return acc;
    }, {} as Record<string, CalendarEvent[]>);
  }, [events]);


  const DayWithEvents = ({ date, ...props }: { date: Date } & any) => {
    const dateString = date.toDateString();
    const dayEvents = eventsByDate[dateString] || [];
    
    return (
      <div {...props}>
        <div className="relative flex items-center justify-center h-full w-full">
            <span>{date.getDate()}</span>
            {dayEvents.length > 0 && (
                <div className="absolute -bottom-1 flex space-x-0.5">
                    {dayEvents.slice(0, 3).map((event, index) => (
                        <div key={index} className={`h-1 w-1 rounded-full ${event.type === 'visit' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                    ))}
                </div>
            )}
        </div>
      </div>
    );
  };
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const selectedDayEvents = selectedDate ? eventsByDate[selectedDate.toDateString()] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
                <Skeleton className="w-full h-[300px]" />
            </div>
          ) : (
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-0 [&_td]:w-14 [&_td]:h-14 [&_th]:w-14"
                components={{
                    Day: DayWithEvents
                }}
            />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Detail Jadwal</CardTitle>
          <CardDescription>
            {selectedDate ? selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) : 'Pilih tanggal'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                 <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                 </div>
            ) : selectedDayEvents && selectedDayEvents.length > 0 ? (
                <ul className="space-y-2">
                    {selectedDayEvents.map((event, index) => (
                        <li key={index} className="p-2 rounded-md bg-muted">
                            <Badge variant={event.type === 'visit' ? 'secondary' : 'default'} className="mr-2">
                                {event.type === 'visit' ? 'Kunjungan' : 'Pemeriksaan'}
                            </Badge>
                            <span className="text-sm">{event.title}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">Tidak ada jadwal pada tanggal ini.</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
