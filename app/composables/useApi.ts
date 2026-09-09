import type { AsyncData, UseFetchOptions } from 'nuxt/app'
import { useFetch } from 'nuxt/app'

interface ApiOptions {
  query?: Record<string, string | number | boolean | string[] | number[]>
  headers?: HeadersInit
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: object
  immediate?: boolean
  responseType?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream'
}

export function useApi() {
  const config = useRuntimeConfig()

  function request<T>(
    url: MaybeRefOrGetter<string>,
    options: ApiOptions = {},
  ) {
    return useFetch(url, {
      ...options,
      baseURL: config.public.apiBase,
      credentials: 'include',
      server: false,
    } as UseFetchOptions<unknown>) as AsyncData<T | null, Error | undefined>
  }

  async function execute<T>(
    url: MaybeRefOrGetter<string>,
    method: 'POST' | 'PUT' | 'DELETE',
    body?: object,
    options: ApiOptions = {},
  ) {
    const result = await request<T>(url, {
      ...options,
      method,
      body,
      immediate: false,
    })
    await result.execute()
    if (result.error.value)
      throw result.error.value
    return result.data.value
  }

  return {
    request,
    get: request,
    post: <T>(url: MaybeRefOrGetter<string>, body?: object, options?: ApiOptions) =>
      execute<T>(url, 'POST', body, options),
    put: <T>(url: MaybeRefOrGetter<string>, body?: object, options?: ApiOptions) =>
      execute<T>(url, 'PUT', body, options),
    delete: <T>(url: MaybeRefOrGetter<string>, options?: ApiOptions) =>
      execute<T>(url, 'DELETE', undefined, options),
  }
}
