import Inspections from '@/components/inspections/Inspections'
import React, { Suspense } from 'react'

function page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div>
                <Inspections />
            </div>
        </Suspense>
    )
}

export default page
