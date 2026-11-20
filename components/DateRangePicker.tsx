'use client';

import { CalendarDays, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { enIN } from 'date-fns/locale';

type Props = { from?: string; to?: string };

function parseDate(value?: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

function toInputDate(value?: Date) {
  if (!value) return '';
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function displayDate(value: Date) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(value);
}

export function DateRangePicker({ from, to }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({ from: parseDate(from), to: parseDate(to) });

  useEffect(() => {
    function close(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const label = range?.from
    ? range.to ? `${displayDate(range.from)} – ${displayDate(range.to)}` : `${displayDate(range.from)} മുതൽ`
    : 'തീയതി പരിധി തിരഞ്ഞെടുക്കുക';

  return (
    <div ref={rootRef} className="date-range-picker">
      <input type="hidden" name="from" value={toInputDate(range?.from)} />
      <input type="hidden" name="to" value={toInputDate(range?.to)} />
      <button type="button" className="date-range-trigger" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <CalendarDays aria-hidden="true" size={20} strokeWidth={1.9} />
        <span className={`min-w-0 flex-1 truncate text-left ${range?.from ? '' : 'text-slate-500'}`}>{label}</span>
      </button>
      {open && (
        <div className="date-range-popover" role="dialog" aria-label="തീയതി പരിധി തിരഞ്ഞെടുക്കുക">
          <div className="date-range-popover-head">
            <div><p className="font-bold text-emerald-950">തീയതി പരിധി</p><p className="text-sm text-slate-500">ആരംഭവും അവസാനവും തിരഞ്ഞെടുക്കുക</p></div>
            {range?.from && <button type="button" className="calendar-clear-button" aria-label="തീയതി മായ്ക്കുക" title="തീയതി മായ്ക്കുക" onClick={() => setRange(undefined)}><X aria-hidden="true" size={18} /></button>}
          </div>
          <DayPicker mode="range" selected={range} onSelect={setRange} locale={enIN} showOutsideDays className="mahall-calendar" />
          <button type="button" className="primary-button calendar-done-button" onClick={() => setOpen(false)}>പൂർത്തിയായി</button>
        </div>
      )}
    </div>
  );
}
