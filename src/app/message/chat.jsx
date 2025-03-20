"use client";

import * as Ably from "ably";
import ChatBox from "./chat-box.jsx";

export default function Chat() {
  const client = new Ably.Realtime({
    key: `${process.env.NEXT_PUBLIC_ABLY_API_KEY}`,
  });
  return <ChatBox />;
}
