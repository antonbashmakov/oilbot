import { useApiQuery, usePatchApi, usePostApi, usePutApi } from "@/api/rq";
import {
    DeliveryOverview,
    Delivery,
    Order,
    Payment,
    User,
    ConversationMessage,
    Comment,
    DeliveryAgentOverview,
    ItemOverview,
} from "@/api/models";
import { UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import useClient from "@/api/useClient";

export type QueryControlOptions = {
    enabled?: boolean
}

export const useGetItemsQuery = (category?: string): UseQueryResult<ItemOverview[]> => {
    return useApiQuery("/api/private/items/category/{category}", {
        params: {
            path: {
                category: category || 'all'
            }
        }
    }, { retry: 1 } as any)
};


