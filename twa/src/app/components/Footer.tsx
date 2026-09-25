"use client";

import { useCallback, useState } from "react";

const Footer = ({ onSubmit }: { onSubmit: (message: string) => Promise<boolean> } ) => {


  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = useCallback(async (m: string) => {
    console.log("handleSubmit", m);
    if (m.trim() === "") return;

    setSending(true);
    const success = await onSubmit(m);
    setSending(false);

    if (success) {
      setMessage("");
    }
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 w-full z-40 bg-surface/95 backdrop-blur-md px-layout-margin-mobile pt-2 pb-5 shadow-lg border-t border-white/5">
      <div className="max-w-chat-max-width mx-auto flex flex-col space-y-2">
        <div className="flex items-center gap-2 bg-surface-container rounded-xl p-1.5 border border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <button
            type="button"
            aria-label="Upload car manual or scan engine cap"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          </button>
          <button
            type="button"
            aria-label="Voice input"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container-high transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
          <input
            disabled={sending}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-transparent border-0 text-on-surface placeholder:text-on-surface-variant/60 text-body-md focus:ring-0 focus:outline-none px-1"
            placeholder="Ask follow-up or specify year/mileage..."
            type="text"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={() => handleSubmit(message)}
            className="w-10 h-10 flex items-center justify-center bg-primary-container text-on-primary-container rounded-lg font-bold shadow-md hover:bg-primary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        <div className="flex items-center justify-between px-1 text-[11px] font-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-tertiary text-[13px]">check_circle</span>
            <span>OEM spec VW 504 00 applied</span>
          </span>
          <span className="font-mono-metric">4.5L Oil Capacity</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
