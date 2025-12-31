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

// Cart hooks
export const useAddItemToCart = () => {
    const queryClient = useQueryClient();
    const { POST } = useClient();
    
    return useMutation<
        Item[], // Response type - API returns Item[] according to OpenAPI spec
        Error,
        { customerId: number; itemId: string } // Parameters
    >({
        mutationFn: async ({ customerId, itemId }) => {
            const response = await POST("/api/private/customers/{customerId}/cart/items/{itemId}", {
                params: {
                    path: {
                        customerId,
                        itemId,
                    }
                }
            });
            
            if (response.error) {
                throw response.error;
            }
            
            return response.data as Item[];
        },
        onSuccess: (data, variables) => {
            // Invalidate cart queries when item is added
            queryClient.invalidateQueries({ queryKey: ['cart', variables.customerId] });
            // Also invalidate items query to reflect updated cart status
            queryClient.invalidateQueries({ queryKey: ['items'] });
            
            // Update cart count in local storage or state if needed
            if (typeof window !== 'undefined') {
                const currentCount = parseInt(localStorage.getItem('cartCount') || '0', 10);
                localStorage.setItem('cartCount', (currentCount + 1).toString());
            }
        },
        onError: (error) => {
            console.error('Failed to add item to cart:', error);
        },
    });
};

// Hook to get cart items (if we had an endpoint for it)
// Since we don't have a GET endpoint for cart, we'll manage cart state locally
export const useCartItems = (customerId?: number): CartItem[] => {
    const queryClient = useQueryClient();
    
    if (!customerId) return [];
    
    // In a real app, we would fetch cart items from an API
    // For now, we'll use React Query cache as a local store
    return queryClient.getQueryData<CartItem[]>(['cart', customerId]) || [];
};

// Cart store using React Query for local state management
export const useCartStore = (customerId?: number) => {
    const queryClient = useQueryClient();
    const addItemMutation = useAddItemToCart();
    
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
            // First, update local cache optimistically
            const currentItems = getCartItems();
            const newItem: CartItem = {
                id: `temp-${Date.now()}`,
                item_id: itemId,
                fraction: itemData?.fraction || 1,
                group: itemData?.group || '',
                name: itemData?.name || 'Item',
                price: itemData?.price || 0,
                price_for_unit: itemData?.price_for_unit || 0,
                quantity: itemData?.quantity || 1,
                owner: itemData?.owner || { id: customerId.toString() },
            };
            
            queryClient.setQueryData(['cart', customerId], [...currentItems, newItem]);
            
            // Then call the actual API
            await addItemMutation.mutateAsync({ customerId, itemId });
            
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
    
    const getCartTotal = (): number => {
        return getCartItems().reduce((total, item) => total + (item.price || 0), 0);
    };
    
    return {
        getCartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getCartCount,
        getCartTotal,
        isLoading: addItemMutation.isPending,
        isError: addItemMutation.isError,
        error: addItemMutation.error,
    };
};
