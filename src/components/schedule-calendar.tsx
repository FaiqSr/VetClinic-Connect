'use client';

import { useState, useMemo } from 'react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

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

  useMemo(async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const clientQuery = collectionGroup(firestore, 'clients');
      const examQuery = collectionGroup(firestore, 'examinations');

      const [clientSnapshot, examSnapshot] = await Promise.all([
        getDocs(clientQuery),
        getDocs(examQuery),
      ]);

      const fetchedEvents: CalendarEvent[] = [];

      clientSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.visitDate) {
          fetchedEvents.push({
            date: new Date(data.visitDate),
            title: `Kunjungan: ${data.name}`,
            type: 'visit',
          });
        }
      });

      examSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date) {
          fetchedEvents.push({
            date: new Date(data.date),
            title: `Pemeriksaan Pasien: ${data.patientId}`,
            type: 'exam',
          });
        }
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat data jadwal',
        description: 'Terjadi kesalahan saat mengambil data dari Firestore.',
      });
    } finally {
      setIsLoading(false);
    }
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
