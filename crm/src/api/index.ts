import { useApiQuery, usePatchApi, usePostApi } from "@/api/rq";
import {
    DeliveryOverview,
    OrderOverview,
    OrderPickingPatch,
    Delivery,
    Order,
    Payment,
} from "@/api/models";
import { UseQueryResult } from "react-query";

export type QueryControlOptions = {
    enabled?: boolean
}


export const useAdminDeliveriesQuery = (): UseQueryResult<Delivery[]> => {
    return useApiQuery("/admin/deliveries", {})
};

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
        { id: id || '' }
    );
};
export function useCollectPickingItem(pickingId?: string, itemId?: string) {
    return usePostApi<
        '/admin/order-pickings/{pickingId}/items/{itemId}/collect',
        { pickingId: string, itemId: string },
        void
    >(
        '/admin/order-pickings/{pickingId}/items/{itemId}/collect',
        [
            '/admin/orders/{id}'
        ],
        {
            pickingId: pickingId || '',
            itemId: itemId || ''
        }
    );
};
export function useConsolidateOrder(id?: string) {
    return usePostApi<
        '/admin/orders/{id}/consolidate',
        { id: string },
        void
    >(
        '/admin/orders/{id}/consolidate',
        [
            '/admin/orders/{id}'
        ],
        {
            id: id || ''
        }
    );
};
export function useStartOrderPicking(id?: string) {
    return usePostApi<
        '/admin/orders/{id}/order-picking',
        { id: string },
        void
    >(
        '/admin/orders/{id}/order-picking',
        [
            '/admin/orders/{id}'
        ],
        { id: id || '' }
    );
};

export const useAdminDeliveryQuery = (id?: string): UseQueryResult<DeliveryOverview> => {
    return useApiQuery("/admin/deliveries/{id}", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id })
};
export const useAdminOrderOverviewQuery = (id?: string): UseQueryResult<OrderOverview> => {
    return useApiQuery("/admin/orders/{id}", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id })
};

export const useAdminOrderConciliationQuery = (id?: string): UseQueryResult<Order> => {
    return useApiQuery("/admin/orders/{id}/conciliation", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id })
};

export const useAdminOrderPaymentsQuery = (orderId?: string): UseQueryResult<Payment[]> => {
    return useApiQuery("/admin/orders/{orderId}/payments", {
        params: {
            path: {
                orderId: orderId || ""
            }
        }
    }, { retry: 1, enabled: !!orderId })
};
