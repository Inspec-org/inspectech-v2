import { useRouter } from "next/navigation";

export default function ActionButton({ link }: { link: string }) {
  const router = useRouter();


  return (
    <button
      onClick={() => router.push(`${link}`)}
      className="text-blue-600 hover:underline"
    >
      View Details
    </button>
  );
}
