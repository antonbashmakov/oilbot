import { IdempotentSupport, useApiQuery, useDeleteApi, usePatchApi, usePostApi, usePutApi } from "@/api/rq";

import { UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import useClient from "@/api/useClient";

import {
    ChatMessage,
} from "@/api/models";

import _ from "lodash";

export type QueryControlOptions = {
    enabled?: boolean
}

export const useGetMessages =  (customerId?: string): UseQueryResult<ChatMessage[]> => {
    return useApiQuery(
        "/api/private/customers/{customerId}/chats/latest/messages",
        {
            params: {
                path: {
                    customerId: customerId || "Cz0KB5zXRqMsEho8BOLC",
                },
            }
        }
    );
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

