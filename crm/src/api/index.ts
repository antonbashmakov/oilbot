import { useApiQuery, usePatchApi } from "@/api/rq";
import {
    DeliveryOverview,
    OrderOverview,
    OrderPickingPatch,
} from "@/api/models";
import { UseQueryResult } from "react-query";

export type QueryControlOptions = {
    enabled?: boolean
}

/*

export const useAdminDeliveriesQuery = (): UseQueryResult<Delivery> => {
    return useApiQuery("/admin/deliveries", {})
};
*/

export function usePatchOrderPicking(id?: string) {
    return usePatchApi<
        '/admin/order-pickings/{id}',
        { id: string },
        OrderPickingPatch
    >(
        '/admin/order-pickings/{id}',
        [
            '/admin/orders/{id}'
        ],
        { id: id || ''}
    );
};

export const useAdminDeliveryQuery = (id?: string): UseQueryResult<DeliveryOverview> => {
    return useApiQuery("/admin/deliveries/{id}", {params: {
        path: {
            id: id || ""
        }
    }
    }, { retry: 1, enabled: !!id })
};
export const useAdminOrderOverviewQuery = (id?: string): UseQueryResult<OrderOverview> => {
    return useApiQuery("/admin/orders/{id}", {params: {
        path: {
            id: id || ""
        }
    }
    }, { retry: 1, enabled: !!id })
};



