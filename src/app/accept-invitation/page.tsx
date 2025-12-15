import AcceptInvitationContent from '@/components/users/AcceptInvitationContent'
import React, { Suspense } from 'react'

function page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AcceptInvitationContent />
        </Suspense>
    )
}

export default page
