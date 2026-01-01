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
    CartItem,
    Item,
    AddToCartItem,
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

// Cart hooks
export const useAddItemToCart = (customerId?: string) => {
    const queryClient = useQueryClient();
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

// Hook to get cart items (if we had an endpoint for it)
// Since we don't have a GET endpoint for cart, we'll manage cart state locally
/*
export const useCartItems = (customerId?: number): CartItem[] => {
    const queryClient = useQueryClient();
    
    if (!customerId) return [];
    
    // In a real app, we would fetch cart items from an API
    // For now, we'll use React Query cache as a local store
    return queryClient.getQueryData<CartItem[]>(['cart', customerId]) || [];
};

*/

// Cart store using React Query for local state management
export const useCartStore = (customerId?: string) => {
    const queryClient = useQueryClient();
    const addItemMutation = useAddItemToCart(customerId);

    const getCartItems = (): CartItem[] => {
        if (!customerId) return [];
        return queryClient.getQueryData<CartItem[]>(['cart', customerId]) || [];
    };

    const addToCart = async (itemId: string, itemData?: Partial<CartItem>) => {
        if (!customerId) {
            console.error('No customer ID available');
            return;
        }

        try {
            const currentItems = getCartItems();
            const { data: item } = await addItemMutation.mutateAsync({ itemId });
            queryClient.setQueryData(['cart', customerId], [...currentItems, item]);

        } catch (error) {
            console.error('Failed to add item to cart:', error);
            // Revert optimistic update on error
            queryClient.invalidateQueries({ queryKey: ['cart', customerId] });
        }
    };

    const removeFromCart = (itemId: string) => {
        if (!customerId) return;
        const currentItems = getCartItems();
        const updatedItems = currentItems.filter(item => item.item_id !== itemId);
        queryClient.setQueryData(['cart', customerId], updatedItems);
    };

    const clearCart = () => {
        if (!customerId) return;
        queryClient.setQueryData(['cart', customerId], []);
    };

    const getCartCount = (): number => {
        return getCartItems().length;
    };
    const getItemCountInCart = (itemId: string): number => {
        const cache = (queryClient.getQueryData<{[key: string]: CartItem[]}>(['itemsToCartItems', customerId]) || {});
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
        isLoading: addItemMutation.isPending,
        isError: addItemMutation.isError,
        error: addItemMutation.error,
    };
};
