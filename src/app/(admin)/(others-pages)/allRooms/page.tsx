

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AllRooms from "@/components/AllRoomsFlow/allRooms/AllRooms";

export default async function OrdersPage() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/signin");
  }

  return (
    <AllRooms sessionId={sessionId}/>
  );
}
