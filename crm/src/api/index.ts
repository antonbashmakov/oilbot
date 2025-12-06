import { useApiQuery, usePatchApi, usePostApi, usePutApi } from "@/api/rq";
import {
    DeliveryOverview,
    OrderOverview,
    OrderPickingPatch,
    Delivery,
    Order,
    Payment,
    User,
    SignupRequest,
    LoginRequest,
} from "@/api/models";
import { UseQueryResult } from "@tanstack/react-query";

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
    }, { retry: 1, enabled: !!id } as any)
};
export const useAdminOrderOverviewQuery = (id?: string): UseQueryResult<OrderOverview> => {
    return useApiQuery("/admin/orders/{id}", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id } as any)
};

export const useAdminOrderConciliationQuery = (id?: string): UseQueryResult<Order> => {
    return useApiQuery("/admin/orders/{id}/conciliation", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id } as any)
};

export const useAdminOrderPaymentsQuery = (orderId?: string): UseQueryResult<Payment[]> => {
    return useApiQuery("/admin/orders/{orderId}/payments", {
        params: {
            path: {
                orderId: orderId || ""
            }
        }
    }, { retry: 1, enabled: !!orderId }  as any)
};

export function useCreateOrderPayment(orderId?: string) {
    return usePostApi<
        '/admin/orders/{orderId}/payments',
        { orderId: string },
        { idempotency_key: string }
    >(
        '/admin/orders/{orderId}/payments',
        [
            '/admin/orders/{orderId}/payments',
            '/admin/orders/{id}'
        ],
        {
            orderId: orderId || ''
        }
    );
};

export function useCancelOrder(id?: string) {
    return usePutApi<
        '/admin/orders/{id}/cancel',
        { id: string },
        void
    >(
        '/admin/orders/{id}/cancel',
        [
            '/admin/orders/{id}',
            '/admin/orders/{orderId}/payments',
        ],
        {
            id: id || ''
        }
    );
};

export function useSignup() {
    return usePostApi<
        '/public/signup',
        never,
        SignupRequest
    >(
        '/public/signup',
        [],
        {} as never
    );
};

export function useLogin() {
    return usePostApi<
        '/public/login',
        never,
        LoginRequest
    >(
        '/public/login',
        [],
        {} as never
    );
};
