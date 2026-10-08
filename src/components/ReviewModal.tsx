import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";

const reviewSchema = z.object({
  client_name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  rating: z.number().int().min(1, "Please select a rating").max(5),
  comment: z.string().trim().min(1, "Comment is required").max(1000, "Comment must be under 1000 characters"),
});

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReviewModal = ({ open, onOpenChange }: ReviewModalProps) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rating === 0 || !comment.trim()) {
      toast.error("Please fill in all fields and select a rating.");
      return;
    }

    const parsed = reviewSchema.safeParse({ client_name: name, rating, comment });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Invalid input.");
      return;
    }

    setSubmitting(true);
    try {
      await api.reviews.submit({
        client_name: parsed.data.client_name,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      });
    } catch (err: any) {
      setSubmitting(false);
      const msg = err.message?.includes("Rate limit")
        ? err.message
        : "Something went wrong. Please try again.";
      toast.error(msg);
      return;
    }
    setSubmitting(false);

    setSubmitted(true);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      // Reset state on close
      setTimeout(() => {
        setName("");
        setRating(0);
        setComment("");
        setSubmitted(false);
      }, 300);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="text-center py-8">
            <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
              Thanks for your review!
            </h3>
            <p className="text-muted-foreground">
              Your feedback means the world to us.
            </p>
            <Button className="mt-6" onClick={() => handleClose(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">Leave a Review</DialogTitle>
              <DialogDescription>
                Share your experience working with us.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= (hoveredRating || rating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Comment
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  maxLength={1000}
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
