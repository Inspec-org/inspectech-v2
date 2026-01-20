'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  width?: string;
  min?: string;
  max?: string;
}

export default function DatePickerDropdown({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  width,
  min,
  max,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0, placement: 'bottom' as 'top' | 'bottom' });

  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const toStr = (y: number, m: number, d: number) => `${String(y)}-${pad(m)}-${pad(d)}`;

  const initial = (() => {
    if (value) {
      const [yy, mm] = value.split('-').map((n) => parseInt(n));
      return { y: yy || today.getFullYear(), m: mm || (today.getMonth() + 1) };
    }
    return { y: today.getFullYear(), m: today.getMonth() + 1 };
  })();

  const [year, setYear] = useState(initial.y);
  const [month, setMonth] = useState(initial.m);
  const [view, setView] = useState<'day' | 'month' | 'year'>('day');
  const [yearRangeStart, setYearRangeStart] = useState<number>(initial.y - 11);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const updatePosition = () => {
      if (isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldFlip = spaceBelow < 260;
        setCoords({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
          bottom: window.innerHeight - rect.top,
          placement: shouldFlip ? 'top' : 'bottom',
        });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, { capture: true });
      window.addEventListener('resize', updatePosition);
      updatePosition();
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    left: coords.left,
    width: width || coords.width,
    zIndex: 100000,
    ...(coords.placement === 'top'
      ? { bottom: coords.bottom + 4, top: 'auto' }
      : { top: coords.top + 4, bottom: 'auto' }),
  };

  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldFlip = spaceBelow < 260;
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
        bottom: window.innerHeight - rect.top,
        placement: shouldFlip ? 'top' : 'bottom',
      });
    }
    setIsOpen(!isOpen);
  };

  const selectedLabel = value || placeholder;

  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
  const startDay = new Date(year, month - 1, 1).getDay();

  const cmp = (a?: string, b?: string) => {
    if (!a || !b) return 0;
    return a < b ? -1 : a > b ? 1 : 0;
  };

  const maxStr = max;
  const minStr = min;

  const canGoPrevMonth = (() => {
    if (!minStr) return true;
    const first = toStr(year, month, 1);
    return cmp(first, minStr) > 0;
  })();

  const canGoNextMonth = (() => {
    if (!maxStr) return true;
    const nextFirst = toStr(month + 1 > 12 ? year + 1 : year, month + 1 > 12 ? 1 : month + 1, 1);
    return cmp(nextFirst, maxStr) <= 0;
  })();

  const canGoPrevYear = (() => {
    if (!minStr) return true;
    const lastPrev = toStr(year - 1, 12, 31);
    return cmp(lastPrev, minStr) >= 0;
  })();

  const canGoNextYear = (() => {
    if (!maxStr) return true;
    const firstNext = toStr(year + 1, 1, 1);
    return cmp(firstNext, maxStr) <= 0;
  })();

  const handleSelectDay = (d: number) => {
    const v = toStr(year, month, d);
    if (minStr && cmp(v, minStr) < 0) return;
    if (maxStr && cmp(v, maxStr) > 0) return;
    onChange?.(v);
    setIsOpen(false);
  };

  const handleSelectCell = (t: 'prev' | 'cur' | 'next', d: number) => {
    let y = year;
    let m = month;
    if (t === 'prev') { if (month === 1) { y = year - 1; m = 12; } else { m = month - 1; } }
    else if (t === 'next') { if (month === 12) { y = year + 1; m = 1; } else { m = month + 1; } }
    const v = toStr(y, m, d);
    if (minStr && cmp(v, minStr) < 0) return;
    if (maxStr && cmp(v, maxStr) > 0) return;
    onChange?.(v);
    setIsOpen(false);
  };

  const isMonthDisabled = (y: number, m: number) => {
    const first = toStr(y, m, 1);
    const last = toStr(y, m, daysInMonth(y, m));
    if (minStr && cmp(last, minStr) < 0) return true;
    if (maxStr && cmp(first, maxStr) > 0) return true;
    return false;
  };

  const isYearDisabled = (y: number) => {
    const first = toStr(y, 1, 1);
    const last = toStr(y, 12, 31);
    if (minStr && cmp(last, minStr) < 0) return true;
    if (maxStr && cmp(first, maxStr) > 0) return true;
    return false;
  };

  const handleSelectMonth = (m: number) => {
    if (isMonthDisabled(year, m)) return;
    setMonth(m);
    setView('day');
  };

  const handleSelectYear = (y: number) => {
    if (isYearDisabled(y)) return;
    setYear(y);
    setView('month');
  };

  type Cell = { t: 'prev' | 'cur' | 'next'; d: number };
  const prevMonth = month - 1 < 1 ? 12 : month - 1;
  const prevYear = month - 1 < 1 ? year - 1 : year;
  const nextMonth = month + 1 > 12 ? 1 : month + 1;
  const nextYear = month + 1 > 12 ? year + 1 : year;
  const prevDaysCount = daysInMonth(prevYear, prevMonth);
  const leadingCells: Cell[] = Array.from({ length: startDay }, (_, i) => ({ t: 'prev', d: prevDaysCount - startDay + i + 1 }));
  const currentCells: Cell[] = Array.from({ length: daysInMonth(year, month) }, (_, i) => ({ t: 'cur', d: i + 1 }));
  const total = leadingCells.length + currentCells.length;
  const trailingCount = 42 - total;
  const trailingCells: Cell[] = Array.from({ length: trailingCount }, (_, i) => ({ t: 'next', d: i + 1 }));
  const cells: Cell[] = [...leadingCells, ...currentCells, ...trailingCells];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        style={width ? { width } : undefined}
        className={`px-3 py-2 text-left rounded-lg flex items-center justify-between border ${width ? '' : 'w-full'} ${
          disabled ? 'bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed' : ' text-gray-700 hover:border-gray-400'
        }`}
      >
        <span className={value ? 'text-gray-700' : 'text-gray-500'}>{selectedLabel}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100000] mt-1 bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg p-2 w-[260px]"
            style={dropdownStyle}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  if (view === 'day') {
                    if (!canGoPrevMonth) return;
                    const nm = month - 1 < 1 ? 12 : month - 1;
                    const ny = month - 1 < 1 ? year - 1 : year;
                    setMonth(nm);
                    setYear(ny);
                  } else if (view === 'month') {
                    if (!canGoPrevYear) return;
                    setYear(year - 1);
                  } else {
                    setYearRangeStart(yearRangeStart - 12);
                  }
                }}
                className="p-1"
              >
                <ChevronLeft size={16} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView(view === 'year' ? 'day' : 'year')}
                  className="px-3 py-1 border rounded text-sm font-medium bg-white"
                >
                  {year}
                </button>
                <button
                  type="button"
                  onClick={() => setView(view === 'month' ? 'day' : 'month')}
                  className="px-3 py-1 border rounded text-sm font-medium bg-white"
                >
                  {String(month).padStart(2, '0')}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (view === 'day') {
                    if (!canGoNextMonth) return;
                    const nm = month + 1 > 12 ? 1 : month + 1;
                    const ny = month + 1 > 12 ? year + 1 : year;
                    setMonth(nm);
                    setYear(ny);
                  } else if (view === 'month') {
                    if (!canGoNextYear) return;
                    setYear(year + 1);
                  } else {
                    setYearRangeStart(yearRangeStart + 12);
                  }
                }}
                className="p-1"
              >
                <ChevronRight size={16} className="text-gray-700" />
              </button>
            </div>
            {view === 'day' && (
              <>
                <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
                    <div key={d} className="w-6 h-6 flex items-center justify-center">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((c, idx) => {
                    const y = c.t === 'prev' ? (month === 1 ? year - 1 : year) : c.t === 'next' ? (month === 12 ? year + 1 : year) : year;
                    const m = c.t === 'prev' ? (month === 1 ? 12 : month - 1) : c.t === 'next' ? (month === 12 ? 1 : month + 1) : month;
                    const v = toStr(y, m, c.d);
                    const disabled = (minStr && cmp(v, minStr) < 0) || (maxStr && cmp(v, maxStr) > 0);
                    const selected = value === v;
                    const tint = c.t === 'cur' ? '' : 'text-gray-400';
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => !disabled && handleSelectCell(c.t, c.d)}
                        className={`w-6 h-6 rounded text-sm font-light ${selected ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${tint}`}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {pad(c.d)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {view === 'month' && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                  const disabled = isMonthDisabled(year, m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(m)}
                      disabled={disabled}
                      className={`px-3 py-2 rounded border text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'} ${String(month) === String(m) ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-400' : ''}`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
            )}
            {view === 'year' && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => {
                  const disabled = isYearDisabled(y);
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      disabled={disabled}
                      className={`px-1 py-2 rounded border text-sm ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'} ${year === y ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-400' : ''}`}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}