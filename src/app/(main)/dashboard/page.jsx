"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import {
  BarChart3,
  Users,
  ThumbsUp,
  Film,
  Upload,
  Trash2,
  Edit3,
  X,
  ToggleLeft,
  ToggleRight,
  Eye,
  Calendar,
  Search,
  Play,
  TrendingUp,
  FileVideo,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'public', 'private'
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'views', 'title'

  // Upload Modal states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upVideoFile, setUpVideoFile] = useState(null);
  const [upThumbFile, setUpThumbFile] = useState(null);
  const [upLoading, setUpLoading] = useState(false);
  const [thumbPreview, setThumbPreview] = useState(null);

  // Edit Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [editVideoId, setEditVideoId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editThumbFile, setEditThumbFile] = useState(null);
  const [editThumbPreview, setEditThumbPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Auto-open upload modal when navigated to /dashboard?upload=true
  useEffect(() => {
    if (searchParams.get("upload") === "true") {
      setUploadOpen(true);
    }
  }, [searchParams]);

  const loadDashboardData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const statsRes = await api.dashboard.getStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const videosRes = await api.dashboard.getVideos();
      if (videosRes.success && videosRes.data) {
        setVideos(videosRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle Thumbnail Previews
  const handleThumbSelect = (file, isEdit = false) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (isEdit) {
      setEditThumbFile(file);
      setEditThumbPreview(url);
    } else {
      setUpThumbFile(file);
      setThumbPreview(url);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!upTitle.trim() || !upVideoFile || !upThumbFile) {
      return alert("Please select a title, video file, and thumbnail image.");
    }

    setUpLoading(true);
    try {
      const response = await api.videos.upload(
        upTitle,
        upDesc,
        upVideoFile,
        upThumbFile,
      );
      if (response.success && response.data) {
        setVideos((prev) => [response.data, ...prev]);
        setUpTitle("");
        setUpDesc("");
        setUpVideoFile(null);
        setUpThumbFile(null);
        setThumbPreview(null);
        setUploadOpen(false);
        loadDashboardData(); // Refresh stats
      } else {
        alert(response.message || "Upload failed");
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUpLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await api.videos.update(
        editVideoId,
        editTitle,
        editDesc,
        editThumbFile,
      );
      if (response.success) {
        setVideos((prev) =>
          prev.map((v) =>
            v._id === editVideoId
              ? {
                  ...v,
                  title: editTitle,
                  description: editDesc,
                  thumbnail: response.data?.thumbnail || editThumbPreview || v.thumbnail,
                }
              : v,
          ),
        );
        setEditOpen(false);
        setEditThumbFile(null);
        setEditThumbPreview(null);
      }
    } catch (err) {
      alert("Edit failed: " + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm("Are you sure you want to delete this video? This cannot be undone.")) return;
    try {
      const response = await api.videos.delete(id);
      if (response.success) {
        setVideos((prev) => prev.filter((v) => v._id !== id));
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      const response = await api.videos.togglePublish(id);
      if (response.success) {
        setVideos((prev) =>
          prev.map((v) => (v._id === id ? { ...v, isPublic: !v.isPublic } : v)),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const triggerEdit = (video) => {
    setEditVideoId(video._id);
    setEditTitle(video.title);
    setEditDesc(video.description);
    setEditThumbPreview(video.thumbnail);
    setEditOpen(true);
  };

  // Filtered & Sorted Videos
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        const searchLower = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !searchLower ||
          (v.title || "").toLowerCase().includes(searchLower) ||
          (v.description || "").toLowerCase().includes(searchLower);

        const isVidPublic = v.isPublic !== false; // treat undefined as public

        if (statusFilter === "public") return matchesSearch && isVidPublic;
        if (statusFilter === "private") return matchesSearch && !isVidPublic;
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "views") {
          return (b.views || 0) - (a.views || 0);
        }
        if (sortBy === "title") {
          return (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" });
        }
        // "newest"
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [videos, searchQuery, statusFilter, sortBy]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-center max-w-md mx-auto px-4">
        <div className="p-3.5 sm:p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl mb-6">
          <Logo />
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight">LevelTube Studio</h3>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
          Sign in to access your creator dashboard, upload content, and monitor channel growth.
        </p>
        <Link
          href="/login"
          className="mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs sm:text-sm px-7 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-xl shadow-indigo-500/25 border border-indigo-400/30 transition-all duration-300"
        >
          Sign In to Creator Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8 pb-20 max-w-7xl mx-auto px-3 sm:px-6 pt-1 sm:pt-2">
      {/* ── Top Header Banner (Mobile & Desktop Responsive) ─────────── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-panel bg-zinc-950/80 border border-zinc-800/80 p-4 sm:p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 sm:w-80 sm:h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          {/* Header Left Info */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Logo size="compact" />
              <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[9px] sm:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Pro Studio
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
              Studio Dashboard
            </h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-zinc-400 leading-normal">
              Welcome back, <span className="text-zinc-200 font-semibold">{user.fullName || user.userName}</span>. Manage content & monitor growth.
            </p>
          </div>

          {/* Header Upload Button */}
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-bold text-xs sm:text-sm px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-500/25 border border-indigo-400/30 transition-all duration-300 w-full sm:w-auto flex-shrink-0"
          >
            <Upload size={16} />
            <span>Upload Content</span>
          </button>
        </div>
      </div>

      {loading ? (
        // Skeleton loader
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 sm:h-32 rounded-2xl sm:rounded-3xl bg-zinc-900/60 border border-zinc-800/50 animate-pulse" />
            ))}
          </div>
          <div className="h-80 sm:h-96 rounded-2xl sm:rounded-3xl bg-zinc-900/60 border border-zinc-800/50 animate-pulse" />
        </div>
      ) : (
        <>
          {/* ── Analytics Overview Cards (1 Column on Mobile, 2 on Tablet, 4 on Desktop) ────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: "Total Content",
                value: stats?.totalVideos || videos.length || 0,
                unit: "Videos",
                icon: Film,
                badge: "Active Library",
              },
              {
                title: "Total Views",
                value: (stats?.totalViews || 0).toLocaleString(),
                unit: "Views",
                icon: Eye,
                badge: "All-Time Views",
              },
              {
                title: "Subscribers",
                value: (stats?.totalSubscribers || 0).toLocaleString(),
                unit: "Subscribers",
                icon: Users,
                badge: "Audience",
              },
              {
                title: "Total Likes",
                value: (stats?.totalLikes || 0).toLocaleString(),
                unit: "Reactions",
                icon: ThumbsUp,
                badge: "Reactions",
              },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div
                  key={i}
                  className="relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-indigo-500/30 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl flex flex-col justify-between gap-2.5 sm:gap-4 shadow-xl backdrop-blur-md transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase tracking-wider truncate">
                      {metric.title}
                    </span>
                    <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors flex-shrink-0">
                      <Icon size={15} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-0.5 sm:mt-1">
                    <span className="text-xl sm:text-3xl md:text-4xl font-extrabold text-zinc-100 tracking-tight">
                      {metric.value}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 hidden sm:inline">
                      {metric.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold text-indigo-400 pt-2 sm:pt-3 border-t border-zinc-800/80">
                    <TrendingUp size={11} className="sm:w-3 sm:h-3" />
                    <span className="truncate">{metric.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Video Inventory Section ────────────────────────────── */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
            {/* Control Header */}
            <div className="p-4 sm:p-6 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-zinc-950/40">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Film size={18} className="sm:w-[20px] sm:h-[20px]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-100 tracking-tight">
                    Video Inventory
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">
                    {filteredVideos.length} of {videos.length} videos shown
                  </p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="relative flex-1 min-w-[140px] sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-1.5 sm:py-2 pl-8 pr-7 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-1.5 sm:py-2 px-2.5 sm:px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-1.5 sm:py-2 px-2.5 sm:px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="views">Most Views</option>
                  <option value="title">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            {filteredVideos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/60">
                      <th className="py-3 sm:py-4 px-3 sm:px-6">Video Title</th>
                      <th className="py-3 sm:py-4 px-2 sm:px-4">Visibility</th>
                      <th className="py-3 sm:py-4 px-2 sm:px-4">Uploaded</th>
                      <th className="py-3 sm:py-4 px-2 sm:px-4">Views</th>
                      <th className="py-3 sm:py-4 px-3 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-xs sm:text-sm">
                    {filteredVideos.map((vid) => (
                      <tr
                        key={vid._id}
                        className="hover:bg-indigo-500/[0.03] transition-colors group"
                      >
                        {/* Video Thumbnail & Details */}
                        <td className="py-3 sm:py-4 px-3 sm:px-6 max-w-xs sm:max-w-md">
                          <div className="flex gap-2.5 sm:gap-4 items-center">
                            <Link
                              href={`/watch/${vid._id}`}
                              className="relative w-20 sm:w-28 aspect-video bg-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0 block group/thumb border border-zinc-800"
                            >
                              <img
                                src={vid.thumbnail}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                <Play size={15} className="text-white fill-white" />
                              </div>
                            </Link>

                            <div className="flex flex-col min-w-0">
                              <Link
                                href={`/watch/${vid._id}`}
                                className="font-bold text-zinc-100 hover:text-indigo-400 transition-colors line-clamp-1 text-xs sm:text-sm"
                              >
                                {vid.title}
                              </Link>
                              <p className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 mt-0.5 font-normal">
                                {vid.description || "No description provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Visibility Toggle */}
                        <td className="py-3 sm:py-4 px-2 sm:px-4">
                          <button
                            onClick={() => handleTogglePublish(vid._id)}
                            className={`inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all ${
                              vid.isPublic
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800"
                            }`}
                          >
                            {vid.isPublic ? (
                              <>
                                <ToggleRight size={14} className="text-emerald-400" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={14} />
                                <span>Private</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Upload Date */}
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-[11px] sm:text-xs text-zinc-400 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-zinc-500" />
                            <span>
                              {new Date(vid.createdAt).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Views */}
                        <td className="py-3 sm:py-4 px-2 sm:px-4 text-[11px] sm:text-xs text-zinc-300 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg sm:rounded-xl border border-zinc-800/60 w-fit">
                            <Eye size={12} className="text-indigo-400" />
                            <span>{(vid.views || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 sm:py-4 px-3 sm:px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/watch/${vid._id}`}
                              className="text-zinc-400 hover:text-zinc-100 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all"
                              title="Watch Video"
                            >
                              <ExternalLink size={14} />
                            </Link>

                            <button
                              onClick={() => triggerEdit(vid)}
                              className="text-zinc-400 hover:text-indigo-400 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/40 transition-all"
                              title="Edit Video"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteVideo(vid._id)}
                              className="text-zinc-400 hover:text-rose-400 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/40 transition-all"
                              title="Delete Video"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-20 sm:py-24 flex flex-col items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 shadow-xl">
                  <Film size={26} />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-zinc-200">No videos found</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs sm:max-w-sm">
                  {searchQuery
                    ? `No matches found for "${searchQuery}". Try clearing search or status filters.`
                    : "Upload your first video to start growing your LevelTube channel!"}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={() => setUploadOpen(true)}
                    className="mt-5 sm:mt-6 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
                  >
                    Upload First Video
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Upload Video Modal Overlay ─────────────────────────────── */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in relative overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 sm:mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Upload size={18} className="sm:w-[20px] sm:h-[20px]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-100">Upload Video</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">Publish content to LevelTube</p>
                </div>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 sm:p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 overflow-y-auto pr-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Video Title *</label>
                <input
                  type="text"
                  placeholder="Give your video a compelling title"
                  value={upTitle}
                  onChange={(e) => setUpTitle(e.target.value)}
                  required
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Description *</label>
                <textarea
                  placeholder="Tell viewers about your video..."
                  value={upDesc}
                  onChange={(e) => setUpDesc(e.target.value)}
                  required
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-bold">Video File (.mp4) *</label>
                  <label className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl sm:rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-all group">
                    <FileVideo size={24} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                    <span className="text-xs text-zinc-400 font-medium text-center line-clamp-1">
                      {upVideoFile ? upVideoFile.name : "Select Video File"}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setUpVideoFile(e.target.files?.[0])}
                      required
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-bold">Thumbnail Image *</label>
                  <label className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-xl sm:rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-all group relative overflow-hidden">
                    {thumbPreview ? (
                      <img
                        src={thumbPreview}
                        alt="Preview"
                        className="w-full h-20 object-cover rounded-lg sm:rounded-xl"
                      />
                    ) : (
                      <>
                        <ImageIcon size={24} className="text-zinc-500 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-xs text-zinc-400 font-medium text-center line-clamp-1">
                          {upThumbFile ? upThumbFile.name : "Select Cover Image"}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbSelect(e.target.files?.[0], false)}
                      required
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold px-3 sm:px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upLoading}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30 disabled:opacity-40 flex items-center gap-2"
                >
                  {upLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading Content...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span>Publish to LevelTube</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Video Modal Overlay ───────────────────────────────── */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-4 sm:mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-100">Edit Details</h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400">Update video metadata</p>
                </div>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 sm:p-2 rounded-xl hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">New Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleThumbSelect(e.target.files?.[0], true)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl sm:rounded-2xl py-2 px-3 text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800 file:cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs px-6 py-2.5 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30 disabled:opacity-40"
                >
                  {editLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
