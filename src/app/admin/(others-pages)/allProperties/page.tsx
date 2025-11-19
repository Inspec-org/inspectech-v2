import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Properties from "@/components/AllPropertiesFlow/AllProperties/Properties";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PASAPO",
  description: "Pasapo Admin Dashboard for managing users, guests, rooms, properties, and links. View stats, details, and securely delete users, guests, or links",
  icons: {
    icon: "/images/Pasapo.svg"
  },
};

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
