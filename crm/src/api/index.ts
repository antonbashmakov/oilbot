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
    return useApiQuery("/api/admin/deliveries", {})
};

export function usePatchOrderPicking(id?: string) {
    return usePatchApi<
        '/api/admin/order-pickings/{id}',
        { id: string },
        OrderPickingPatch
    >(
        '/api/admin/order-pickings/{id}',
        [
            '/api/admin/orders/{id}'
        ],
        { id: id || '' }
    );
};
export function useCollectPickingItem(pickingId?: string, itemId?: string) {
    return usePostApi<
        '/api/admin/order-pickings/{pickingId}/items/{itemId}/collect',
        { pickingId: string, itemId: string },
        void
    >(
        '/api/admin/order-pickings/{pickingId}/items/{itemId}/collect',
        [
            '/api/admin/orders/{id}'
        ],
        {
            pickingId: pickingId || '',
            itemId: itemId || ''
        }
    );
};
export function useConsolidateOrder(id?: string) {
    return usePostApi<
        '/api/admin/orders/{id}/consolidate',
        { id: string },
        void
    >(
        '/api/admin/orders/{id}/consolidate',
        [
            '/api/admin/orders/{id}'
        ],
        {
            id: id || ''
        }
    );
};
export function useStartOrderPicking(id?: string) {
    return usePostApi<
        '/api/admin/orders/{id}/order-picking',
        { id: string },
        void
    >(
        '/api/admin/orders/{id}/order-picking',
        [
            '/api/admin/orders/{id}'
        ],
        { id: id || '' }
    );
};

export const useAdminDeliveryQuery = (id?: string): UseQueryResult<DeliveryOverview> => {
    return useApiQuery("/api/admin/deliveries/{id}", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id } as any)
};
export const useAdminOrderOverviewQuery = (id?: string): UseQueryResult<OrderOverview> => {
    return useApiQuery("/api/admin/orders/{id}", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id } as any)
};

export const useAdminOrderConciliationQuery = (id?: string): UseQueryResult<Order> => {
    return useApiQuery("/api/admin/orders/{id}/conciliation", {
        params: {
            path: {
                id: id || ""
            }
        }
    }, { retry: 1, enabled: !!id } as any)
};

export const useAdminOrderPaymentsQuery = (orderId?: string): UseQueryResult<Payment[]> => {
    return useApiQuery("/api/admin/orders/{orderId}/payments", {
        params: {
            path: {
                orderId: orderId || ""
            }
        }
    }, { retry: 1, enabled: !!orderId } as any)
};

export function useCreateOrderPayment(orderId?: string) {
    return usePostApi<
        '/api/admin/orders/{orderId}/payments',
        { orderId: string },
        { idempotency_key: string }
    >(
        '/api/admin/orders/{orderId}/payments',
        [
            '/api/admin/orders/{orderId}/payments',
            '/api/admin/orders/{id}'
        ],
        {
            orderId: orderId || ''
        }
    );
};

export function useCancelOrder(id?: string) {
    return usePutApi<
        '/api/admin/orders/{id}/cancel',
        { id: string },
        void
    >(
        '/api/admin/orders/{id}/cancel',
        [
            '/api/admin/orders/{id}',
            '/api/admin/orders/{orderId}/payments',
        ],
        {
            id: id || ''
        }
    );
};

export function useSignup() {
    return usePostApi<
        '/api/public/signup',
        never,
        SignupRequest
    >(
        '/api/public/signup',
        [],
        {} as never
    );
};

export function useLogin() {
    return usePostApi<
        '/api/public/login',
        never,
        LoginRequest
    >(
        '/api/public/login',
        [],
        {} as never
    );
};

export const useUserQuery = (): UseQueryResult<User> => {
    // Only enable the query if we have a token
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    return useApiQuery("/api/public/users/me", {credentials: "include"}, { enabled: hasToken } as any);
}

export function useDownloadDeliveryStats() {

    let token  = (typeof window !== 'undefined') ? localStorage.getItem("token") : "";
    return async (id?: string) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL || ''}/api/admin/deliveries/${id}/stats/CSV?status=CANCELED`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Error downloading report: ${response.statusText}`);
        }

        return response;
    }
}
