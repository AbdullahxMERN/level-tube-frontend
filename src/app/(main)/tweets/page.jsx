"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Heart, Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

export default function TweetsPage() {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newTweetContent, setNewTweetContent] = useState("");
  const likingRef = useRef(new Set()); // tracks tweetIds currently being toggled

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
    if (!user) return alert("Please sign in to tweet");
    if (!newTweetContent.trim() || posting) return;

    setPosting(true);
    try {
      const response = await api.tweets.create(newTweetContent.trim());
      if (response.success && response.data) {
        setTweets((prev) => [response.data, ...prev]);
        setNewTweetContent("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    const prevTweets = tweets;
    setTweets((prev) => prev.filter((t) => t._id !== tweetId));
    try {
      const response = await api.tweets.delete(tweetId);
      if (!response.success) setTweets(prevTweets);
    } catch (err) {
      console.error(err);
      setTweets(prevTweets);
    }
  };

  const handleLikeTweet = async (tweetId) => {
    if (!user) return alert("Please sign in to interact");
    if (likingRef.current.has(tweetId)) return; // block double-fire
    likingRef.current.add(tweetId);

    const prevTweets = tweets;

    setTweets((prev) =>
      prev.map((t) => {
        if (t._id !== tweetId) return t;
        const nextLiked = !t.isLiked;
        const currentCount =
          typeof t.likesCount === "number" && !isNaN(t.likesCount)
            ? t.likesCount
            : 0;
        return {
          ...t,
          isLiked: nextLiked,
          likesCount: Math.max(0, currentCount + (nextLiked ? 1 : -1)),
        };
      }),
    );

    try {
      const response = await api.likes.toggleTweet(tweetId);
      if (!response.success) {
        setTweets(prevTweets); // rollback on logical failure
      }
    } catch (err) {
      console.error(err);
      setTweets(prevTweets); // rollback on request failure
    } finally {
      likingRef.current.delete(tweetId); // release lock
    }
  };

  const charCount = newTweetContent.length;
  const charLimit = 280;
  const isOverLimit = charCount > charLimit;

  return (
    <div className="max-w-2xl mx-auto flex flex-col pb-16 animate-fade-in">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900">
        <MessageSquare size={22} className="text-indigo-400 flex-shrink-0" />
        <h1 className="text-lg sm:text-xl font-bold text-zinc-100">
          Tweets & Updates
        </h1>
      </div>

      {user ? (
        <form
          onSubmit={handleSubmitTweet}
          className="flex gap-3 sm:gap-4 px-4 py-4 border-b border-zinc-900"
        >
          <img
            src={user.avatar}
            alt={user.fullName}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <textarea
              placeholder="What's on your mind? Share an update with your subscribers..."
              value={newTweetContent}
              onChange={(e) => setNewTweetContent(e.target.value)}
              rows={2}
              className="w-full bg-transparent text-lg sm:text-xl text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none leading-snug break-words"
              style={{ overflowWrap: "anywhere" }}
            />
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900/60">
              <span
                className={`text-xs font-medium ${
                  isOverLimit ? "text-red-400" : "text-zinc-600"
                }`}
              >
                {charCount}/{charLimit}
              </span>
              <button
                type="submit"
                disabled={!newTweetContent.trim() || isOverLimit || posting}
                className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {posting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Tweet</span>
                    <Send size={13} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mx-4 my-4 border border-zinc-900 bg-zinc-900/20 p-6 rounded-2xl text-center">
          <p className="text-sm text-zinc-400">
            Please sign in to share updates on your channel.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block bg-zinc-100 hover:bg-white text-zinc-950 px-5 py-2 rounded-full text-xs font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 sm:gap-4 px-4 py-5 border-b border-zinc-900 animate-pulse"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-850 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3.5 w-1/3 bg-zinc-850 rounded" />
                <div className="h-4 w-5/6 bg-zinc-850 rounded mt-1" />
                <div className="h-4 w-2/3 bg-zinc-850 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : tweets.length > 0 ? (
        <div className="flex flex-col">
          {tweets.map((tweet) => {
            const likesCount =
              typeof tweet.likesCount === "number" && !isNaN(tweet.likesCount)
                ? tweet.likesCount
                : 0;
            const canDelete =
              user &&
              (user._id === tweet.owner?._id ||
                user.userName === tweet.owner?.userName);

            return (
              <div
                key={tweet._id}
                className="flex gap-3 sm:gap-4 px-4 py-4 sm:py-5 border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors duration-150 group"
              >
                <Link
                  href={`/channel/${tweet.owner?.userName}`}
                  className="flex-shrink-0"
                >
                  <img
                    src={
                      tweet.owner?.avatar ||
                      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                    }
                    alt={tweet.owner?.fullName}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 min-w-0">
                      <Link
                        href={`/channel/${tweet.owner?.userName}`}
                        className="font-bold text-sm sm:text-base text-zinc-100 hover:underline truncate max-w-[160px] sm:max-w-none"
                      >
                        {tweet.owner?.fullName}
                      </Link>
                      <span className="text-xs sm:text-sm text-zinc-500 truncate">
                        @{tweet.owner?.userName}
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-600 hidden sm:inline">
                        ·
                      </span>
                      <span className="text-xs sm:text-sm text-zinc-600 whitespace-nowrap">
                        {new Date(tweet.createdAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" },
                        )}
                      </span>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteTweet(tweet._id)}
                        aria-label="Delete tweet"
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500/10 transition-all duration-200 flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <p
                    className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-line break-words mt-1"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    {tweet.content}
                  </p>

                  <div className="flex items-center mt-2.5 -ml-2">
                    <button
                      onClick={() => handleLikeTweet(tweet._id)}
                      aria-label={tweet.isLiked ? "Unlike" : "Like"}
                      className={`flex items-center gap-1.5 transition-colors group/like ${
                        tweet.isLiked
                          ? "text-pink-500"
                          : "text-zinc-500 hover:text-pink-500"
                      }`}
                    >
                      <span className="p-2 rounded-full group-hover/like:bg-pink-500/10 transition-colors">
                        <Heart
                          size={17}
                          fill={tweet.isLiked ? "currentColor" : "none"}
                          strokeWidth={tweet.isLiked ? 0 : 2}
                        />
                      </span>
                      <span className="text-sm tabular-nums">{likesCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500 px-4">
          <MessageSquare className="mx-auto mb-3 opacity-20" size={40} />
          <p className="text-sm">
            No tweets to display. Start the conversation!
          </p>
        </div>
      )}
    </div>
  );
}
