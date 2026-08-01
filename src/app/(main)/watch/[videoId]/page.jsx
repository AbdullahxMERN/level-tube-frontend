"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import {
  ThumbsUp,
  Send,
  Trash2,
  Calendar,
  Eye,
  Download,
  Reply,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LogIn,
} from "lucide-react";
import VideoCard from "@/components/VideoCard";

export default function WatchPage() {
  const { videoId } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const [descExpanded, setDescExpanded] = useState(false);

  // Download state
  const [downloading, setDownloading] = useState(false);

  // Reply state — tracks which comment is being replied to, and the draft text
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef(null);

  // Delete state — track which comment id is currently being deleted
  const [deletingId, setDeletingId] = useState(null);

  // Edit state — track which comment is being edited
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Sign in prompt banner state for guest user actions
  const [signInPrompt, setSignInPrompt] = useState(null);

  // Like guard — prevents double-fire
  const likingCommentRef = useRef(new Set());
  const likingVideoRef = useRef(false);

  // Replies state — stores fetched replies per comment, and expanded toggle
  const [repliesByComment, setRepliesByComment] = useState({});
  const [expandedThreads, setExpandedThreads] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});

  // Format video duration (seconds to hh:mm:ss or mm:ss)
  const formatDuration = (secs) => {
    const s = parseInt(secs || 0, 10);
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s - hours * 3600) / 60);
    const seconds = s - hours * 3600 - minutes * 60;

    const pad = (n) => String(n).padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
  };

  // Format views count
  const formatViews = (views) => {
    const count = parseInt(views || 0, 10);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}M views`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K views`;
    }
    return `${count} views`;
  };

  // Format relative timestamp
  const formatRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 30) return `${diffDays} days ago`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths === 1) return "1 month ago";
        return `${diffMonths} months ago`;
      }
      if (diffHours > 0) return `${diffHours} hours ago`;
      if (diffMins > 0) return `${diffMins} minutes ago`;
      return "Just now";
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const videoRes = await api.videos.getById(videoId);
        if (videoRes.success && videoRes.data) {
          const videoData = videoRes.data;
          setVideo(videoData);
          setIsLiked(videoData.isLiked || false);

          if (videoData.owner?.userName) {
            try {
              const channelRes = await api.auth.getChannelDetails(
                videoData.owner.userName,
              );
              if (channelRes.success && channelRes.data) {
                setSubscribersCount(channelRes.data.subscribersCount || 0);
                setIsSubscribed(channelRes.data.isSubscribed || false);
              }
            } catch (channelErr) {
              console.error(
                "Failed to load channel subscription status:",
                channelErr,
              );
            }
          }
        }

        // Guests can fetch comments with likesCount, isLiked (false for guest), replyCount from DB
        const commentsRes = await api.comments.getByVideo(videoId);
        if (commentsRes.success && commentsRes.data) {
          setComments(commentsRes.data);
        }

        const allVideosRes = await api.videos.getAll();
        if (allVideosRes.success && allVideosRes.data) {
          setRecommendations(
            allVideosRes.data.filter((v) => v._id !== videoId),
          );
        }
      } catch (err) {
        console.error("Failed to load watch page data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [videoId, user?._id]);

  const promptGuestSignIn = (actionName) => {
    setSignInPrompt(`Please sign in to ${actionName}.`);
  };

  const handleLikeToggle = async () => {
    if (!user) return promptGuestSignIn("like this video");
    if (likingVideoRef.current) return;
    likingVideoRef.current = true;

    const prevLiked = isLiked;
    setIsLiked(!isLiked);

    try {
      const response = await api.likes.toggleVideo(videoId);
      if (!response.success) {
        setIsLiked(prevLiked);
      }
    } catch (err) {
      console.error(err);
      setIsLiked(prevLiked);
    } finally {
      likingVideoRef.current = false;
    }
  };

  const handleSubscribeToggle = async () => {
    if (!user) return promptGuestSignIn("subscribe to channels");
    if (!video?.owner?._id) return;

    const nextSubscribed = !isSubscribed;
    setIsSubscribed(nextSubscribed);
    setSubscribersCount((prev) => prev + (nextSubscribed ? 1 : -1));

    try {
      await api.subscriptions.toggle(video.owner._id);
    } catch (err) {
      console.error(err);
      setIsSubscribed(!nextSubscribed);
      setSubscribersCount((prev) => prev + (nextSubscribed ? -1 : 1));
    }
  };

  const handleDownloadVideo = async () => {
    if (!video?.videoFile) return;
    setDownloading(true);
    try {
      const response = await fetch(video.videoFile);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${video.title || "video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("CORS block or fetch error, opening in new tab:", err);
      window.open(video.videoFile, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // ─── Comment CRUD ─────────────────────────────────────────────

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) return promptGuestSignIn("post a comment");
    if (!newComment.trim()) return;

    try {
      const response = await api.comments.add(videoId, newComment);
      if (response.success && response.data) {
        setComments((prev) => [response.data, ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentDelete = async (commentId, isReply = false, parentId = null) => {
    setDeletingId(commentId);
    try {
      const response = await api.comments.delete(commentId);
      if (response.success) {
        if (isReply && parentId) {
          setRepliesByComment((prev) => ({
            ...prev,
            [parentId]: (prev[parentId] || []).filter((r) => r._id !== commentId),
          }));
          setComments((prev) =>
            prev.map((c) =>
              c._id === parentId
                ? { ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }
                : c,
            ),
          );
        } else {
          setComments((prev) => prev.filter((c) => c._id !== commentId));
          setRepliesByComment((prev) => {
            const next = { ...prev };
            delete next[commentId];
            return next;
          });
        }
      } else {
        alert(response.message || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Delete comment error:", err);
      alert(err.message || "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────

  const handleEditClick = (comment) => {
    if (editingId === comment._id) {
      setEditingId(null);
      setEditText("");
      return;
    }
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const handleEditSave = async (commentId, isReply = false, parentId = null) => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      const response = await api.comments.update(commentId, editText.trim());
      if (response.success && response.data) {
        if (isReply && parentId) {
          setRepliesByComment((prev) => ({
            ...prev,
            [parentId]: (prev[parentId] || []).map((r) =>
              r._id === commentId ? { ...r, content: editText.trim() } : r,
            ),
          }));
        } else {
          setComments((prev) =>
            prev.map((c) =>
              c._id === commentId ? { ...c, content: editText.trim() } : c,
            ),
          );
        }
        setEditingId(null);
        setEditText("");
      } else {
        alert(response.message || "Failed to update comment");
      }
    } catch (err) {
      console.error("Edit comment error:", err);
      alert(err.message || "Failed to update comment");
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Reply System ─────────────────────────────────────────────

  const handleReplyClick = (comment) => {
    if (!user) return promptGuestSignIn("reply to comments");

    if (replyingTo === comment._id) {
      setReplyingTo(null);
      setReplyText("");
      return;
    }

    setReplyingTo(comment._id);
    setReplyText("");
    setTimeout(() => replyInputRef.current?.focus(), 0);
  };

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!user) return promptGuestSignIn("reply to comments");
    if (!replyText.trim()) return;

    try {
      const response = await api.comments.addReply(parentCommentId, replyText.trim());
      if (response.success && response.data) {
        setRepliesByComment((prev) => ({
          ...prev,
          [parentCommentId]: [...(prev[parentCommentId] || []), response.data],
        }));

        setComments((prev) =>
          prev.map((c) =>
            c._id === parentCommentId
              ? { ...c, replyCount: (c.replyCount || 0) + 1 }
              : c,
          ),
        );

        setExpandedThreads((prev) => ({ ...prev, [parentCommentId]: true }));
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Guests can fetch and view replies on-demand
  const fetchReplies = async (commentId) => {
    if (loadingReplies[commentId]) return;
    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));

    try {
      const response = await api.comments.getReplies(commentId);
      if (response.success && response.data) {
        setRepliesByComment((prev) => ({
          ...prev,
          [commentId]: response.data,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch replies:", err);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleThreadReplies = async (commentId) => {
    const isCurrentlyExpanded = expandedThreads[commentId];

    if (!isCurrentlyExpanded) {
      await fetchReplies(commentId);
    }

    setExpandedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // ─── Like Toggle ──────────────────────────────────────────────

  const handleCommentLikeToggle = async (commentId, isReply = false, parentId = null) => {
    if (!user) return promptGuestSignIn("like comments");
    if (likingCommentRef.current.has(commentId)) return;
    likingCommentRef.current.add(commentId);

    const targetList = isReply && parentId ? (repliesByComment[parentId] || []) : comments;
    const targetComment = targetList.find((c) => c._id === commentId);
    const targetLiked = targetComment ? !targetComment.isLiked : true;

    const applyLike = (items, nextLiked, nextCount) =>
      items.map((c) =>
        c._id === commentId
          ? {
              ...c,
              isLiked: nextLiked,
              likesCount: nextCount !== undefined ? nextCount : Math.max(0, (c.likesCount || 0) + (nextLiked ? 1 : -1)),
            }
          : c,
      );

    // Immediate UI update
    if (isReply && parentId) {
      setRepliesByComment((prev) => ({
        ...prev,
        [parentId]: applyLike(prev[parentId] || [], targetLiked),
      }));
    } else {
      setComments((prev) => applyLike(prev, targetLiked));
    }

    try {
      const response = await api.likes.toggleComment(commentId);
      if (response.success && response.data) {
        const { isLiked: dbLiked, likesCount: dbCount } = response.data;
        if (isReply && parentId) {
          setRepliesByComment((prev) => ({
            ...prev,
            [parentId]: applyLike(prev[parentId] || [], dbLiked, dbCount),
          }));
        } else {
          setComments((prev) => applyLike(prev, dbLiked, dbCount));
        }
      }
    } catch (err) {
      console.error("Failed to toggle comment like:", err);
    } finally {
      likingCommentRef.current.delete(commentId);
    }
  };

  const isOwnComment = (comment) => {
    if (!user) return false;
    const ownerId = comment.owner?._id;
    const ownerUserName = comment.owner?.userName;
    return (
      (ownerId && String(ownerId) === String(user._id)) ||
      (ownerUserName && ownerUserName === user.userName)
    );
  };

  // ─── Render a single comment/reply row ────────────────────────

  const renderCommentRow = (comment, isReply = false, parentId = null) => {
    return (
      <div key={comment._id} className="flex gap-4 items-start group">
        <Link href={`/channel/${comment.owner?.userName}`}>
          <img
            src={
              comment.owner?.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
            }
            alt={comment.owner?.fullName}
            className={`rounded-full object-cover border border-zinc-800 ${
              isReply ? "w-7 h-7" : "w-9 h-9"
            }`}
          />
        </Link>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/channel/${comment.owner?.userName}`}
                className={`font-bold text-zinc-200 hover:text-indigo-400 ${
                  isReply ? "text-xs" : "text-sm"
                }`}
              >
                {comment.owner?.fullName}
              </Link>
              <span className="text-[10px] text-zinc-500">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {/* Owner action buttons */}
            {isOwnComment(comment) && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleEditClick(comment)}
                  className="text-zinc-400 hover:text-indigo-400 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 transition-all duration-200"
                  title="Edit Comment"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() =>
                    handleCommentDelete(comment._id, isReply, parentId)
                  }
                  disabled={deletingId === comment._id}
                  className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-500/30 transition-all duration-200 disabled:opacity-40"
                  title="Delete Comment"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>

          {editingId === comment._id ? (
            <div className="flex flex-col gap-2 mt-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 px-3 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleEditSave(comment._id, isReply, parentId)
                  }
                  disabled={savingEdit || !editText.trim()}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditText("");
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              className={`text-zinc-300 leading-relaxed font-light ${
                isReply ? "text-xs" : "text-sm"
              }`}
            >
              {comment.content}
            </p>
          )}

          {/* Action Row: Like + Reply */}
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={() =>
                handleCommentLikeToggle(comment._id, isReply, parentId)
              }
              aria-label={comment.isLiked ? "Unlike comment" : "Like comment"}
              className={`flex items-center gap-1.5 text-xs transition-colors py-1 px-2 rounded-full hover:bg-zinc-900/50 ${
                comment.isLiked
                  ? "text-indigo-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ThumbsUp
                size={12}
                fill={comment.isLiked ? "currentColor" : "none"}
                className="transition-transform active:scale-125 duration-200"
              />
              <span>{comment.likesCount || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => handleReplyClick(comment)}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-indigo-400 transition-colors py-1 px-2 rounded-full hover:bg-zinc-900/50"
              >
                <Reply size={12} />
                <span>
                  {replyingTo === comment._id ? "Cancel" : "Reply"}
                </span>
              </button>
            )}
          </div>

          {/* Inline Reply Input Form — only for root comments */}
          {!isReply && replyingTo === comment._id && (
            <form
              onSubmit={(e) => handleReplySubmit(e, comment._id)}
              className="flex gap-2 mt-3 animate-fade-in"
            >
              <img
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                }
                alt={user?.fullName || "You"}
                className="w-7 h-7 rounded-full object-cover border border-zinc-800 flex-shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.owner?.fullName || "user"}...`}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-1.5 px-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl disabled:opacity-40 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                >
                  <Send size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  className="text-zinc-500 hover:text-zinc-300 p-2 rounded-xl hover:bg-zinc-900 transition-all duration-200 flex items-center justify-center flex-shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // ─── Loading State ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16 animate-pulse">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="aspect-video w-full rounded-3xl bg-zinc-900"></div>
          <div className="h-6 w-3/4 bg-zinc-900 rounded"></div>
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900"></div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-1/4 bg-zinc-900 rounded"></div>
              <div className="h-3 w-1/6 bg-zinc-900 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-5 w-1/3 bg-zinc-900 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex gap-3 bg-zinc-900/30 p-2.5 rounded-2xl border border-zinc-900"
            >
              <div className="w-32 aspect-video bg-zinc-900 rounded-xl"></div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 w-5/6 bg-zinc-900 rounded"></div>
                <div className="h-2 w-1/2 bg-zinc-900 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-zinc-300">Video not found</h3>
        <Link
          href="/"
          className="mt-4 inline-block text-indigo-400 hover:text-indigo-300"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16 relative">
      {/* Sign-in prompt banner for guest user actions */}
      {signInPrompt && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-indigo-500/40 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <LogIn size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-200 font-semibold">{signInPrompt}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Join LevelTube to interact with creators.</p>
          </div>
          <Link
            href="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex-shrink-0"
          >
            Sign In
          </Link>
          <button
            onClick={() => setSignInPrompt(null)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Video Content */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Player */}
        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-zinc-900 shadow-2xl">
          <video
            src={video.videoFile}
            controls
            autoPlay
            poster={video.thumbnail}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Title & Info */}
        <div className="flex flex-col gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100 leading-snug">
            {video.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            {/* Owner/Channel Info */}
            <div className="flex items-center gap-4">
              <Link href={`/channel/${video.owner?.userName}`}>
                <img
                  src={
                    video.owner?.avatar ||
                    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                  }
                  alt={video.owner?.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-zinc-800"
                />
              </Link>

              <div className="flex flex-col">
                <Link
                  href={`/channel/${video.owner?.userName}`}
                  className="font-bold text-zinc-200 hover:text-indigo-400 transition-colors"
                >
                  {video.owner?.fullName}
                </Link>
                <span className="text-xs text-zinc-500">
                  {subscribersCount} subscribers
                </span>
              </div>

              {user?.userName !== video.owner?.userName && (
                <button
                  onClick={handleSubscribeToggle}
                  className={`ml-4 font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 ${
                    isSubscribed
                      ? "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200"
                      : "bg-indigo-600 text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500"
                  }`}
                >
                  {isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 relative">
              <button
                onClick={handleLikeToggle}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border transition-all duration-300 ${
                  isLiked
                    ? "bg-pink-500/10 text-pink-500 border-pink-500/20"
                    : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100"
                }`}
              >
                <ThumbsUp size={16} fill={isLiked ? "currentColor" : "none"} />
                <span>{isLiked ? "Liked" : "Like"}</span>
              </button>

              <button
                onClick={handleDownloadVideo}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 transition-all duration-300"
              >
                <Download
                  size={16}
                  className={
                    downloading
                      ? "animate-bounce text-indigo-400"
                      : "text-zinc-400"
                  }
                />
                <span>{downloading ? "Downloading..." : "Download"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Description Container */}
        <div className="glass-panel border border-zinc-900 rounded-3xl p-5 bg-zinc-900/10 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1 rounded-full">
              <Eye size={12} />
              {video.views?.toLocaleString()} views
            </span>
            <span className="flex items-center gap-1.5 bg-zinc-900/60 px-3 py-1 rounded-full">
              <Calendar size={12} />
              {new Date(video.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <p
            className={`text-sm text-zinc-300 leading-relaxed whitespace-pre-line ${
              !descExpanded && "line-clamp-3"
            }`}
          >
            {video.description}
          </p>

          <button
            onClick={() => setDescExpanded(!descExpanded)}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 self-start mt-1 transition-colors"
          >
            {descExpanded ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Comments Section */}
        <div className="flex flex-col gap-6">
          <h3 className="font-bold text-lg text-zinc-200">
            {comments.length} Comments
          </h3>

          {/* Comment Box (Logged-in user vs Guest user) */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-4">
              <img
                src={
                  user?.avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                }
                alt={user?.fullName || "User"}
                className="w-10 h-10 rounded-full object-cover border border-zinc-800"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a public comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-2 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-2xl disabled:opacity-40 transition-all duration-200 shadow-md shadow-indigo-600/10 flex items-center justify-center flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-sm">
              <div className="flex items-center gap-3 text-zinc-400">
                <MessageSquare size={18} className="text-indigo-400" />
                <span className="text-xs md:text-sm">Sign in to leave a comment, like, or reply</span>
              </div>
              <Link
                href="/login"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex-shrink-0"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Comments List — Guest users can view all comments & replies */}
          <div className="flex flex-col gap-6">
            {comments.map((rootComment) => {
              const threadReplies = repliesByComment[rootComment._id] || [];
              const isExpanded = expandedThreads[rootComment._id];
              const replyCount = rootComment.replyCount || 0;
              const isLoadingThread = loadingReplies[rootComment._id];

              return (
                <div
                  key={rootComment._id}
                  className="flex flex-col gap-2 border-b border-zinc-900/30 pb-4"
                >
                  {/* Root Comment */}
                  {renderCommentRow(rootComment, false, null)}

                  {/* Reply Toggle — YouTube / TikTok style */}
                  {replyCount > 0 && (
                    <div className="pl-14">
                      <button
                        onClick={() => toggleThreadReplies(rootComment._id)}
                        disabled={isLoadingThread}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 mt-1 disabled:opacity-50"
                      >
                        {isLoadingThread ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                            Loading...
                          </span>
                        ) : isExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            <span>Hide {replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            <span>View {replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Nested Replies — Guest users can view all nested replies */}
                  {isExpanded && threadReplies.length > 0 && (
                    <div className="pl-12 border-l border-zinc-800/50 ml-5 mt-2 flex flex-col gap-4">
                      {threadReplies.map((reply) =>
                        renderCommentRow(reply, true, rootComment._id),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recommended Videos Sidebar */}
      <div className="flex flex-col gap-5">
        <h3 className="font-bold text-base text-zinc-200">
          Recommended Videos
        </h3>

        <div className="flex flex-col gap-4">
          {recommendations.length > 0 ? (
            recommendations.slice(0, 15).map((recVideo) => (
              <div
                key={recVideo._id}
                className="flex gap-3 bg-zinc-900/20 border border-zinc-905 hover:border-zinc-800 p-2 rounded-2xl group transition-all duration-300"
              >
                <Link
                  href={`/watch/${recVideo._id}`}
                  className="relative w-36 aspect-video rounded-xl overflow-hidden bg-zinc-800 block flex-shrink-0"
                >
                  <img
                    src={
                      recVideo.thumbnail ||
                      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600"
                    }
                    alt={recVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Duration Badge */}
                  <span className="absolute bottom-1.5 right-1.5 bg-zinc-950/80 backdrop-blur-md text-[10px] font-semibold px-1.5 py-0.5 rounded text-zinc-200">
                    {formatDuration(
                      recVideo.durtion !== undefined
                        ? recVideo.durtion
                        : recVideo.duration,
                    )}
                  </span>
                </Link>

                <div className="flex flex-col justify-between min-w-0 py-0.5 flex-1">
                  <Link
                    href={`/watch/${recVideo._id}`}
                    className="font-semibold text-xs line-clamp-2 text-zinc-100 group-hover:text-indigo-400 transition-colors duration-200 leading-snug"
                  >
                    {recVideo.title}
                  </Link>
                  <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-zinc-400">
                    <Link
                      href={`/channel/${recVideo.owner?.userName || "unknown"}`}
                      className="hover:text-zinc-200 transition-colors duration-200 truncate font-medium"
                    >
                      {recVideo.owner?.fullName || "Creator"}
                    </Link>
                    <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                      <span>{formatViews(recVideo.views)}</span>
                      <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                      <span>{formatRelativeTime(recVideo.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
              No recommended videos available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
