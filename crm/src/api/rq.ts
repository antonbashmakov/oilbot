import { FetchOptions } from 'openapi-fetch';
import { paths } from '@/api/openapi/crm';
import { FilterKeys, PathsWithMethod } from 'openapi-typescript-helpers';
import { useMutation, useQueries, useQuery, useQueryClient, UseQueryOptions, UseQueryResult } from 'react-query';
import useClient from '@/api/useClient';
import { PathParameters, RequestBody, ResponseType } from '@/utils/request';


// @ts-ignore
export function getApiQueryParams<P extends PathsWithMethod<paths, 'get'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<paths[P], 'get'>>) {
    return [p, init.params];
}

export async function handleResult<D, E, T extends { data?: D, error?: E }>(result: Promise<T>): Promise<D | undefined> {
    const { data, error } = await result;

    if (error) {
        throw error;
    }

    return data
}

// @ts-ignore
export function useApiQuery<P extends PathsWithMethod<paths, 'get'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<paths[P], 'get'>>, options: UseQueryOptions<any> = {}) {
    const { GET } = useClient();
    // @ts-ignore
    return useQuery(getApiQueryParams(p, init), () => handleResult(GET(p as P, init)),
        // @ts-ignore

        {
            enabled: !!p,
            ...options
        })
}

export function usePatchApi<
    K extends keyof paths,
    P extends PathParameters<paths, K, 'patch'>,
    Body = RequestBody<paths, K, 'patch'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[2]
) {
    const { PATCH } = useClient();
    const queryClient = useQueryClient();

    return useMutation<
        ResponseType<paths, K, 'patch'>, 
        Error,
        Body
    >(
        async (request) => {
            // @ts-ignore
            const response = await PATCH(path, {
                params: {
                    path: fixedParams, 
                },
                body: request,
            });

            const data = response.data as ResponseType<paths, K, 'patch'>;

            // Invalidate related queries
            await queryClient.invalidateQueries(invalidates);

            return data; 
        },
        {
            ...options,
        }
    );
}
export function usePostApi<
    K extends keyof paths,
    P extends PathParameters<paths, K, 'post'>,
    Body = RequestBody<paths, K, 'post'>
>(
    path: K,
    invalidates: string[],
    fixedParams: P,
    options?: Parameters<typeof useMutation>[2]
) {
    const { POST } = useClient();
    const queryClient = useQueryClient();

    return useMutation<
        ResponseType<paths, K, 'post'>, 
        Error,
        Body
    >(
        async (request) => {
            // @ts-ignore
            const response = await POST(path, {
                params: {
                    path: fixedParams, 
                },
                body: request,
            });

            const data = response.data as ResponseType<paths, K, 'post'>;

            // Invalidate related queries
            await queryClient.invalidateQueries(invalidates);

            return data; 
        },
        {
            ...options,
        }
    );
}


// @ts-ignore
export function usePostApiQuery<P extends PathsWithMethod<paths, 'post'>>(p: P | undefined | '', init: FetchOptions<FilterKeys<paths[P], 'post'>>, options: UseQueryOptions<any> = {}) {
    const { POST } = useClient();
    // @ts-ignore
    return useQuery(getApiQueryParams(p, init), () => handleResult(POST(p as P, init)),
        // @ts-ignore
        {
            enabled: !!p,
            retry: 1,
            ...options,
        })
}
/*

// @ts-ignore
export function usePatchApiQuery<P extends PathsWithMethod<paths, 'patch'>>(p: P , init: FetchOptions<FilterKeys<paths[P], 'patch'>>, invalidates: string[], options: UseQueryOptions<any> = {}) {
    const { PATCH } = useClient();

    const queryClient = useQueryClient();


    return (request: GenerateLoanRequest) => (PATCH(p, {
        params: {
            path: {
                loanId
            }
        },
        body: request
    })).then(async res => {
        await queryClient.invalidateQueries({
            queryKey: [invalidates.map(i => [i])]
        });
         return res;
    });
    const {PATCH} = useClient();
    // @ts-ignore
    return useQuery(getApiQueryParams(p, init), () => handleResult(PATCH(p as P, init)), 
        // @ts-ignore
        {
            enabled: !!p,
            retry: 1,
            ...options,
        })
}

*/

// @ts-ignore
export function useApiQueries<P extends PathsWithMethod<paths, 'get'>>(p: P | undefined | '', inits: FetchOptions<FilterKeys<paths[P], 'get'>>[], options: UseQueryOptions<any> = {}) {
    const { GET } = useClient();

    const results = useQueries(inits.map(init => ({
        queryKey: getApiQueryParams(p, init),
        queryFn: () => handleResult(GET(p as P, init))
    })));

    return combineResults(results);
}

export const combineResults = <P, T>(results: UseQueryResult<T>[]): UseQueryResult<T[]> => {
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
    } as UseQueryResult<T[]>
}
