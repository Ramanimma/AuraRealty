import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

const ReviewApprovals = () => {
  const qc = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => adminApi.reviews.list(),
  });

  const toggle = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      adminApi.reviews.update(id, { is_approved: approved }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review updated");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.reviews.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Review deleted");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Review Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.client_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{r.comment}</TableCell>
                  <TableCell>
                    <Badge variant={r.is_approved ? "default" : "secondary"}>
                      {r.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.is_approved ? (
                        <Button size="icon" variant="ghost" title="Unapprove" onClick={() => toggle.mutate({ id: r.id, approved: false })}>
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" title="Approve" onClick={() => toggle.mutate({ id: r.id, approved: true })}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Delete" onClick={() => remove.mutate(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No reviews yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewApprovals;
