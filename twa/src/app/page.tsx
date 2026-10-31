"use client";

import ChatView from "@/app/components/ChatView";
import Header from "@/app/components/Header";
import SessionGate from "@/app/components/SessionGate";

export default function Home() {
  return (
    <>
      <Header />
      <SessionGate>
        <ChatView />
      </SessionGate>
    </>
  );
}