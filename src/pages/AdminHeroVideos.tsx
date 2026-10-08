import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, HeroVideo } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { Film, Plus, Trash2, Eye, EyeOff, Save, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminHeroVideos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newOrder, setNewOrder] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingOrder, setEditingOrder] = useState<Record<string, number>>({});

  // Add-form upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  // Per-row replace state: id → progress (0-100) or null when idle
  const [replaceProgress, setReplaceProgress] = useState<Record<string, number | null>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/admin"); return; }
      setUser(session.user);
    });
  }, [navigate]);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["admin-hero-videos"],
    queryFn: () => adminApi.heroVideos.list(),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (url: string) =>
      adminApi.heroVideos.create({
        title: newTitle.trim() || undefined,
        cloudinary_url: url,
        display_order: newOrder,
        is_active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-videos"] });
      setNewTitle("");
      setSelectedFile(null);
      setNewOrder(0);
      toast({ title: "Video added", description: "Hero video has been added successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateUrlMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      adminApi.heroVideos.update(id, { cloudinary_url: url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-videos"] });
      toast({ title: "Video replaced", description: "Video file has been updated." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.heroVideos.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-videos"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const orderMutation = useMutation({
    mutationFn: ({ id, display_order }: { id: string; display_order: number }) =>
      adminApi.heroVideos.update(id, { display_order }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-videos"] });
      toast({ title: "Order updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.heroVideos.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hero-videos"] });
      toast({ title: "Video deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getToken = async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? "";
  };

  const uploadFile = (file: File, token: string, onProgress: (pct: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("video", file);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) resolve(data.url);
            else reject(new Error(data.error || "Upload failed"));
          } catch {
            reject(new Error("Invalid server response"));
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || `Server error: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error — check your connection and try again")));
      xhr.addEventListener("timeout", () => reject(new Error("Upload timed out — try a smaller file")));

      xhr.timeout = 300000;
      xhr.open("POST", "/api/admin/upload-hero-video");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const handleAdd = async () => {
    if (!selectedFile) {
      toast({ title: "File required", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    const token = await getToken();
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");
    try {
      const url = await uploadFile(selectedFile, token, setUploadProgress);
      createMutation.mutate(url);
    } catch (err: any) {
      setUploadError(err.message);
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReplaceFile = async (id: string, file: File) => {
    const token = await getToken();
    setReplaceProgress(prev => ({ ...prev, [id]: 0 }));
    try {
      const url = await uploadFile(file, token, (pct) =>
        setReplaceProgress(prev => ({ ...prev, [id]: pct }))
      );
      updateUrlMutation.mutate({ id, url });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setReplaceProgress(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleSaveOrder = (id: string) => {
    const val = editingOrder[id];
    if (val === undefined) return;
    orderMutation.mutate({ id, display_order: val });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} signOut={signOut} />

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <header className="flex items-center gap-4 h-16 px-6 border-b bg-background shrink-0">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            data-testid="button-open-sidebar"
          >
            <Film className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-accent" />
            <h1 className="text-lg font-semibold">Hero Videos</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Add Video Form */}
          <div className="bg-card border rounded-lg p-6 mb-8">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Video
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Austin Skyline"
                  data-testid="input-new-video-title"
                  className="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Video File *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  data-testid="input-new-video-file"
                  onChange={e => {
                    setSelectedFile(e.target.files?.[0] ?? null);
                    setUploadError("");
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                />
                {isUploading && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
                      <span className="text-xs text-muted-foreground">Uploading... {uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadError && (
                  <p className="mt-2 text-xs text-red-600 font-medium">⚠️ {uploadError}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Display Order
                </label>
                <input
                  type="number"
                  value={newOrder}
                  onChange={e => setNewOrder(parseInt(e.target.value) || 0)}
                  data-testid="input-new-video-order"
                  className="w-full px-3 py-2 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={isUploading || createMutation.isPending}
              data-testid="button-add-video"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              {isUploading ? `Uploading ${uploadProgress}%...` : createMutation.isPending ? "Adding..." : "Add Video"}
            </button>
          </div>

          {/* Video List */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-base font-semibold">
                Hero Videos{" "}
                <span className="text-sm font-normal text-muted-foreground">({videos.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : videos.length === 0 ? (
              <div className="p-12 text-center">
                <Film className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No hero videos yet. Add one above.</p>
              </div>
            ) : (
              <div className="divide-y">
                {videos.map((video: HeroVideo) => {
                  const rowProgress = replaceProgress[video.id];
                  const isRowUploading = rowProgress !== null && rowProgress !== undefined;
                  return (
                    <div
                      key={video.id}
                      data-testid={`row-hero-video-${video.id}`}
                      className="px-6 py-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Title + URL */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {video.title || <span className="text-muted-foreground italic">Untitled</span>}
                          </p>
                          <p
                            className="text-xs text-muted-foreground truncate mt-0.5"
                            title={video.cloudinary_url}
                          >
                            {video.cloudinary_url}
                          </p>
                        </div>

                        {/* Replace video button */}
                        <div className="shrink-0">
                          <label
                            data-testid={`button-replace-video-${video.id}`}
                            title="Replace video file"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border cursor-pointer transition-colors ${
                              isRowUploading
                                ? "opacity-50 pointer-events-none"
                                : "hover:bg-muted"
                            }`}
                          >
                            {isRowUploading ? (
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-yellow-600" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-muted-foreground">
                              {isRowUploading ? `${rowProgress}%` : "Replace"}
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleReplaceFile(video.id, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </div>

                        {/* Order input */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            defaultValue={video.display_order}
                            onChange={e =>
                              setEditingOrder(prev => ({
                                ...prev,
                                [video.id]: parseInt(e.target.value) || 0,
                              }))
                            }
                            data-testid={`input-order-${video.id}`}
                            className="w-16 px-2 py-1.5 text-xs rounded border bg-background text-center focus:outline-none focus:ring-1 focus:ring-accent"
                          />
                          <button
                            onClick={() => handleSaveOrder(video.id)}
                            disabled={orderMutation.isPending || editingOrder[video.id] === undefined}
                            data-testid={`button-save-order-${video.id}`}
                            title="Save order"
                            className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
                          >
                            <Save className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Active toggle */}
                        <button
                          onClick={() =>
                            toggleMutation.mutate({ id: video.id, is_active: !video.is_active })
                          }
                          disabled={toggleMutation.isPending}
                          data-testid={`button-toggle-active-${video.id}`}
                          title={video.is_active ? "Deactivate" : "Activate"}
                          className="shrink-0 p-1.5 rounded hover:bg-muted disabled:opacity-50 transition-colors"
                        >
                          {video.is_active ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${video.title || "this video"}"?`)) {
                              deleteMutation.mutate(video.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-video-${video.id}`}
                          title="Delete video"
                          className="shrink-0 p-1.5 rounded hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>

                      {/* Per-row progress bar */}
                      {isRowUploading && (
                        <div className="mt-2 ml-0">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-yellow-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${rowProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SQL hint */}
          <div className="mt-6 p-4 rounded-lg border border-dashed bg-muted/30">
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">
              <span className="font-semibold text-foreground">Supabase table required:</span>
              {" "}Run this SQL in your Supabase dashboard if the table doesn't exist yet:
              <br />
              <code>
                CREATE TABLE hero_videos (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, title text, cloudinary_url text NOT NULL, display_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now());
              </code>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminHeroVideos;
