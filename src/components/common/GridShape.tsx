import Image from "next/image";
import React from "react";

export default function GridShape() {
  return (
    <>
      <div className="absolute z-1 w-full">
        <Image
          width={720}
          height={254}
          src="/images/grid.svg"
          alt="grid"
        />
      
      </div>
    </>
  );
}
