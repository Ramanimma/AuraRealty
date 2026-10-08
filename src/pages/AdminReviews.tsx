import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type Review } from "@/lib/api";
import AdminLayout from "@/components/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Star, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < count ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const qc = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["/api/admin/reviews"],
    queryFn: () => adminApi.reviews.list(),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Review> }) =>
      adminApi.reviews.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast.success("Review updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.reviews.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      setDeletingId(null);
      toast.success("Review deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (review: Review) => {
    updateMut.mutate({ id: review.id, data: { is_approved: !review.is_approved } });
  };

  const approved = reviews.filter((r) => r.is_approved).length;
  const pending = reviews.length - approved;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-primary">Reviews</h1>
          <div className="flex gap-3 font-sans text-sm text-muted-foreground">
            <span className="text-green-600 font-medium">{approved} approved</span>
            <span>·</span>
            <span className="text-yellow-600 font-medium">{pending} pending</span>
          </div>
        </div>

        <Card className="border border-border/60 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-muted-foreground animate-pulse font-sans">Loading…</div>
          ) : reviews.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground font-sans">No reviews yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((r) => (
                    <TableRow
                      key={r.id}
                      data-testid={`row-review-${r.id}`}
                      className={r.is_approved ? "" : "bg-yellow-50/40"}
                    >
                      <TableCell className="font-medium text-sm">{r.client_name}</TableCell>
                      <TableCell><Stars count={r.rating} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px]">
                        <p className="truncate">{r.comment}</p>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggle(r)}
                          disabled={updateMut.isPending}
                          className="flex items-center gap-1.5 text-xs font-medium font-sans transition-colors"
                          data-testid={`button-approve-${r.id}`}
                          title={r.is_approved ? "Click to reject" : "Click to approve"}
                        >
                          {r.is_approved ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={r.is_approved ? "text-green-700" : "text-yellow-600"}>
                            {r.is_approved ? "Approved" : "Pending"}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(r.id)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-review-${r.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Delete Confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm border border-border shadow-xl">
            <CardHeader><CardTitle className="font-serif text-lg text-primary">Delete Review?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-sans">This cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => deleteMut.mutate(deletingId!)} disabled={deleteMut.isPending}>
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
