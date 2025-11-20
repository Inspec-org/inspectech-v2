import PropertyDetails from "@/components/AllPropertiesFlow/propertyDetails/PropertyDetails";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "PASAPO",
  description: "Pasapo Admin Dashboard for managing users, guests, rooms, properties, and links. View stats, details, and securely delete users, guests, or links",
  icons: {
    icon: "/images/Pasapo.svg"
  },
};

export default async function Profile() {
  const cookieStore = await cookies(); // use await
  const sessionId = cookieStore.get("session_id")?.value;

  if (!sessionId) {
    redirect("/signin");
  }

  return (
    <PropertyDetails sessionId={sessionId} />
  );
}
