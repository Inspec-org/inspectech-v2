

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Index from "@/components/allUsersFlow/allUsers/index";

export default async function OrdersPage() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/signin");
  }

  return (
    <Index sessionId={sessionId}/>
  );
}
