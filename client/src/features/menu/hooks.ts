import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { MenuPreview } from "@ricportal/shared";
import { useState } from "react";
import { useToast } from "../../components/toast/ToastProvider";
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

// Choose a file, preview it, confirm it. Nothing is saved before the confirm.
export function useMenuImportFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [preview, setPreview] = useState<MenuPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewMutation = useMenuPreview();
  const confirmMutation = useMenuConfirm();
  const toast = useToast();

  return {
    file,
    inputKey,
    preview,
    error,
    previewing: previewMutation.isPending,
    confirming: confirmMutation.isPending,
    chooseFile: (next: File | null) => {
      setFile(next);
      setPreview(null);
      setError(null);
      if (next === null) {
        setInputKey((key) => key + 1);
      }
    },
    closePreview: () => {
      setPreview(null);
    },
    upload: () => {
      if (file === null) return;
      setError(null);
      previewMutation.mutate(file, {
        onSuccess: setPreview,
        onError: (failure) => {
          setPreview(null);
          setError(
            failure.message === "Some fields are not valid."
              ? "Choose an Excel file ending in .xlsx."
              : failure.message,
          );
        },
      });
    },
    confirm: () => {
      if (preview?.token === null || preview?.token === undefined) return;
      confirmMutation.mutate(preview.token, {
        onSuccess: (result) => {
          toast.show({
            kind: "success",
            message: `Imported ${String(result.days)} feeding days from ${String(result.batches)} sheet(s).`,
          });
          setPreview(null);
          setFile(null);
          setInputKey((key) => key + 1);
        },
        onError: (failure) => {
          setPreview(null);
          setError(failure.message);
        },
      });
    },
  };
}
