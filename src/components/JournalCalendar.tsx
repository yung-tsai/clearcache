import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, FileText, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Entry } from '@/lib/database.types';
import { format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';

interface JournalCalendarProps {
  onOpenEntry?: (entryId: string) => void;
}

export default function JournalCalendar({ onOpenEntry }: JournalCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [entriesForSelectedDate, setEntriesForSelectedDate] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    // Filter entries for selected date
    const dateEntries = entries.filter(entry => 
      isSameDay(new Date(entry.created_at), selectedDate)
    );
    setEntriesForSelectedDate(dateEntries);
  }, [selectedDate, entries]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.created_at), date)
    );
  };

  const extractTitle = (content: string | null): string => {
    if (!content) return 'Untitled Entry';
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const firstLine = textContent.split('\n')[0].trim();
    
    return firstLine || 'Untitled Entry';
  };

  const modifiers = {
    hasEntries: (date: Date) => getEntriesForDate(date).length > 0,
  };

  const modifiersStyles = {
    hasEntries: {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '50%',
      fontWeight: 'bold',
    },
  };

  return (
    <div className="flex gap-4 h-full">
      {/* Calendar Side */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="font-mono text-lg">Journal Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className="rounded-md border"
            />
            
            {/* Entry count summary */}
            <div className="mt-4 text-center">
              <div className="text-sm font-mono text-muted-foreground">
                Total entries: {entries.length}
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                Days with entries: {new Set(entries.map(e => format(new Date(e.created_at), 'yyyy-MM-dd'))).size}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries for Selected Date */}
      <div className="flex-1">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono text-lg">
                {format(selectedDate, 'MMMM d, yyyy')}
              </CardTitle>
              <Badge variant="secondary" className="font-mono">
                {entriesForSelectedDate.length} entries
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center font-mono text-muted-foreground">
                Loading...
              </div>
            ) : entriesForSelectedDate.length === 0 ? (
              <div className="text-center font-mono text-muted-foreground py-8">
                No entries on this date
              </div>
            ) : (
              entriesForSelectedDate.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onOpenEntry?.(entry.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-mono font-semibold text-sm truncate flex-1">
                      {extractTitle(entry.content)}
                    </h4>
                    <div className="flex items-center gap-2 ml-2">
                      {entry.audio_path && (
                        <Mic size={12} className="text-blue-500" />
                      )}
                      <FileText size={12} className="text-muted-foreground" />
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {format(new Date(entry.created_at), 'h:mm a')}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}