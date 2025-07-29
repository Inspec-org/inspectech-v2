import Index from "@/components/allUsersFlow/userDetail/Index";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";


export default async function Profile() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/signin");
  }

  return (
    <Index sessionId={sessionId} />
  );
}
