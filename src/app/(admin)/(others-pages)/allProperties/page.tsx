

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Properties from "@/components/AllPropertiesFlow/AllProperties/Properties";

export default async function OrdersPage() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/signin");
  }

  return (
    <Properties sessionId={sessionId}/>
  );
}
