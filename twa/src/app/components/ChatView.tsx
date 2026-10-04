import { ChatMessage } from "@/api/models";
import ChatMessageComponent from "./ChatMessage";
import Footer from "./Footer";
import PendingMessage from "./PendingMessage";
import { useGetMessages, useSendMessage } from '@/api';
import { Fragment, useCallback, useEffect, useState } from "react";
import Carousel from "./Carousel";
// import { products } from "@/app/data/mock";

const ChatView = () => {
  const { data: messages } = useGetMessages("Cz0KB5zXRqMsEho8BOLC");
  const { mutateAsync: sendMessage, data: answers, isPending, variables } = useSendMessage("Cz0KB5zXRqMsEho8BOLC", "latest");

  const [conversation, setConversation] = useState<ChatMessage[]>([]);

  // Temporary message shown while we await the answer from sendMessage.
  const pendingMessage = isPending ? variables?.content ?? null : null;

  useEffect(() => {
    if(!messages) return;
    setConversation([...messages]);

  }, [messages]);

  useEffect(() => {
    if(!answers) return;
    // The response already contains the message we sent, so the temporary one can be dropped.
    setConversation((prev) => [...prev, ...answers.map((a) => ({...a, created_at: new Date(a.created_at)}))]);

  }, [answers]);

  // Keep the newest message (and the pending indicator) in view by scrolling the
  // page to the bottom whenever the conversation grows.
  useEffect(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, [conversation.length, pendingMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    try {
      await sendMessage({
        content
      });

      return true;
    } catch {
      return false;
    }
  }, [sendMessage]);

  return (
    <main className="flex-1 w-full max-w-chat-max-width mx-auto pt-20 pb-40 px-layout-margin-mobile flex flex-col space-y-space-lg">
      <div className="w-full bg-surface-container/60 backdrop-blur border border-white/5 rounded-lg p-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[18px]">query_stats</span>
          <span className="font-mono-metric text-label-sm text-on-surface">
            TELEMETRY LOCK: ENGINE OIL SPEC V2.4
          </span>
        </div>
        <span className="text-tertiary font-label-sm text-[10px] tracking-wider font-semibold uppercase">
          Active Session
        </span>
      </div>
      {conversation && conversation.map((m) => (
        <Fragment key={m.id}>
          {m.products && m.products.length > 0 && (
            <Carousel products={m.products} />
          )}
          {!m.products && (
            <ChatMessageComponent message={m} />
          )}
        </Fragment>
      ))}
      {pendingMessage && <PendingMessage content={pendingMessage} />}
      <Footer onSubmit={handleSendMessage} />
    </main>
  );
};

export default ChatView;