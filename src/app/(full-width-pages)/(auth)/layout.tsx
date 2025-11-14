import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

function Card({ content }: { content: string }) {
  return (
    <div className="w-full max-w-sm bg-gradient-to-r bg-white/10 rounded-lg shadow-lg p-4 mt-5">
      <div className="flex items-center gap-4">
        <div className="">
          <Image
            width={36}
            height={36}
            className=""
            src="/images/auth/check.svg"
            alt="Logo"
          />
        </div>
        <h1 className="text-sm font-light text-white/90">
          {content}
        </h1>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative px-6 z-1  sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col sm:p-0">
          <div className="flex flex-col flex-1 min-h-screen lg:w-1/2 w-full">
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
              <div className="relative rounded-2xl">
                <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-[#312E81] to-[#7E22CE] rounded-t-2xl z-50"></div>
                <div className="absolute top-0 left-0 w-[8px] h-full bg-gradient-to-b from-[#312E81] to-[#7E22CE] rounded-l-2xl z-50"></div>
                {children}
              </div >
            </div >
          </div >
          <div className="lg:w-1/2 w-full h-full bg-gradient-to-b from-[#312E81]  to-[#7E22CE] lg:grid items-center hidden">
            <div className="h-full mt-auto items-center justify-center  z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              {/* <GridShape /> */}
              <div className="flex flex-col items-start justify-center h-full max-w-sm w-full mx-auto">

                <div className="block mb-4">
                  <Image
                    width={105}
                    height={20}
                    className=""
                    src="/images/auth/check.svg"
                    alt="Logo"
                  />
                </div>
                <h1 className="text-white text-5xl font-light text-left">InspecTech</h1>
                <p className="text-lg font-lighttext-left text-white">
                  Inspection and Inventory Management System
                </p>
                <Card content="Secure Inspection Management" />
                <Card content="Real-time Inventory Tracking" />
                <Card content="Comprehensive Reporting" />
                <Card content="Streamlined Workflow Solutions" />
              </div>

            </div>
          </div>

          {/* <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div> */}
        </div>
      </ThemeProvider>
    </div>
  );
}
