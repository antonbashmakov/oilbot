import { FetchOptions } from 'openapi-fetch';
import { paths } from '@/api/openapi/crm';
import { FilterKeys, PathsWithMethod } from 'openapi-typescript-helpers';
import { useMutation, useQueries, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import useClient from '@/api/useClient';
import { PathParameters, RequestBody, ResponseType } from '@/utils/request';


// @ts-ignore
export function getApiQueryParams<P extends PathsWithMethod<paths, 'get'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<paths[P], 'get'>>) {
    return [p, init.params];
}

export async function handleResult<D, E, T extends { data?: D, error?: E, response: { status: number} }>(result: Promise<T>): Promise<D | undefined> {

    const { data, error, response } = await result;
    console.log('=====', await result);

    if (error) {
        throw error;
    }

    if(response.status === 204) return undefined;

    return data
}

// @ts-ignore
export function useApiQuery<P extends PathsWithMethod<paths, 'get'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<paths[P], 'get'>>, options: UseQueryOptions<any> = {}) {
    const { GET } = useClient();
    // @ts-ignore
    return useQuery({ 
        ...options,
        queryKey: getApiQueryParams(p, init),
        queryFn: () => handleResult(GET(p as P, init)),
        enabled: !!p,
    });
}

export function usePatchApi<
    K extends keyof paths,
    P extends PathParameters<paths, K, 'patch'>,
    Body = RequestBody<paths, K, 'patch'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[1]
) {
    const { PATCH } = useClient();
    const queryClient = useQueryClient();

    
    return useMutation<
        ResponseType<paths, K, 'patch'>, 
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

            const data = response.data as ResponseType<paths, K, 'patch'>;
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
    K extends keyof paths,
    P extends PathParameters<paths, K, 'post'>,
    Body = RequestBody<paths, K, 'post'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[1]
) {
    const { POST } = useClient();
    const queryClient = useQueryClient();

    return useMutation<
        ResponseType<paths, K, 'post'>, 
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

            const data = response.data as ResponseType<paths, K, 'post'>;
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
    K extends keyof paths,
    P extends PathParameters<paths, K, 'put'>,
    Body = RequestBody<paths, K, 'put'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[1]
) {
    const { PUT } = useClient();
    const queryClient = useQueryClient();

    return useMutation<
        ResponseType<paths, K, 'put'>, 
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

            const data = response.data as ResponseType<paths, K, 'put'>;
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
export function usePostApiQuery<P extends PathsWithMethod<paths, 'post'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<paths[P], 'post'>>, options: UseQueryOptions<any> = {}) {
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
export function useApiQueries<P extends PathsWithMethod<paths, 'get'>>(p: P | undefined | '', inits: FetchOptions<FilterKeys<paths[P], 'get'>>[], options: UseQueryOptions<any> = {}) {
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
