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
    zIndex: 9999,
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

  const canGoPrev = (() => {
    if (!minStr) return true;
    const first = toStr(year, month, 1);
    return cmp(first, minStr) > 0;
  })();

  const canGoNext = (() => {
    if (!maxStr) return true;
    const first = toStr(year, month + 1 > 12 ? year + 1 : year, month + 1 > 12 ? 1 : month + 1);
    return cmp(first, maxStr) <= 0;
  })();

  const handleSelectDay = (d: number) => {
    const v = toStr(year, month, d);
    if (minStr && cmp(v, minStr) < 0) return;
    if (maxStr && cmp(v, maxStr) > 0) return;
    onChange?.(v);
    setIsOpen(false);
  };

  const leading: (number | null)[] = Array(startDay).fill(null);
  const days: number[] = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1);
  const grid: (number | null)[] = [...leading, ...days];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        style={width ? { width } : undefined}
        className={`px-3 py-2 text-left rounded-lg flex items-center justify-between ${width ? '' : 'w-full'} ${
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
            className="fixed z-[9999] mt-1 bg-[#FAF7FF] border border-gray-200 rounded-lg shadow-lg p-2 w-[260px]"
            style={dropdownStyle}
          >
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => {
                  if (!canGoPrev) return;
                  const nm = month - 1 < 1 ? 12 : month - 1;
                  const ny = month - 1 < 1 ? year - 1 : year;
                  setMonth(nm);
                  setYear(ny);
                }}
                className={`p-1 ${canGoPrev ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                <ChevronLeft size={16} className="text-gray-700" />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={String(year)}
                  onChange={(e) => {
                    const y = parseInt(e.target.value);
                    setYear(y);
                    const nextFirst = toStr(y, month + 1 > 12 ? y + 1 : y, month + 1 > 12 ? 1 : month + 1);
                    if (maxStr && cmp(nextFirst, maxStr) > 0) {
                      const m = parseInt((maxStr || '').split('-')[1] || '12');
                      setMonth(m);
                    }
                  }}
                  className="border rounded px-2 py-1"
                >
                  {Array.from({ length: today.getFullYear() - 1950 + 1 }, (_, i) => String(today.getFullYear() - i)).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={String(month).padStart(2, '0')}
                  onChange={(e) => {
                    const m = parseInt(e.target.value);
                    setMonth(m);
                  }}
                  className="border rounded px-2 py-1"
                >
                  {Array.from({ length: year === today.getFullYear() && maxStr ? Math.min(today.getMonth() + 1, 12) : 12 }, (_, i) =>
                    String(i + 1).padStart(2, '0'),
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!canGoNext) return;
                  const nm = month + 1 > 12 ? 1 : month + 1;
                  const ny = month + 1 > 12 ? year + 1 : year;
                  setMonth(nm);
                  setYear(ny);
                }}
                className={`p-1 ${canGoNext ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                <ChevronRight size={16} className="text-gray-700" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs text-gray-600 mb-1">
              <div className="text-center">Su</div>
              <div className="text-center">Mo</div>
              <div className="text-center">Tu</div>
              <div className="text-center">We</div>
              <div className="text-center">Th</div>
              <div className="text-center">Fr</div>
              <div className="text-center">Sa</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d, idx) =>
                d ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(d)}
                    className={`w-8 h-8 rounded text-sm font-light ${
                      value === toStr(year, month, d) ? 'bg-purple-600 text-white' : 'hover:bg-gray-100'
                    } ${
                      maxStr && cmp(toStr(year, month, d), maxStr) > 0 ? 'opacity-40 cursor-not-allowed' : ''
                    } ${minStr && cmp(toStr(year, month, d), minStr) < 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {pad(d)}
                  </button>
                ) : (
                  <div key={idx} className="w-8 h-8" />
                ),
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}