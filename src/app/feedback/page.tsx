"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Star } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@fitconnect/shared/firebase/config";

export default function FeedbackPage() {
  const [form, setForm] = useState({ name: "", email: "", rating: 0, category: "", message: "" });
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.rating === 0) { setError("Please select a rating."); return; }
    setLoading(true);
    setError("");
    try {
      await addDoc(collection(db, "feedback"), {
        ...form,
        createdAt: serverTimestamp(),
        status: "unread",
      });
      setSubmitted(true);
      setForm({ name: "", email: "", rating: 0, category: "", message: "" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-peach-200">
      {/* Hero */}
      <section className="relative pt-40 pb-20 bg-warmDark-800 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
          <span className="text-[20vw] font-black text-peach-200 whitespace-nowrap font-display">FEEDBACK</span>
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl md:text-7xl font-black text-peach-200 tracking-tighter font-display">SHARE YOUR EXPERIENCE</h1>
            <p className="text-peach-400 mt-4 max-w-md mx-auto tracking-wider text-sm">
              Your feedback helps us grow. Tell us what you loved or what we can improve.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-terra-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-10 h-10 text-terra-400" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black text-olive-600 mb-4 font-display">THANK YOU!</h2>
              <p className="text-olive-400 mb-8">Your feedback has been submitted. We truly appreciate it.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-8 py-4 bg-terra-400 text-peach-50 font-black text-sm tracking-wider hover:bg-terra-300 transition-all"
              >
                SUBMIT ANOTHER
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h2 className="text-3xl font-black text-olive-600 mb-2 font-display">YOUR FEEDBACK</h2>
              <p className="text-olive-300 mb-10 text-sm">All fields marked with * are required.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-olive-300 tracking-wider uppercase mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-peach-300 border border-peach-400 px-4 py-3.5 text-olive-600 text-sm focus:outline-none focus:border-terra-400/50 transition-colors placeholder:text-olive-300/40"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-olive-300 tracking-wider uppercase mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-peach-300 border border-peach-400 px-4 py-3.5 text-olive-600 text-sm focus:outline-none focus:border-terra-400/50 transition-colors placeholder:text-olive-300/40"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-olive-300 tracking-wider uppercase mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-peach-300 border border-peach-400 px-4 py-3.5 text-olive-600 text-sm focus:outline-none focus:border-terra-400/50 transition-colors"
                  >
                    <option value="">Select a category</option>
                    <option value="class">Class Experience</option>
                    <option value="instructor">Instructor</option>
                    <option value="facility">Facility & Equipment</option>
                    <option value="booking">Booking Process</option>
                    <option value="general">General Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-olive-300 tracking-wider uppercase mb-3">Rating *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setForm({ ...form, rating: star })}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className="w-8 h-8"
                          fill={star <= (hoveredStar || form.rating) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth={1.5}
                          style={{ color: star <= (hoveredStar || form.rating) ? "var(--color-terra-400, #C0714E)" : "var(--color-olive-300, #7D7D5A)" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-olive-300 tracking-wider uppercase mb-2">Your Feedback *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-peach-300 border border-peach-400 px-4 py-3.5 text-olive-600 text-sm focus:outline-none focus:border-terra-400/50 transition-colors resize-none placeholder:text-olive-300/40"
                    placeholder="Tell us about your experience..."
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-terra-400 text-peach-50 font-black text-sm tracking-wider hover:bg-terra-300 transition-all disabled:opacity-60"
                >
                  <span>{loading ? "SUBMITTING..." : "SUBMIT FEEDBACK"}</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
