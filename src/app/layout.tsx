"use client";
import "jsvectormap/dist/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
// import "flatpickr/dist/themes/light.css"; // Alternative theme import
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";

import * as Ably from "ably";
import { AblyProvider, ChannelProvider } from "ably/react";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/app/context/UserContext";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const client = new Ably.Realtime({
    key: `${process.env.NEXT_PUBLIC_ABLY_API_KEY}`,
  });
  return (
    <html lang="en">
      {/* <Script src="https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js" strategy="afterInteractive" /> */}
      <Script src="https://unpkg.com/@rdkit/rdkit/dist/RDKit_minimal.js" strategy="afterInteractive" />
      <body suppressHydrationWarning={true}>
        <SessionProvider>
          <UserProvider>
            <AblyProvider client={client}>
              <ChannelProvider channelName="chat-demo1">
                <div className="font-poppins dark:bg-boxdark-2 dark:text-bodydark ">
                  {loading ? <Loader /> : children}
                </div>
              </ChannelProvider>
            </AblyProvider>
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}