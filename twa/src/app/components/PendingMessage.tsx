const PendingMessage = ({ content }: { content: string }) => {
  return (
    <>
      {/* Temporary echo of the message we just sent */}
      <div className="flex flex-col items-end self-end max-w-[82%] space-y-1">
        <div className="bg-surface-variant border border-white/10 text-on-background rounded-[1rem_1rem_0.25rem_1rem] px-4 py-2.5 shadow-sm font-body-md text-body-md opacity-70">
          <p className="font-medium tracking-wide">{content}</p>
        </div>
        <div className="flex items-center gap-1 pr-1 text-on-surface-variant font-label-sm text-[11px]">
          <span className="material-symbols-outlined text-[13px] text-secondary animate-spin">
            progress_activity
          </span>
          <span>Sending...</span>
        </div>
      </div>

      {/* Assistant typing indicator */}
      <div className="flex flex-col items-start max-w-[94%] space-y-1">
        <div className="bg-surface-container-low border border-secondary/20 border-l-2 border-l-secondary rounded-[1rem_1rem_1rem_0.25rem] p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 h-5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-secondary animate-bounce"></span>
          </div>
        </div>
        <div className="flex items-center gap-1 pl-1 text-on-surface-variant font-label-sm text-[11px]">
          <span className="material-symbols-outlined text-[13px] text-secondary">memory</span>
          <span>Awaiting response...</span>
        </div>
      </div>
    </>
  );
};

export default PendingMessage;
