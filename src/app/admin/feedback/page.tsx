"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Trash2 } from "lucide-react";
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@fitconnect/shared/firebase/config";
import { Timestamp } from "firebase/firestore";

interface FeedbackEntry {
  id: string;
  name: string;
  email: string;
  rating: number;
  category: string;
  message: string;
  status: string;
  createdAt: Timestamp | null;
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as FeedbackEntry)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(); }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, "feedback", id), { status: "read" });
    setItems((prev) => prev.map((f) => f.id === id ? { ...f, status: "read" } : f));
  };

  const deleteFeedback = async (id: string) => {
    await deleteDoc(doc(db, "feedback", id));
    setItems((prev) => prev.filter((f) => f.id !== id));
  };

  const filtered = filter === "all" ? items : items.filter((f) => f.status === filter);
  const unreadCount = items.filter((f) => f.status === "unread").length;

  const formatDate = (ts: Timestamp | null) => {
    if (!ts) return "—";
    return new Date(ts.seconds * 1000).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-olive-600 tracking-tight font-display">FEEDBACK</h1>
          <p className="text-sm text-olive-300 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread submission${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <div className="flex gap-2">
          {["all", "unread", "read"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase transition-all border ${
                filter === f
                  ? "bg-terra-400 text-peach-50 border-terra-400"
                  : "bg-transparent text-olive-400 border-peach-400 hover:border-terra-400 hover:text-terra-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-peach-400/30 border-t-terra-400 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-peach-400 mx-auto mb-4" />
          <p className="text-olive-400 font-medium">No feedback submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-peach-200 border p-6 ${item.status === "unread" ? "border-terra-400/40" : "border-peach-400"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-olive-600 text-sm">{item.name}</span>
                    {item.status === "unread" && (
                      <span className="px-2 py-0.5 bg-terra-400 text-peach-50 text-[10px] font-bold tracking-wider uppercase">NEW</span>
                    )}
                    {item.category && (
                      <span className="px-2 py-0.5 bg-peach-300 text-olive-400 text-[10px] font-bold tracking-wider uppercase border border-peach-400">{item.category}</span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="w-4 h-4"
                        fill={s <= item.rating ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        style={{ color: s <= item.rating ? "var(--color-terra-400, #C0714E)" : "var(--color-olive-300, #7D7D5A)" }}
                      />
                    ))}
                  </div>
                  <p className="text-olive-500 text-sm leading-relaxed">{item.message}</p>
                  {item.email && (
                    <a href={`mailto:${item.email}`} className="text-terra-400 text-xs mt-2 block hover:underline">{item.email}</a>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
                  <span className="text-olive-300 text-xs whitespace-nowrap">{formatDate(item.createdAt)}</span>
                  <div className="flex gap-2">
                    {item.status === "unread" && (
                      <button
                        onClick={() => markRead(item.id)}
                        className="px-3 py-1.5 border border-olive-400/30 text-olive-400 text-xs font-bold tracking-wider hover:border-terra-400 hover:text-terra-400 transition-all"
                      >
                        MARK READ
                      </button>
                    )}
                    <button
                      onClick={() => deleteFeedback(item.id)}
                      className="p-1.5 border border-peach-400 text-olive-300 hover:border-red-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
