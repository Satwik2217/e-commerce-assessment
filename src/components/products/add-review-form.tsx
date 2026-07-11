'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

interface AddReviewFormProps {
  productId: string;
}

export function AddReviewForm({ productId }: AddReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment: comment || null }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to submit review');
      } else {
        setSuccess(true);
        setComment('');
        setRating(5);
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center text-sm text-green-600 font-semibold">
        Your review has been submitted successfully! Thank you for your feedback.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-base">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive font-semibold">
            {error}
          </div>
        )}

        {/* Rating Stars Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground block">Rating</label>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, idx) => {
              const starVal = idx + 1;
              const isFilled = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRating(starVal)}
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment Input */}
        <div className="space-y-1">
          <label htmlFor="comment" className="text-xs font-semibold text-muted-foreground block">
            Comment
          </label>
          <Textarea
            id="comment"
            placeholder="Share your thoughts on product quality, size, color accuracy, and overall experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="text-sm"
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full text-xs font-semibold h-9">
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </div>
  );
}
