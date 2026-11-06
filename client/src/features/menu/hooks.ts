import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { confirmMenu, fetchBatches, previewMenu } from "./api";

export function useMenuPreview() {
  return useMutation({ mutationFn: previewMenu });
}

export function useMenuConfirm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: confirmMenu,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["menu-batches"] });
      await client.invalidateQueries({ queryKey: ["calendar"] });
    },
  });
}

export function useMenuBatches(page: number) {
  return useQuery({
    queryKey: ["menu-batches", page],
    queryFn: () => fetchBatches(page),
    placeholderData: keepPreviousData,
  });
}
