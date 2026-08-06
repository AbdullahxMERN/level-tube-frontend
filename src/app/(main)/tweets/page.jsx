"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  Heart,
  Send,
  Trash2,
  Loader2,
  Feather,
  Sparkles,
  LogIn,
  X,
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
    <div className="flex gap-3 p-5 border-b border-zinc-900/60 animate-pulse">
      <div className="w-11 h-11 rounded-full bg-zinc-800 flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2.5 pt-1">
        <div className="flex gap-2 items-center">
          <div className="h-3.5 w-28 bg-zinc-800 rounded-full" />
          <div className="h-3 w-16 bg-zinc-800/60 rounded-full" />
        </div>
        <div className="h-4 w-5/6 bg-zinc-800 rounded-full" />
        <div className="h-4 w-3/4 bg-zinc-800/70 rounded-full" />
        <div className="h-3 w-1/4 bg-zinc-800/40 rounded-full mt-1" />
      </div>
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
    setSignInPrompt(`Sign in to ${action}`);
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
    <div className="max-w-2xl mx-auto flex flex-col min-h-screen pb-20">

      {/* ── Sign-in toast ───────────────────────────────────────── */}
      {signInPrompt && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 bg-zinc-900 border border-indigo-500/30 px-4 py-3 rounded-2xl shadow-2xl shadow-black/50 animate-fade-in max-w-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <LogIn size={15} />
          </div>
          <p className="text-xs text-zinc-200 font-medium flex-1">{signInPrompt}</p>
          <Link href="/login" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 whitespace-nowrap">
            Sign in
          </Link>
          <button onClick={() => setSignInPrompt(null)} className="text-zinc-600 hover:text-zinc-400">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 bg-zinc-950/85 backdrop-blur-2xl border-b border-zinc-900/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
          <Feather size={17} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-zinc-100 leading-tight">Community Feed</h1>
          <p className="text-[11px] text-zinc-500">Updates from creators you follow</p>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-full">
            {tweets.length} posts
          </span>
        </div>
      </div>

      {/* ── Compose box ─────────────────────────────────────────── */}
      {user ? (
        <div className="border-b border-zinc-900/60 px-5 py-5">
          <form onSubmit={handleSubmitTweet} className="flex gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                alt={user.fullName}
                className="w-11 h-11 rounded-full object-cover border-2 border-zinc-800"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950" />
            </div>

            {/* Input area */}
            <div className="flex-1 flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                placeholder="What's on your mind? Share with your community..."
                value={newTweetContent}
                onChange={(e) => {
                  setNewTweetContent(e.target.value);
                  autoResize();
                }}
                rows={2}
                className="w-full bg-transparent text-base text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed min-h-[52px]"
                style={{ overflowWrap: "anywhere" }}
              />

              {/* Divider + Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-900/70">
                {/* char counter — no limit, just informational */}
                <span className="text-[11px] font-mono text-zinc-600 tabular-nums">
                  {newTweetContent.length > 0 ? `${newTweetContent.length} chars` : ""}
                </span>

                <button
                  type="submit"
                  disabled={!newTweetContent.trim() || posting}
                  className="relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-indigo-600/25 overflow-hidden group"
                >
                  {/* shimmer */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  {posting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Post</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ── Guest CTA ── */
        <div className="mx-5 my-5 relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-indigo-950/20 p-6">
          {/* decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-zinc-100 text-sm mb-1">Join the conversation</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sign in to post updates, interact with creators, and engage with the community.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 mt-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-full transition-all duration-200 shadow-md shadow-indigo-600/20"
              >
                <LogIn size={13} />
                Sign In to Post
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Tweet feed ──────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col">
          {[...Array(5)].map((_, i) => <TweetSkeleton key={i} />)}
        </div>
      ) : tweets.length > 0 ? (
        <div className="flex flex-col">
          {tweets.map((tweet, index) => {
            const likesCount = typeof tweet.likesCount === "number" && !isNaN(tweet.likesCount) ? tweet.likesCount : 0;
            const canDelete =
              user && (user._id === tweet.owner?._id || user.userName === tweet.owner?.userName);
            const isLikingThis = likingIds.has(tweet._id);
            const isDeletingThis = deletingId === tweet._id;

            return (
              <article
                key={tweet._id}
                className={`group relative flex gap-3.5 px-5 py-5 border-b border-zinc-900/60 transition-all duration-200 hover:bg-white/[0.015] ${isDeletingThis ? "opacity-40 pointer-events-none" : ""}`}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Left: Avatar column with thread line */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <Link href={`/channel/${tweet.owner?.userName}`} className="block">
                    <img
                      src={tweet.owner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={tweet.owner?.fullName}
                      className="w-11 h-11 rounded-full object-cover border border-zinc-800 hover:border-indigo-500/50 transition-colors duration-200"
                    />
                  </Link>
                </div>

                {/* Right: Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 min-w-0">
                      <Link
                        href={`/channel/${tweet.owner?.userName}`}
                        className="font-bold text-sm text-zinc-100 hover:text-indigo-300 transition-colors duration-150 truncate max-w-[130px] sm:max-w-none"
                      >
                        {tweet.owner?.fullName}
                      </Link>
                      <span className="text-[13px] text-zinc-500 truncate">
                        @{tweet.owner?.userName}
                      </span>
                      <span className="text-zinc-700 text-[11px]">·</span>
                      <span className="text-[12px] text-zinc-600 whitespace-nowrap hover:text-zinc-400 transition-colors" title={new Date(tweet.createdAt).toLocaleString()}>
                        {relativeTime(tweet.createdAt)}
                      </span>
                    </div>

                    {/* Delete button (owner only) */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTweet(tweet._id)}
                        aria-label="Delete tweet"
                        className="ml-1 flex-shrink-0 p-1.5 rounded-full text-zinc-700 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                      >
                        {isDeletingThis ? (
                          <Loader2 size={14} className="animate-spin text-red-400" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Tweet body */}
                  <p
                    className="text-[15px] text-zinc-200 leading-relaxed whitespace-pre-line break-words"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {tweet.content}
                  </p>

                  {/* Actions bar */}
                  <div className="flex items-center gap-4 mt-2 -ml-1.5">
                    {/* Like */}
                    <button
                      onClick={() => handleLikeTweet(tweet._id)}
                      aria-label={tweet.isLiked ? "Unlike" : "Like"}
                      className={`flex items-center gap-1.5 group/like transition-colors duration-150 ${
                        tweet.isLiked ? "text-pink-500" : "text-zinc-500 hover:text-pink-500"
                      }`}
                    >
                      <span className="p-1.5 rounded-full group-hover/like:bg-pink-500/10 transition-colors duration-150">
                        {isLikingThis ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <Heart
                            size={15}
                            fill={tweet.isLiked ? "currentColor" : "none"}
                            strokeWidth={tweet.isLiked ? 0 : 2}
                            className={tweet.isLiked ? "scale-110" : ""}
                          />
                        )}
                      </span>
                      <span className="text-[13px] tabular-nums font-medium">{likesCount > 0 ? likesCount : ""}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Feather size={28} className="text-zinc-600" />
          </div>
          <h3 className="font-bold text-zinc-300 text-base mb-1">Nothing posted yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
            {user
              ? "Be the first to share something with the community!"
              : "Sign in and be the first to post an update."}
          </p>
          {!user && (
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow-md shadow-indigo-600/20"
            >
              <LogIn size={13} />
              Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
