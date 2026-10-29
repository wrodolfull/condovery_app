import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
export type Resource<T> = {
  data: T | null;
  loading: boolean;
  updatedAt: Date | null;
  error: string;
  reload: () => Promise<T | undefined>;
};
export function useResource<T>(path: string | null): Resource<T> {
  const { api, viewer } = useAuth();
  const query = useQuery<T, Error>({
    queryKey: [viewer?.id ?? "anonymous", viewer?.condominium_id ?? "", path],
    queryFn: () => api.request<T>(path!),
    enabled: !!path,
    staleTime: 15000,
    retry: false,
  });
  return {
    data: query.data ?? null,
    loading: !!path && query.isPending,
    updatedAt: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    error: query.error?.message ?? "",
    reload: () => query.refetch({ throwOnError: true }).then((r) => r.data),
  };
}
