import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useUploads() {
  return useQuery({
    queryKey: [api.uploads.list.path],
    queryFn: async () => {
      const res = await fetch(api.uploads.list.path);
      if (!res.ok) throw new Error("Failed to fetch uploads");
      return api.uploads.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpload(id: number) {
  return useQuery({
    queryKey: [api.uploads.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.uploads.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch upload");
      return api.uploads.get.responses[200].parse(await res.json());
    },
    // Poll while pending or processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "pending" || data.status === "processing")) {
        return 2000;
      }
      return false;
    },
  });
}

export function useCreateUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(api.uploads.create.path, {
        method: "POST",
        body: formData,
        // Don't set Content-Type header manually for FormData, browser does it
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.uploads.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to upload image");
      }
      return api.uploads.create.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.uploads.list.path] });
      toast({
        title: "Image Uploaded",
        description: "Your image is now being processed into 3D.",
      });
      return data;
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    },
  });
}

export function useProcessUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.uploads.process.path, { id });
      const res = await fetch(url, { method: "POST" });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error("Upload not found");
        throw new Error("Failed to start processing");
      }
      return api.uploads.process.responses[200].parse(await res.json());
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.uploads.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.uploads.list.path] });
      toast({
        title: "Processing Started",
        description: "Generating depth map...",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: error.message,
      });
    },
  });
}
