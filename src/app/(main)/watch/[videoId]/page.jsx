"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  Check,
  Download,
  Reply,
  X,
  Pencil,
} from "lucide-react";
import VideoCard from "@/components/VideoCard";

// Matches a leading "@username " mention, e.g. "@johndoe nice video!"
const MENTION_REGEX = /^@([a-zA-Z0-9_]+)\s+/;

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

  // Delete state — track which comment id is currently being deleted, for UI feedback
  const [deletingId, setDeletingId] = useState(null);

  // Edit state — track which comment is being edited, and the draft text
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Comment-like guard — prevents double-fire per comment (create/delete race)
  const likingCommentRef = useRef(new Set());

  // Video-like guard — prevents double-fire on the video like button
  const likingVideoRef = useRef(false);

  // Tracks which comment threads have their replies expanded (YouTube style)
  const [expandedThreads, setExpandedThreads] = useState({});

  // Safe helper to extract likes count from multiple possible backend formats (numeric or array fields)
  const getCommentLikesCount = (comment) => {
    if (typeof comment.likesCount === "number") return comment.likesCount;
    if (Array.isArray(comment.likes)) return comment.likes.length;
    if (typeof comment.likes === "number") return comment.likes;
    return 0;
  };

  // Safe helper to extract like state depending on back-end format
  const getCommentIsLiked = (comment) => {
    if (typeof comment.isLiked === "boolean") return comment.isLiked;
    if (Array.isArray(comment.likes) && user) {
      return comment.likes.some((like) => {
        const likedBy = like.likedBy || like.owner || like;
        return String(likedBy) === String(user._id);
      });
    }
    return false;
  };

  // Groups comments into 1-level-deep root threads (like YouTube).
  // Matches replies strictly to the closest preceding root comment by that user.
  const { rootComments, repliesByParentId } = useMemo(() => {
    const sorted = [...comments].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const roots = [];
    const repliesMap = {};

    // First pass: register root comments (comments that don't start with a mention)
    sorted.forEach((c) => {
      if (!MENTION_REGEX.test(c.content)) {
        roots.push(c);
        repliesMap[c._id] = [];
      }
    });

    // Second pass: map replies to the correct root thread
    sorted.forEach((c, idx) => {
      const match = c.content.match(MENTION_REGEX);
      if (match) {
        const mentionedUser = match[1].toLowerCase();
        let parentId = null;

        // Walk backwards to find the closest root comment written by the mentioned user
        for (let i = idx - 1; i >= 0; i--) {
          const candidate = sorted[i];
          if (
            !MENTION_REGEX.test(candidate.content) &&
            candidate.owner?.userName?.toLowerCase() === mentionedUser
          ) {
            parentId = candidate._id;
            break;
          }
        }

        // Fallback: if no root comment matches, assign to closest root comment chronologically
        if (!parentId) {
          for (let i = idx - 1; i >= 0; i--) {
            if (!MENTION_REGEX.test(sorted[i].content)) {
              parentId = sorted[i]._id;
              break;
            }
          }
        }

        if (parentId && repliesMap[parentId]) {
          repliesMap[parentId].push(c);
        } else {
          // Fallback root assignment
          roots.push(c);
          repliesMap[c._id] = [];
        }
      }
    });

    // Sort root threads descending (newest comments on top)
    roots.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { rootComments: roots, repliesByParentId: repliesMap };
  }, [comments]);

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
  }, [videoId]);

  const handleLikeToggle = async () => {
    if (!user) return alert("Please sign in to like videos");
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
    if (!user) return alert("Please sign in to subscribe");
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to comment");
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

  const handleCommentDelete = async (commentId) => {
    setDeletingId(commentId);
    try {
      const response = await api.comments.delete(commentId);
      if (response.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      } else {
        console.error("Delete failed, server responded:", response);
        alert(response.message || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Delete comment error:", err);
      alert(err.message || "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  // Opens the reply box under a comment, pre-filled with @username
  const handleReplyClick = (comment) => {
    if (!user) return alert("Please sign in to reply");
    const mention = `@${comment.owner?.userName || "user"} `;

    if (replyingTo === comment._id) {
      setReplyingTo(null);
      setReplyText("");
      return;
    }

    setReplyingTo(comment._id);
    setReplyText(mention);
    setTimeout(() => replyInputRef.current?.focus(), 0);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to reply");
    if (!replyText.trim()) return;

    try {
      const response = await api.comments.add(videoId, replyText);
      if (response.success && response.data) {
        setComments((prev) => [response.data, ...prev]);
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Opens/closes the inline edit box for a comment, pre-filled with its content
  const handleEditClick = (comment) => {
    if (editingId === comment._id) {
      setEditingId(null);
      setEditText("");
      return;
    }
    setEditingId(comment._id);
    setEditText(comment.content);
  };

  const handleEditSave = async (commentId) => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      const response = await api.comments.update(commentId, editText.trim());
      if (response.success && response.data) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? response.data : c)),
        );
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

  // Toggles like on a single comment, with optimistic update + rollback
  const handleCommentLikeToggle = async (commentId) => {
    if (!user) return alert("Please sign in to like comments");
    if (likingCommentRef.current.has(commentId)) return;
    likingCommentRef.current.add(commentId);

    const prevComments = comments;

    setComments((prev) =>
      prev.map((c) => {
        if (c._id !== commentId) return c;

        const currentLiked = getCommentIsLiked(c);
        const nextLiked = !currentLiked;

        const currentCount = getCommentLikesCount(c);
        const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

        return {
          ...c,
          isLiked: nextLiked,
          likesCount: nextCount,
          likes: Array.isArray(c.likes)
            ? nextLiked
              ? [...c.likes, user._id]
              : c.likes.filter((id) => String(id) !== String(user._id))
            : nextCount,
        };
      }),
    );

    try {
      const response = await api.likes.toggleComment(commentId);
      if (!response.success) {
        setComments(prevComments);
      }
    } catch (err) {
      console.error(err);
      setComments(prevComments);
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

  const toggleThreadReplies = (commentId) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Renders a single row item
  const renderCommentRow = (comment, isReply = false) => {
    const isLikedState = getCommentIsLiked(comment);
    const commentLikesCount = getCommentLikesCount(comment);

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
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            {isOwnComment(comment) && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <button
                  onClick={() => handleEditClick(comment)}
                  className="text-zinc-600 hover:text-indigo-400 p-1 rounded-md hover:bg-zinc-900 transition-all duration-200"
                  title="Edit Comment"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleCommentDelete(comment._id)}
                  disabled={deletingId === comment._id}
                  className="text-zinc-600 hover:text-red-400 p-1 rounded-md hover:bg-zinc-900 transition-all duration-200 disabled:opacity-50"
                  title="Delete Comment"
                >
                  <Trash2 size={14} />
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
                  onClick={() => handleEditSave(comment._id)}
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
              {comment.content.match(MENTION_REGEX) ? (
                <>
                  <span className="text-indigo-400 font-medium">
                    {comment.content.match(MENTION_REGEX)[0].trim()}
                  </span>{" "}
                  {comment.content.replace(MENTION_REGEX, "")}
                </>
              ) : (
                comment.content
              )}
            </p>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={() => handleCommentLikeToggle(comment._id)}
              aria-label={isLikedState ? "Unlike comment" : "Like comment"}
              className={`flex items-center gap-1.5 text-xs transition-colors py-1 px-2 rounded-full hover:bg-zinc-900/50 ${
                isLikedState
                  ? "text-indigo-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <ThumbsUp
                size={12}
                fill={isLikedState ? "currentColor" : "none"}
                className="transition-transform active:scale-125 duration-200"
              />
              <span>{commentLikesCount}</span>
            </button>

            <button
              onClick={() => handleReplyClick(comment)}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-indigo-400 transition-colors py-1 px-2 rounded-full hover:bg-zinc-900/50"
            >
              <Reply size={12} />
              <span>{replyingTo === comment._id ? "Cancel" : "Reply"}</span>
            </button>
          </div>

          {/* Inline Reply Input Form */}
          {replyingTo === comment._id && (
            <form
              onSubmit={handleReplySubmit}
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
                  placeholder="Write a reply..."
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
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

          {/* Post Comment */}
          <form onSubmit={handleCommentSubmit} className="flex gap-4">
            <img
              src={
                user?.avatar ||
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
              }
              alt={user?.fullName || "Guest"}
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

          {/* Comments List */}
          <div className="flex flex-col gap-6">
            {rootComments.map((rootComment) => {
              const threadReplies = repliesByParentId[rootComment._id] || [];
              const isExpanded = expandedThreads[rootComment._id];

              return (
                <div
                  key={rootComment._id}
                  className="flex flex-col gap-2 border-b border-zinc-900/30 pb-4"
                >
                  {/* Root Comment Row */}
                  {renderCommentRow(rootComment, false)}

                  {/* Reply Toggle Actions — YouTube style */}
                  {threadReplies.length > 0 && (
                    <div className="pl-14">
                      <button
                        onClick={() => toggleThreadReplies(rootComment._id)}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 mt-1"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide {threadReplies.length} replies</span>
                          </>
                        ) : (
                          <>
                            <span>View {threadReplies.length} replies</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* One-Level Nesting for Replies */}
                  {isExpanded && threadReplies.length > 0 && (
                    <div className="pl-12 border-l border-zinc-800/50 ml-5 mt-2 flex flex-col gap-4">
                      {threadReplies.map((reply) =>
                        renderCommentRow(reply, true),
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
