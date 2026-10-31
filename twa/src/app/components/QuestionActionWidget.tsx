"use client";

import { usePerformAction } from "@/api";
import { ActionResult, QuestionAction } from "@/api/models";
import { useCustomerSession } from "./CustomerSessionProvider";

const ACTION_LABELS: Record<QuestionAction["type"], { button: string; done: string }> = {
  save_car: { button: "Сохранить", done: "Автомобиль сохранён" },
};

type QuestionActionWidgetProps = {
  question: QuestionAction;
  messageId: string;
  onActionResult?: (result: ActionResult) => void;
};

/**
 * A question from the assistant with one action button; the button runs the question's action.
 * An answered question shows the done state instead of the button.
 */
const QuestionActionWidget = ({ question, messageId, onActionResult }: QuestionActionWidgetProps) => {
  const { customer } = useCustomerSession();
  const { mutate, isPending, isSuccess, isError } = usePerformAction(customer?.id);
  const labels = ACTION_LABELS[question.type];

  const handleClick = () => {
    mutate({ type: question.type, params: question.params, message_id: messageId }, {
      onSuccess: (result) => result && onActionResult?.(result),
    });
  };

  return (
    <div className="flex flex-col items-start max-w-[94%] space-y-1">
      <div className="bg-surface-container-low border border-secondary/20 border-l-2 border-l-secondary rounded-[1rem_1rem_1rem_0.25rem] p-3.5 shadow-sm text-on-surface font-body-md text-body-md space-y-3">
        <p className="leading-relaxed text-on-surface">{question.text}</p>
        {isSuccess || question.answered ? (
          <div className="inline-flex items-center gap-1.5 text-tertiary font-label-md">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{labels.done}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container font-label-md font-bold rounded-lg active:scale-95 transition-all shadow-md disabled:opacity-60 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isPending ? "progress_activity" : "directions_car"}
            </span>
            <span>{labels.button}</span>
          </button>
        )}
        {isError && (
          <p className="text-error font-label-sm text-[12px]">Не удалось выполнить. Попробуйте ещё раз.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionActionWidget;
