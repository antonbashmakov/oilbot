import ChatMessage from "./ChatMessage";
import Carousel from "./Carousel";
import Footer from "./Footer";
import { messages } from "../data/mock";
import { useGetMessages } from '@/api';

const ChatView = () => {
  const { data: messages } = useGetMessages();

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
      {messages && messages.map((message, index) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {/*<Carousel />*/}
      <Footer />
    </main>
  );
};

export default ChatView;