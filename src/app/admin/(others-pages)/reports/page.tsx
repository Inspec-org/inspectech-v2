
import Reports from '@/components/reports/Reports-Admin'
import React, { Suspense } from 'react'

function page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div>
                <Reports />
            </div>
        </Suspense>
    )
}

export default page
