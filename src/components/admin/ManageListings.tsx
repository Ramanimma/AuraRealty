import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Listing } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const emptyListing = { title: "", price: "", address: "", beds: 0, baths: 0, sqft: 0, description: "", main_image: "" };

const ManageListings = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Listing> | null>(null);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: () => adminApi.listings.list(),
  });

  const upsert = useMutation({
    mutationFn: async (listing: Partial<Listing>) => {
      if (listing.id) {
        const { id, created_at, ...rest } = listing;
        await adminApi.listings.update(id, rest);
      } else {
        await adminApi.listings.create(listing);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      setEditing(null);
      toast.success("Listing saved");
    },
    onError: () => toast.error("Failed to save listing"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.listings.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success("Listing deleted");
    },
    onError: () => toast.error("Failed to delete listing"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-serif">Manage Listings</CardTitle>
        {!editing && (
          <Button size="sm" onClick={() => setEditing({ ...emptyListing })}>
            <Plus className="h-4 w-4 mr-1" /> Add Listing
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing && (
          <div className="mb-6 rounded-lg border border-border p-4 space-y-3 bg-background">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Title" value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <Input placeholder="Price (e.g. $500,000)" value={editing.price ?? ""} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
              <Input placeholder="Address" value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} className="md:col-span-2" />
              <Input placeholder="Beds" type="number" value={editing.beds ?? 0} onChange={(e) => setEditing({ ...editing, beds: +e.target.value })} />
              <Input placeholder="Baths" type="number" value={editing.baths ?? 0} onChange={(e) => setEditing({ ...editing, baths: +e.target.value })} />
              <Input placeholder="Sqft" type="number" value={editing.sqft ?? 0} onChange={(e) => setEditing({ ...editing, sqft: +e.target.value })} />
              <Input placeholder="Image URL" value={editing.main_image ?? ""} onChange={(e) => setEditing({ ...editing, main_image: e.target.value })} />
            </div>
            <Textarea placeholder="Description" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => upsert.mutate(editing)} disabled={upsert.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{l.price}</TableCell>
                  <TableCell>{l.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(l.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {listings.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No listings yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ManageListings;
