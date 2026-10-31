import { handleResult, IdempotentSupport, useApiQuery, useDeleteApi, usePatchApi, usePostApi, usePutApi } from "@/api/rq";

import { UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import useClient from "@/api/useClient";

import {
    ActionRequest,
    ActionResult,
    CustomerSession,
    TelegramLoginData,
    ChatMessage,
    ChatMessageView,
} from "@/api/models";

import _ from "lodash";

const chatMessageInterceptor = (data: ChatMessage[]) => {

    return data.map((msg) => {
        return {
            ...msg,
            created_at: new Date(msg.created_at)
        };
    });
};

export type QueryControlOptions = {
    enabled?: boolean
}

export const useGetMessages = (customerId?: string): UseQueryResult<ChatMessage[]> => {
    return useApiQuery(
        "/api/private/customers/{customerId}/chats/{chatId}/messages",
        {
            params: {
                path: {
                    customerId: customerId || "",
                    chatId: "latest"
                },
            }
        }, { enabled: !!customerId } as any, chatMessageInterceptor
    );
};

export const useSendMessage = (customerId?: string, chatId?: string) => {
    return usePostApi<
        "/api/private/customers/{customerId}/chats/{chatId}/messages",
        { customerId: string, chatId: string },
        ChatMessageView
    >(
        "/api/private/customers/{customerId}/chats/{chatId}/messages",
        [
            "/api/private/customers/{customerId}/cart/items"
        ],
        { customerId: customerId || '', chatId: chatId || '' },
    );
};


/**
 * Runs an action the customer confirmed in a QuestionAction and refreshes the chat.
 */
export const usePerformAction = (customerId?: string) => {
    const { POST } = useClient();
    const queryClient = useQueryClient();

    return useMutation<ActionResult | null | undefined, unknown, ActionRequest>({
        mutationFn: (body) => handleResult(POST("/api/private/customers/{customerId}/actions", {
            params: { path: { customerId: customerId || "" } },
            body,
        })),
        onSuccess: () => queryClient.invalidateQueries({
            queryKey: ["/api/private/customers/{customerId}/chats/{chatId}/messages"],
        }),
    });
};

/**
 * Asks the AI for oil for the saved car, without a customer message (after saving a suggested car).
 */
export const useOilSearch = (customerId?: string) => {
    const { POST } = useClient();

    return useMutation<ChatMessage[], unknown, void>({
        mutationFn: async () => {
            const data = await handleResult(POST("/api/private/customers/{customerId}/chats/{chatId}/oil-search", {
                params: { path: { customerId: customerId || "", chatId: "latest" } },
            }));
            return chatMessageInterceptor((data || []) as unknown as ChatMessage[]);
        },
    });
};

export const authenticateTelegramLogin = async (data: TelegramLoginData): Promise<CustomerSession> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL || ""}/api/public/auth/telegram-login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok || json.error) {
        return Promise.reject(json.error);
    }
    return json as CustomerSession;
};

export const validateUser = async (initData: string) => {
    return fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL || ""}/api/public/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
    }).then(async res => {
        const json = await res.json() as any;
        if (json.error) {
            return Promise.reject(json.error);
        }
        return json;
    });
};

