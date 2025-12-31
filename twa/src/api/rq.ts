import { FetchOptions } from 'openapi-fetch';
import { paths } from '@/api/openapi/api';
import { FilterKeys, PathsWithMethod } from 'openapi-typescript-helpers';
import { useMutation, useQueries, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import useClient from '@/api/useClient';
import { PathParameters, RequestBody, ResponseType } from '@/utils/request';


type ApiPaths = {
  [G in keyof paths as `/api${G & string}`]: paths[G];
};

// @ts-ignore
export function getApiQueryParams<P extends PathsWithMethod<ApiPaths, 'get'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<ApiPaths[P], 'get'>>) {
    return [p, init.params];
}

export async function handleResult<D, E, T extends { data?: D, error?: E, response: { status: number} }>(result: Promise<T>): Promise<D | undefined | null> {

    const { data, error, response } = await result;

    if (error) {
        throw error;
    }

    if(response.status === 204) return null;

    return data
}

// @ts-ignore
export function useApiQuery<P extends PathsWithMethod<ApiPaths, 'get'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<ApiPaths[P], 'get'>>, options: UseQueryOptions<any> = {}) {
    const { GET } = useClient();
    
    // @ts-ignore
    return useQuery({ 
        ...options,
        queryKey: getApiQueryParams(p, init),
        queryFn: () => handleResult(GET(p as P, init)),
        enabled: !!p && options.enabled,
    });
}

export function usePatchApi<
    K extends keyof ApiPaths,
    P extends PathParameters<ApiPaths, K, 'patch'>,
    Body = RequestBody<ApiPaths, K, 'patch'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[1]
) {
    const { PATCH } = useClient();
    const queryClient = useQueryClient();

    
    return useMutation<
        ResponseType<ApiPaths, K, 'patch'>, 
        Error,
        Body
    >({
        mutationFn: async (request) => {
            // @ts-ignore
            const response = await PATCH(path, {
                params: {
                    path: fixedParams, 
                },
                body: request,
            });

            const data = response.data as ResponseType<ApiPaths, K, 'patch'>;
            return data; 
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: invalidates });
        },
        ...options,
    });
}
export function usePostApi<
    K extends keyof ApiPaths,
    P extends PathParameters<ApiPaths, K, 'post'>,
    Body = RequestBody<ApiPaths, K, 'post'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[1]
) {
    const { POST } = useClient();
    const queryClient = useQueryClient();

    return useMutation<
        ResponseType<ApiPaths, K, 'post'>, 
        Error,
        Body
    >({
        mutationFn: async (request) => {
            // @ts-ignore
            const response = await POST(path, {
                params: {
                    path: fixedParams, 
                },
                body: request,
            });

            const data = response.data as ResponseType<ApiPaths, K, 'post'>;
            return data; 
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: invalidates });
        },
        ...options,
    });
}

export function usePutApi<
    K extends keyof ApiPaths,
    P extends PathParameters<ApiPaths, K, 'put'>,
    Body = RequestBody<ApiPaths, K, 'put'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[1]
) {
    const { PUT } = useClient();
    const queryClient = useQueryClient();

    return useMutation<
        ResponseType<ApiPaths, K, 'put'>, 
        Error,
        Body
    >({
        mutationFn: async (request) => {
            // @ts-ignore
            const response = await PUT(path, {
                params: {
                    path: fixedParams, 
                },
                body: request,
            });

            const data = response.data as ResponseType<ApiPaths, K, 'put'>;
            return data; 
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: invalidates });
        },
        ...options,
    });
}


// @ts-ignore
export function usePostApiQuery<P extends PathsWithMethod<ApiPaths, 'post'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<ApiPaths[P], 'post'>>, options: UseQueryOptions<any> = {}) {
    const { POST } = useClient();
    // @ts-ignore
    return useQuery({ 
        ...options,
        // @ts-ignore
        queryKey: getApiQueryParams(p, init),
        queryFn: () => handleResult(POST(p as P, init)),
        enabled: !!p,
        retry: 1,
    });
}

// @ts-ignore
export function useApiQueries<P extends PathsWithMethod<ApiPaths, 'get'>>(p: P | undefined | '', inits: FetchOptions<FilterKeys<ApiPaths[P], 'get'>>[], options: UseQueryOptions<any> = {}) {
    const { GET } = useClient();

    const results = useQueries({
        queries: inits.map(init => ({
            queryKey: getApiQueryParams(p, init),
            queryFn: () => handleResult(GET(p as P, init))
        }))
    });

    return combineResults(results);
}

export const combineResults = <T>(results: any[]): UseQueryResult<T[]> => {
    // Determine overall status
    const isLoading = results.some(result => result.isLoading);
    const isError = results.some(result => result.isError);
    const isSuccess = !results.some(result => !result.isSuccess);

    const data = isSuccess ? results.map(r => r.data as T) : undefined;

    return {
        isLoading,
        isError,
        isSuccess,
        data,
        error: isError ? results.find(result => result.isError)?.error : undefined,
    } as UseQueryResult<T[]>;
}
