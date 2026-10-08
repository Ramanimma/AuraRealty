import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Listing, type Agent, type Neighborhood } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, X, Home, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadPropertyImages } from "@/lib/uploadPropertyImages";

const EMPTY: Partial<Listing> = {
  title: "", address: "", city: "", zip_code: "", price: "",
  property_type: "Single Family", listing_type: "sale", status: "active",
  beds: 0, baths: 0, sqft: 0, year_built: undefined, garage_spaces: 0,
  has_pool: false, is_featured: false, description: "", main_image: "",
  agent_id: "", neighborhood_id: "", mls_number: "", virtual_tour_url: "",
  images: [],
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  sold: "bg-gray-200 text-gray-700",
  rented: "bg-blue-100 text-blue-700",
  off_market: "bg-red-100 text-red-700",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground font-sans">{label}</label>
      {children}
    </div>
  );
}

export default function AdminListings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Listing>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isUploadingMain, setIsUploadingMain] = useState(false);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const currentImages: string[] = form.images ?? [];
  const MAX_IMAGES = 10;

  const addImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    if (currentImages.length >= MAX_IMAGES) { toast.error(`Max ${MAX_IMAGES} images allowed`); return; }
    set("images", [...currentImages, url]);
    setNewImageUrl("");
  };

  const removeImage = (idx: number) => {
    set("images", currentImages.filter((_, i) => i !== idx));
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMain(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? "";
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/upload-property-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        set("main_image", data.url);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setIsUploadingMain(false);
      e.target.value = "";
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = MAX_IMAGES - currentImages.length;
    if (remaining <= 0) { toast.error(`Max ${MAX_IMAGES} images allowed`); return; }
    setUploadingImages(true);
    try {
      const listingId = form.id ?? `new-${Date.now()}`;
      const urls = await uploadPropertyImages(files, listingId);
      const toAdd = urls.slice(0, remaining);
      set("images", [...currentImages, ...toAdd]);
      toast.success(`${toAdd.length} image${toAdd.length !== 1 ? "s" : ""} uploaded`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImages(false);
      if (imageUploadRef.current) imageUploadRef.current.value = "";
    }
  };

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["/api/admin/listings"],
    queryFn: () => adminApi.listings.list(),
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["/api/admin/agents"],
    queryFn: () => adminApi.agents.list(),
  });

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ["/api/admin/neighborhoods"],
    queryFn: () => adminApi.neighborhoods.list(),
  });

  const set = (k: keyof Listing, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const upsert = useMutation({
    mutationFn: async (data: Partial<Listing>) => {
      const payload = {
        ...data,
        listing_type: data.listing_type || "sale",
        status: data.status || "active",
      };
      if (payload.id) {
        const { id, created_at, ...rest } = payload as Listing;
        await adminApi.listings.update(id, rest);
      } else {
        await adminApi.listings.create(payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      setShowForm(false);
      toast.success(form.id ? "Listing updated" : "Listing created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.listings.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      setDeletingId(null);
      toast.success("Listing deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openAdd = () => { setForm(EMPTY); setShowForm(true); };
  const openEdit = (l: Listing) => { setForm({ ...l }); setShowForm(true); };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-primary">Listings</h1>
          <Button
            onClick={openAdd}
            data-testid="button-add-listing"
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-sans"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Listing
          </Button>
        </div>

        <Card className="border border-border/60 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground animate-pulse font-sans">Loading…</div>
          ) : listings.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-sans">No listings yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photo</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Beds</TableHead>
                    <TableHead>Baths</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((l) => (
                    <TableRow key={l.id} data-testid={`row-listing-${l.id}`}>
                      <TableCell>
                        {l.main_image ? (
                          <img
                            src={l.main_image}
                            alt={l.title}
                            className="w-14 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-14 h-10 bg-muted rounded flex items-center justify-center">
                            <Home className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm max-w-[180px] truncate">
                        {l.address}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {l.price}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {l.property_type ?? "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium font-sans ${
                            STATUS_COLORS[l.status ?? "Active"] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {l.status ?? "Active"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.city ?? "—"}</TableCell>
                      <TableCell className="text-sm">{l.beds}</TableCell>
                      <TableCell className="text-sm">{l.baths}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(l)}
                            data-testid={`button-edit-${l.id}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingId(l.id)}
                            data-testid={`button-delete-${l.id}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Add/Edit Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
          <div className="w-full max-w-2xl h-full bg-background overflow-y-auto shadow-2xl flex flex-col">
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h2 className="font-serif text-lg font-bold text-primary">
                {form.id ? "Edit Listing" : "Add New Listing"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 font-sans flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Title *">
                  <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Property title" />
                </Field>
                <Field label="Price *">
                  <Input value={form.price ?? ""} onChange={(e) => set("price", e.target.value)} placeholder="e.g. 450000" />
                </Field>
                <Field label="Address *">
                  <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Street address" />
                </Field>
                <Field label="City">
                  <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
                </Field>
                <Field label="ZIP Code">
                  <Input value={form.zip_code ?? ""} onChange={(e) => set("zip_code", e.target.value)} placeholder="78701" />
                </Field>
                <Field label="MLS Number">
                  <Input value={form.mls_number ?? ""} onChange={(e) => set("mls_number", e.target.value)} placeholder="MLS #" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Property Type">
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.property_type ?? "Single Family"}
                    onChange={(e) => set("property_type", e.target.value)}
                  >
                    {["Single Family", "Condo", "Townhouse", "Multi-Family", "Land", "Commercial"].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Listing Type">
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.listing_type ?? "sale"}
                    onChange={(e) => set("listing_type", e.target.value)}
                  >
                    <option value="sale">For Sale</option>
                    <option value="rent">For Rent</option>
                    <option value="lease">For Lease</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.status ?? "active"}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                    <option value="off_market">Off Market</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Field label="Beds">
                  <Input type="number" value={form.beds ?? 0} onChange={(e) => set("beds", Number(e.target.value))} />
                </Field>
                <Field label="Baths">
                  <Input type="number" value={form.baths ?? 0} onChange={(e) => set("baths", Number(e.target.value))} />
                </Field>
                <Field label="Sqft">
                  <Input type="number" value={form.sqft ?? 0} onChange={(e) => set("sqft", Number(e.target.value))} />
                </Field>
                <Field label="Year Built">
                  <Input
                    type="number"
                    value={form.year_built ?? ""}
                    onChange={(e) => set("year_built", e.target.value ? Number(e.target.value) : null)}
                    placeholder="2020"
                  />
                </Field>
                <Field label="Garage">
                  <Input type="number" value={form.garage_spaces ?? 0} onChange={(e) => set("garage_spaces", Number(e.target.value))} />
                </Field>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.has_pool} onChange={(e) => set("has_pool", e.target.checked)} className="rounded" />
                  Has Pool
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="rounded" />
                  Featured
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground font-sans">Main Image</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {form.main_image && (
                    <img
                      src={form.main_image}
                      alt="Main"
                      className="h-16 w-24 object-cover rounded border"
                    />
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input text-sm font-medium text-foreground bg-background hover:bg-muted rounded-md transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload Main Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleMainImageUpload}
                    />
                  </label>
                  {isUploadingMain && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground font-sans uppercase tracking-wide">
                    Additional Images
                  </label>
                  <span className="text-xs text-muted-foreground font-sans">
                    {currentImages.length} / {MAX_IMAGES} images
                  </span>
                </div>

                {/* URL add row */}
                <div className="flex gap-2">
                  <Input
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
                    placeholder="https://... paste image URL"
                    className="flex-1 text-sm"
                    data-testid="input-add-image-url"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addImageUrl}
                    disabled={!newImageUrl.trim() || currentImages.length >= MAX_IMAGES}
                    data-testid="button-add-image-url"
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {/* Upload button */}
                <input
                  ref={imageUploadRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  data-testid="input-upload-images"
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageUploadRef.current?.click()}
                  disabled={uploadingImages || currentImages.length >= MAX_IMAGES}
                  data-testid="button-upload-images"
                  className="gap-2 text-xs"
                >
                  {uploadingImages ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" />Uploading…</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5" />Upload Images</>
                  )}
                </Button>

                {/* Thumbnail row */}
                {currentImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentImages.map((url, i) => (
                      <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={url}
                          alt={`Image ${i + 1}`}
                          data-testid={`thumbnail-image-${i}`}
                          style={{ width: "72px", height: "54px", objectFit: "cover", display: "block" }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          data-testid={`button-remove-image-${i}`}
                          style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", padding: 0 }}
                        >
                          <X style={{ width: "10px", height: "10px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">Max {MAX_IMAGES} images · 5 MB each. These appear in the property gallery.</p>
              </div>

              <Field label="Virtual Tour URL">
                <Input value={form.virtual_tour_url ?? ""} onChange={(e) => set("virtual_tour_url", e.target.value)} placeholder="https://..." />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Agent">
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.agent_id ?? ""}
                    onChange={(e) => set("agent_id", e.target.value || null)}
                  >
                    <option value="">— Select Agent —</option>
                    {(agents as Agent[]).map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Neighborhood">
                  <select
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                    value={form.neighborhood_id ?? ""}
                    onChange={(e) => set("neighborhood_id", e.target.value || null)}
                  >
                    <option value="">— Select Neighborhood —</option>
                    {(neighborhoods as Neighborhood[]).map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  placeholder="Describe the property…"
                />
              </Field>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => upsert.mutate(form)}
                  disabled={upsert.isPending}
                >
                  {upsert.isPending ? "Saving…" : form.id ? "Save Changes" : "Create Listing"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border border-border shadow-xl">
            <CardHeader>
              <CardTitle className="font-serif text-lg text-primary">Delete Listing?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-sans">This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMut.mutate(deletingId!)}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
