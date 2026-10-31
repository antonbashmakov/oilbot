"use client";

import { useState } from "react";
import { usePerformAction } from "@/api";
import { ActionResult, QuestionAction } from "@/api/models";
import { useCustomerSession } from "./CustomerSessionProvider";

type QuestionActionCardProps = {
  question: QuestionAction;
  messageId: string;
  done: boolean;
  disabled: boolean;
  onDone: (result: ActionResult | null | undefined) => void;
};

const QuestionActionCard = ({ question, messageId, done, disabled, onDone }: QuestionActionCardProps) => {
  const { customer } = useCustomerSession();
  const { mutate, isPending, isError } = usePerformAction(customer?.id);

  const handleClick = () => {
    mutate({ type: question.type, params: question.params, message_id: messageId }, { onSuccess: onDone });
  };

  return (
    <div className={`snap-center shrink-0 w-[230px] bg-surface-container rounded-xl border p-3.5 flex flex-col justify-between gap-3 shadow-lg ${done ? "border-tertiary/40" : "border-white/10"} ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-secondary text-[20px]">directions_car</span>
        <p className="font-body-md text-on-surface font-semibold leading-snug">{question.text}</p>
      </div>
      {done ? (
        <div className="inline-flex items-center gap-1.5 text-tertiary font-label-md">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>Автомобиль сохранён</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isPending}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container font-label-md font-bold rounded-lg active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:active:scale-100"
        >
          {isPending && <span className="material-symbols-outlined text-[16px]">progress_activity</span>}
          <span>Сохранить</span>
        </button>
      )}
      {isError && <p className="text-error font-label-sm text-[12px]">Не удалось сохранить. Попробуйте ещё раз.</p>}
    </div>
  );
};

type QuestionActionCarouselProps = {
  questions: QuestionAction[];
  messageId: string;
  onActionResult?: (result: ActionResult) => void;
};

/**
 * Several questions of one message as a carousel of cards (for example car suggestions); once one
 * is answered the others are disabled.
 */
const QuestionActionCarousel = ({ questions, messageId, onActionResult }: QuestionActionCarouselProps) => {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = questions.findIndex((question) => question.answered);
  const done = answered >= 0 ? answered : chosen;

  return (
    <div className="w-full pt-1">
      <div className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 -mx-layout-margin-mobile px-layout-margin-mobile">
        {questions.map((question, index) => (
          <QuestionActionCard
            key={index}
            question={question}
            messageId={messageId}
            done={done === index}
            disabled={done !== null && done !== index}
            onDone={(result) => {
              setChosen(index);
              if (result) onActionResult?.(result);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestionActionCarousel;
