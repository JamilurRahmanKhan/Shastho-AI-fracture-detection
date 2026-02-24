/**
 * Frontend page: ProductReviews
 *
 * ShasthoAI: AI-powered fracture detection + hospital workflow platform.
 * Purpose: React page component rendered by the client router; responsible for data loading and composing UI sections.
 *
 * Project-specific notes:
 * - (none)
 */

// export default ProductReviews;
import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/services/api";
import { auth } from "@/firebase/firebase";
import {
  User2,
  MessageSquareText,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

const StarRow = ({ value }) => {
  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < Math.floor(value)
              ? "text-yellow-400 fill-current"
              : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Dynamic reviews (backend + database).
 * - Lists reviews with pagination
 * - Shows rating summary + distribution
 * - Allows verified purchasers to write/update a review
 */
const ProductReviews = ({ product }) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [counts, setCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const [form, setForm] = useState({
    rating: 5,
    comment: "",
    userDisplayName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  const user = auth.currentUser;

  const canLoadMore = items.length < total;

  const distribution = useMemo(() => {
    const t = Object.values(counts).reduce((s, x) => s + (x || 0), 0) || 0;
    return [5, 4, 3, 2, 1].map((star) => {
      const c = counts[star] || 0;
      const pct = t ? Math.round((c / t) * 100) : 0;
      return { star, c, pct };
    });
  }, [counts]);

  const load = async (p = 1, mode = "replace") => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getStoreProductReviews(product.id, {
        page: p,
        limit,
      });
      const list = Array.isArray(data?.items) ? data.items : [];
      setItems((prev) => (mode === "append" ? [...prev, ...list] : list));
      setTotal(Number(data?.total || 0));
      setAvgRating(Number(data?.avgRating || 0));
      setCounts(data?.counts || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    } catch (e) {
      setError(e?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setItems([]);
    load(1, "replace");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (!user) return;
    setForm((p) => ({
      ...p,
      userDisplayName:
        p.userDisplayName || user.displayName || user.email || "",
    }));
  }, [user]);

  const onSubmitReview = async () => {
    setToast({ type: "", message: "" });
    if (!user) {
      setToast({ type: "error", message: "Please log in to write a review." });
      return;
    }
    const rating = clamp(Number(form.rating) || 0, 1, 5);
    const comment = String(form.comment || "").trim();
    if (!comment || comment.length < 5) {
      setToast({
        type: "error",
        message: "Please write at least 5 characters.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await api.createStoreProductReview(product.id, {
        rating,
        comment,
        userDisplayName: String(form.userDisplayName || "").trim(),
      });
      setToast({ type: "success", message: "Review submitted." });
      setForm((p) => ({ ...p, comment: "" }));
      await load(1, "replace");
      setPage(1);
    } catch (e) {
      setToast({
        type: "error",
        message: e?.message || "Failed to submit review",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        {/* Summary */}
        <div className="lg:w-1/3 space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Customer Reviews
          </h2>

          <div className="flex items-center gap-3">
            <div className="text-4xl font-extrabold text-slate-900">
              {avgRating ? avgRating.toFixed(1) : "0.0"}
            </div>
            <div className="space-y-1">
              <StarRow value={avgRating} />
              <div className="text-sm text-slate-600">
                Based on {total} review{total === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3">
                <div className="w-10 text-sm text-slate-700">{d.star}★</div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-yellow-400"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm text-slate-600">
                  {d.c}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews list + form */}
        <div className="lg:w-2/3 space-y-6">
          {!!toast.message && (
            <div
              className={`rounded-md border p-3 text-sm ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Write review */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="text-base font-semibold text-slate-900">
                  Write a review
                </div>
                {user && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              {!user && (
                <div className="text-sm text-slate-600">
                  Log in required{" "}
                  <span className="text-slate-400">
                    (verified purchase only)
                  </span>
                  .
                </div>
              )}
            </div>

            {/* Form */}
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Your name
                </label>
                <div className="relative">
                  <User2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                     disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    value={form.userDisplayName}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        userDisplayName: e.target.value,
                      }))
                    }
                    placeholder="e.g., John D."
                    disabled={!user}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  This will appear with your review.
                </p>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Rating
                </label>
                <div className="relative">
                  <Star className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    className="w-full appearance-none pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                     disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                    value={form.rating}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, rating: Number(e.target.value) }))
                    }
                    disabled={!user}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "star" : "stars"}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-xs text-slate-500">Choose 1–5 stars.</p>
              </div>
            </div>

            {/* Comment */}
            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Comment
              </label>
              <div className="relative">
                <MessageSquareText className="pointer-events-none absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <textarea
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm min-h-[110px]
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                   resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  value={form.comment}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, comment: e.target.value }))
                  }
                  placeholder="Share your experience..."
                  disabled={!user}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Keep it helpful: what you liked, what could be better, and any
                tips for others.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              {!user && (
                <div className="text-xs text-slate-500 mr-auto">
                  Please log in to submit a review.
                </div>
              )}

              <button
                onClick={onSubmitReview}
                disabled={!user || submitting}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold
                 bg-blue-600 text-white hover:bg-blue-700
                 disabled:bg-slate-300 disabled:text-white disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 transition-colors"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="text-slate-600">Loading reviews...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-slate-600">No reviews yet.</div>
          ) : (
            <div className="space-y-4">
              {items.map((r) => (
                <div
                  key={r.id}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {r.user}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRow value={r.rating} />
                        {r.verified && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                  <p className="mt-3 text-slate-700 leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              ))}

              {canLoadMore && (
                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                      const next = page + 1;
                      setPage(next);
                      await load(next, "append");
                    }}
                    className="border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold px-4 py-2 rounded-lg text-sm"
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;
