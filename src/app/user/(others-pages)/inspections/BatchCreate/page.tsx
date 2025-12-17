import BatchCreateInspections from '@/components/inspections/BatchCreateInspections'
import React, { Suspense } from 'react'

function page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BatchCreateInspections />
    </Suspense>
  )
}

export default page
