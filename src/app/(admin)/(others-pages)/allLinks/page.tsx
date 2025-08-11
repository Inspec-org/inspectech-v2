import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Properties from "@/components/AllPropertiesFlow/AllProperties/Properties";
import Links from "@/components/AllLinksFlow/allLinks/AllLinks";

export default async function OrdersPage() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/signin");
  }

  return (
    <Links sessionId={sessionId}/>
  );
}
