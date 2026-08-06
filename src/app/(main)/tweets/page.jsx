"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import {
  ThumbsUp,
  Send,
  Trash2,
  Loader2,
  LogIn,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

// ─── Relative time helper ────────────────────────────────────────────────────
function relativeTime(dateStr) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d >= 365) return `${Math.floor(d / 365)}y`;
    if (d >= 30) return `${Math.floor(d / 30)}mo`;
    if (d >= 1) return `${d}d`;
    if (h >= 1) return `${h}h`;
    if (m >= 1) return `${m}m`;
    return "now";
  } catch {
    return "";
  }
}

// ─── Skeleton card ──────────────────────────────────────────────────────────
function TweetSkeleton() {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl sm:rounded-3xl p-4 sm:p-7 flex flex-col gap-3 sm:gap-4 animate-pulse shadow-lg">
      <div className="flex gap-3 sm:gap-4 items-center">
        <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-zinc-800 flex-shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
          <div className="h-3.5 sm:h-4 w-28 sm:w-36 bg-zinc-800 rounded-full" />
          <div className="h-3 w-20 sm:w-24 bg-zinc-800/60 rounded-full" />
        </div>
      </div>
      <div className="h-4 sm:h-5 w-5/6 bg-zinc-800 rounded-full mt-1" />
      <div className="h-4 sm:h-5 w-3/4 bg-zinc-800/70 rounded-full" />
      <div className="h-3 sm:h-4 w-1/4 bg-zinc-800/40 rounded-full mt-2 pt-2 border-t border-zinc-800/50" />
    </div>
  );
}

export default function TweetsPage() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newTweetContent, setNewTweetContent] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [signInPrompt, setSignInPrompt] = useState(null);
  const likingRef = useRef(new Set());
  const [likingIds, setLikingIds] = useState(new Set());
  const textareaRef = useRef(null);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const promptSignIn = (action) => {
    setSignInPrompt(`Please sign in to ${action}.`);
    setTimeout(() => setSignInPrompt(null), 4000);
  };

  const loadTweets = async () => {
    setLoading(true);
    try {
      const response = await api.tweets.getAll();
      if (response.success && response.data) {
        setTweets(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTweets();
  }, [user]);

  const handleSubmitTweet = async (e) => {
    e.preventDefault();
    if (!user) return promptSignIn("post a tweet");
    if (!newTweetContent.trim() || posting) return;

    setPosting(true);
    try {
      const response = await api.tweets.create(newTweetContent.trim());
      if (response.success && response.data) {
        setTweets((prev) => [response.data, ...prev]);
        setNewTweetContent("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    setDeletingId(tweetId);
    const prev = tweets;
    setTweets((p) => p.filter((t) => t._id !== tweetId));
    try {
      const res = await api.tweets.delete(tweetId);
      if (!res.success) setTweets(prev);
    } catch {
      setTweets(prev);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLikeTweet = async (tweetId) => {
    if (!user) return promptSignIn("like tweets");
    if (likingRef.current.has(tweetId)) return;
    likingRef.current.add(tweetId);
    setLikingIds((prev) => new Set([...prev, tweetId]));

    const snapshot = tweets;
    setTweets((prev) =>
      prev.map((t) => {
        if (t._id !== tweetId) return t;
        const nextLiked = !t.isLiked;
        const count = typeof t.likesCount === "number" && !isNaN(t.likesCount) ? t.likesCount : 0;
        return { ...t, isLiked: nextLiked, likesCount: Math.max(0, count + (nextLiked ? 1 : -1)) };
      })
    );

    try {
      const res = await api.likes.toggleTweet(tweetId);
      if (!res.success) setTweets(snapshot);
    } catch {
      setTweets(snapshot);
    } finally {
      likingRef.current.delete(tweetId);
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(tweetId);
        return next;
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-screen pb-24 px-3 sm:px-6 pt-2 sm:pt-4">

      {/* ── Sign-in toast ───────────────────────────────────────── */}
      {signInPrompt && (
        <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-50 bg-zinc-900 border border-indigo-500/40 p-3.5 sm:p-4 rounded-2xl shadow-2xl flex items-center gap-3 sm:gap-4 animate-fade-in max-w-[90vw] sm:max-w-sm">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-200 font-semibold">{signInPrompt}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Join LevelTube to interact with creators.</p>
          </div>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex-shrink-0"
          >
            Sign In
          </Link>
          <button onClick={() => setSignInPrompt(null)} className="text-zinc-500 hover:text-zinc-300">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Compose Box ────────────────────────────────────────── */}
      {user ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl mb-5 sm:mb-8 backdrop-blur-md">
          <form onSubmit={handleSubmitTweet} className="flex gap-3 sm:gap-4">
            {/* User Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                alt={user.fullName}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-indigo-500/30 shadow-md"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-zinc-950" />
            </div>

            {/* Input area */}
            <div className="flex-1 flex flex-col gap-3 sm:gap-4">
              <textarea
                ref={textareaRef}
                placeholder="What's happening? Share a post..."
                value={newTweetContent}
                onChange={(e) => {
                  setNewTweetContent(e.target.value);
                  autoResize();
                }}
                rows={2}
                className="w-full bg-transparent text-sm sm:text-lg text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed min-h-[52px] sm:min-h-[64px]"
                style={{ overflowWrap: "anywhere" }}
              />

              {/* Action row */}
              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-zinc-800/80">
                <span className="text-[11px] sm:text-xs font-mono text-zinc-500 tabular-nums">
                  {newTweetContent.length > 0 ? `${newTweetContent.length} chars` : ""}
                </span>

                <button
                  type="submit"
                  disabled={!newTweetContent.trim() || posting}
                  className="relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all duration-200 shadow-xl shadow-indigo-600/30 border border-indigo-400/30 overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  {posting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={13} className="sm:w-[15px] sm:h-[15px]" />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ── Guest CTA Banner ── */
        <div className="mb-5 sm:mb-8 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-indigo-950/30 p-4 sm:p-7 shadow-2xl backdrop-blur-md">
          <div className="absolute top-0 right-0 w-36 h-36 sm:w-48 sm:h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
              <Sparkles size={18} className="sm:w-[22px] sm:h-[22px]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-zinc-100 text-sm sm:text-lg mb-0.5 sm:mb-1">Join the conversation</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Sign in to post updates, interact with creators, and engage with the LevelTube community.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-3 sm:mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-indigo-600/25 border border-indigo-400/30"
              >
                <LogIn size={14} className="sm:w-[15px] sm:h-[15px]" />
                Sign In to Post
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Tweets List (Prominent Card UI) ────────────────────── */}
      {loading ? (
        <div className="flex flex-col gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => <TweetSkeleton key={i} />)}
        </div>
      ) : tweets.length > 0 ? (
        <div className="flex flex-col gap-4 sm:gap-6">
          {tweets.map((tweet) => {
            const likesCount = typeof tweet.likesCount === "number" && !isNaN(tweet.likesCount) ? tweet.likesCount : 0;
            const canDelete =
              user && (user._id === tweet.owner?._id || user.userName === tweet.owner?.userName);
            const isLikingThis = likingIds.has(tweet._id);
            const isDeletingThis = deletingId === tweet._id;

            return (
              <article
                key={tweet._id}
                className={`group relative bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-7 transition-all duration-300 shadow-xl backdrop-blur-md flex flex-col gap-3 sm:gap-4 ${
                  isDeletingThis ? "opacity-40 pointer-events-none" : ""
                }`}
              >
                {/* Header: Author Avatar + Name + Handle + Date + Delete */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <Link href={`/channel/${tweet.owner?.userName}`} className="flex-shrink-0">
                      <img
                        src={tweet.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                        alt={tweet.owner?.fullName}
                        className="w-10 h-10 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-zinc-800 hover:border-indigo-500/50 transition-colors shadow-md"
                      />
                    </Link>

                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/channel/${tweet.owner?.userName}`}
                        className="font-extrabold text-sm sm:text-lg text-zinc-100 hover:text-indigo-400 transition-colors truncate"
                      >
                        {tweet.owner?.fullName}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-zinc-400">
                        <span className="truncate">@{tweet.owner?.userName}</span>
                        <span className="text-zinc-600 font-bold">·</span>
                        <span title={new Date(tweet.createdAt).toLocaleString()} className="whitespace-nowrap text-zinc-500 hover:text-zinc-300 transition-colors">
                          {relativeTime(tweet.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteTweet(tweet._id)}
                      aria-label="Delete tweet"
                      className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 flex-shrink-0"
                    >
                      {isDeletingThis ? (
                        <Loader2 size={15} className="animate-spin text-rose-400" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  )}
                </div>

                {/* Tweet Body Text */}
                <p
                  className="text-sm sm:text-lg text-zinc-100 leading-relaxed whitespace-pre-line break-words font-normal"
                  style={{ overflowWrap: "anywhere" }}
                >
                  {tweet.content}
                </p>

                {/* Bottom Bar: Like Button */}
                <div className="pt-3 sm:pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleLikeTweet(tweet._id)}
                    aria-label={tweet.isLiked ? "Unlike" : "Like"}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all duration-200 ${
                      tweet.isLiked
                        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-md shadow-indigo-500/10"
                        : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:border-indigo-500/30 hover:text-indigo-400 hover:bg-zinc-900"
                    }`}
                  >
                    {isLikingThis ? (
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ThumbsUp
                        size={14}
                        fill={tweet.isLiked ? "currentColor" : "none"}
                        className="sm:w-[15px] sm:h-[15px] transition-transform active:scale-125 duration-200"
                      />
                    )}
                    <span className="tabular-nums font-bold">{likesCount}</span>
                  </button>

                  <span className="text-[10px] sm:text-[11px] text-zinc-600 font-mono uppercase tracking-wider">LevelTube Feed</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-20 sm:py-28 px-4 sm:px-6 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl sm:rounded-3xl">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
            <Logo size="compact" />
          </div>
          <h3 className="font-extrabold text-zinc-200 text-base sm:text-lg mb-1">No posts found</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs leading-relaxed">
            {user
              ? "Share your first post with the LevelTube creator community!"
              : "Sign in to post updates and engage with creators."}
          </p>
          {!user && (
            <Link
              href="/login"
              className="mt-5 sm:mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all shadow-lg shadow-indigo-600/25 border border-indigo-400/30"
            >
              <LogIn size={14} />
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
