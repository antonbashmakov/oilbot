import { ChatMessage } from "@/api/models";
import { useMemo } from "react";

const ChatMessageComponent = ({ message }: { message: ChatMessage }) => {

  const createdAt = useMemo(() => {
    if (message.created_at) {
      return new Date(message.created_at);
    }
  }, [message]);

  if (message.role === "assistant") {
    return (
      <div className="flex flex-col items-start max-w-[94%] space-y-1">
        <div className="bg-surface-container-low border border-secondary/20 border-l-2 border-l-secondary rounded-[1rem_1rem_1rem_0.25rem] p-3.5 shadow-sm text-on-surface font-body-md text-body-md space-y-2">
          {message && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary/10 border border-tertiary/20 text-tertiary font-label-sm text-[11px]">
              <span className="material-symbols-outlined text-[14px]">verified</span>
            </div>
          )}
          <p
            className="leading-relaxed text-on-surface"

          >{message.content}</p>
        </div>
        <div className="flex items-center gap-1 pl-1 text-on-surface-variant font-label-sm text-[11px]">
          <span className="material-symbols-outlined text-[13px] text-secondary">memory</span>
          <span>{createdAt?.toLocaleTimeString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end self-end max-w-[82%] space-y-1">
      <div className="bg-surface-variant border border-white/10 text-on-background rounded-[1rem_1rem_0.25rem_1rem] px-4 py-2.5 shadow-sm font-body-md text-body-md">
        <p className="font-medium tracking-wide">{message.content}</p>
      </div>
      <div className="flex items-center gap-1 pr-1 text-on-surface-variant font-label-sm text-[11px]">
        <span>{message.created_at}</span>
        <span
          className="material-symbols-outlined text-[13px] text-tertiary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          done_all
        </span>
      </div>
    </div>
  );
};

export default ChatMessageComponent;