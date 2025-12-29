'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = { title: string; url: string }

export default function SlideshowPage() {
  const searchParams = useSearchParams()
  const [slides, setSlides] = useState<Slide[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('inspections_slideshow') || '[]'
      const startStored = localStorage.getItem('inspections_slideshow_start')
      const startParam = searchParams.get('start')
      const parsed: Slide[] = JSON.parse(raw)
      const start = startParam ? parseInt(startParam, 10) : startStored ? parseInt(startStored, 10) : 0
      setSlides(parsed)
      setIndex(Number.isFinite(start) ? Math.max(0, Math.min(parsed.length - 1, start)) : 0)
    } catch {
      setSlides([])
      setIndex(0)
    }
  }, [searchParams])

  useEffect(() => {
    localStorage.setItem('inspections_slideshow_start', String(index))
  }, [index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!slides.length) return
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + slides.length) % slides.length)
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % slides.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides])

  if (!slides.length) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">No images available</p>
          <p className="text-sm opacity-70">Go back and click Zoom on an image to start the slideshow</p>
        </div>
      </div>
    )
  }

  const slide = slides[index]

  return (
    <div className="fixed inset-0 bg-white text-black">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="text-sm sm:text-base font-medium">{slide.title}</div>
        <div className="flex gap-2">
          <button className="bg-[#FAF4FF] text-black rounded-md px-3 py-2 text-sm border flex items-center gap-2" onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)}>
            <ChevronLeft size={20} />
            Previous
          </button>
          <button className="bg-[#FAF4FF] text-black rounded-md px-3 py-2 text-sm border flex items-center gap-2" onClick={() => setIndex(i => (i + 1) % slides.length)}>
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="h-[calc(100%-52px)] flex items-center justify-center p-2 pt-4 bg-gray-200">
        <img src={slide.url} alt={slide.title} className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  )
}