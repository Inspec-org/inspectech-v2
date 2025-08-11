import React from 'react';
import { DocumentInfo, GeneratedLinkInfo } from '@/components/AllLinksFlow/linkDetails/types';
import LinkDetails from '@/components/AllLinksFlow/linkDetails/LinkDetails';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const cookieStore = await cookies(); // use await
    const sessionId = cookieStore.get("session_id")?.value;
  
    if (!sessionId) {
      redirect("/signin");
    }

  return <LinkDetails sessionId={sessionId} />;
};
