"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function ActionButton({ link }: { link: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleClick = () => {
    const currentParams = new URLSearchParams(searchParams);
    const linkUrl = new URL(link, "http://dummy.com"); // dummy base for parsing

    // Merge existing params with those in the `link`
    for (const [key, value] of linkUrl.searchParams.entries()) {
      currentParams.set(key, value); // override or add
    }

    const finalUrl = `${linkUrl.pathname}?${currentParams.toString()}`;
    router.push(finalUrl);
  };

  return (
    <button
      onClick={handleClick}
      className="text-blue-600 hover:underline"
    >
      View Details
    </button>
  );
}
