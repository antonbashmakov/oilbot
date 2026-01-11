import { IdempotentSupport, useApiQuery, useDeleteApi, usePatchApi, usePostApi, usePutApi } from "@/api/rq";
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
    CartItem,
    Item,
    AddToCartItem,
    RemoveFromCartItem,
    CustomerOverview,
} from "@/api/models";
import { UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import useClient from "@/api/useClient";
import _ from "lodash";


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

export const useGetItemQuery = (customerId?: string, itemId?: string): UseQueryResult<ItemOverview> => {
    return useApiQuery("/api/private/customers/{customerId}/items/{itemId}", {
        params: {
            path: {
                customerId: customerId || '',
                itemId: itemId || ''
            }
        }
    }, { retry: 1, enabled: !!customerId && !!itemId } as any);
};
export const useGetCartItemsQuery = (customerId?: string): UseQueryResult<CartItem[]> => {
    const queryClient = useQueryClient();

    const dataInterceptor = (data: CartItem[]) => {
        const items = data;
        const itemsToCartItems = _.groupBy(items, 'item_id');
        queryClient.setQueryData(['itemsToCartItems', customerId], itemsToCartItems) || {};
        queryClient.setQueryData(['cart', customerId], items);
        return data;
    }

    return useApiQuery("/api/private/customers/{customerId}/cart/items", {
        params: {
            path: {
                customerId: customerId || ''
            }
        }
    }, { retry: 1, enabled: !!customerId } as any, dataInterceptor);
};

// Orders hooks
export const useGetOrdersQuery = (customerId?: string): UseQueryResult<Order[]> => {
    return useApiQuery("/api/private/customers/{customerId}/orders", {
        params: {
            path: {
                customerId: customerId || ''
            }
        }
    }, { retry: 1, enabled: !!customerId } as any);
};

// Customer hooks
export const useGetCustomerOverviewQuery = (customerId?: string): UseQueryResult<CustomerOverview> => {
    return useApiQuery("/api/private/customers/{customerId}", {
        params: {
            path: {
                customerId: customerId || ''
            }
        }
    }, { retry: 1, enabled: !!customerId } as any);
};

// Cart hooks
export const useAddItemToCart = (customerId?: string) => {
    return usePostApi<
        "/api/private/customers/{customerId}/cart/items",
        { customerId: string },
        AddToCartItem
    >(
        "/api/private/customers/{customerId}/cart/items",
        [
            "/api/private/customers/{customerId}/cart/items"
        ],
        { customerId: customerId || '' },
    );
};
export const useRemoveItemFromCart = (customerId?: string) => {
    return useDeleteApi<
        "/api/private/customers/{customerId}/cart/items",
        { customerId: string },
        RemoveFromCartItem
    >(
        "/api/private/customers/{customerId}/cart/items",
        [
            "/api/private/customers/{customerId}/cart/items"
        ],
        { customerId: customerId || '' },
    );
};

export const useCheckout = (customerId?: string) => {
    return usePostApi<
        "/api/private/customers/{customerId}/cart/order",
        { customerId: string },
        IdempotentSupport
    >(
        "/api/private/customers/{customerId}/cart/order",
        [
            "/api/private/customers/{customerId}/cart/items"
        ],
        { customerId: customerId || '' },
    );
};

export const useCreateSubscription = (customerId?: string) => {
    return usePostApi<
        "/api/private/customers/{customerId}/subscriptions",
        { customerId: string },
        IdempotentSupport
    >(
        "/api/private/customers/{customerId}/subscriptions",
        [
            "/api/private/customers/{customerId}/subscriptions"
        ],
        { customerId: customerId || '' },
    );
};


export const validateTelegramUser = async (initData: string) => {
    return fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL || ""}/api/public/auth/telegram` , {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
    }).then(async res => {
        const json = await res.json() as any;
        if(json.error) {
            return Promise.reject(json.error);
        }
        return json;
    });
};

// Cart store using React Query for local state management
export const useCartStore = (customerId?: string) => {
    const queryClient = useQueryClient();
    const addItemMutation = useAddItemToCart(customerId);
    const removeItemMutation = useRemoveItemFromCart(customerId);

    const getCartItems = (): CartItem[] => {
        if (!customerId) return [];
        return queryClient.getQueryData<CartItem[]>(['cart', customerId]) || [];
    };

    const addToCart: (itemId: string) => Promise<CartItem | undefined> = async (itemId: string) => {
        if (!customerId) {
            console.error('No customer ID available');
            return;
        }

        try {
            const currentItems = getCartItems();
            const item = await addItemMutation.mutateAsync({ itemId });
            queryClient.setQueryData(['cart', customerId], [...currentItems, item]);
            // @ts-ignore ecause of the created_at problem
            return item as CartItem;

        } catch (error) {
            console.error('Failed to add item to cart:', error);
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: ['cart', customerId] });
        }

        return;
    };

    const removeFromCart = async (removeFromCart: { cartItemId?: string, itemId?: string }) => {
        if (!customerId) return;

        await removeItemMutation.mutate(removeFromCart);

        //const currentItems = getCartItems();
        //const updatedItems = currentItems.filter(item => item.item_id !== itemId);
        //queryClient.setQueryData(['cart', customerId], updatedItems);
    };

    const clearCart = () => {
        if (!customerId) return;
        queryClient.setQueryData(['cart', customerId], []);
    };

    const getCartCount = (): number => {
        return getCartItems().length;
    };
    const getItemCountInCart = (itemId: string): number => {
        const cache = (queryClient.getQueryData<{ [key: string]: CartItem[] }>(['itemsToCartItems', customerId]) || {});
        return cache[itemId]?.length || 0;
    };

    const getCartTotal = (): number => {
        return getCartItems().reduce((total, item) => total + (item.price || 0), 0);
    };

    return {
        getCartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getItemCountInCart,
        getCartCount,
        getCartTotal,
        isLoading: addItemMutation.isPending || removeItemMutation.isPending,
        isError: addItemMutation.isError,
        error: addItemMutation.error,
    };
};
