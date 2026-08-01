"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
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
  Plus,
  Search,
  Sparkles,
  Play,
  TrendingUp,
  FileVideo,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
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
        const matchesSearch =
          v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.description?.toLowerCase().includes(searchQuery.toLowerCase());
        if (statusFilter === "public") return matchesSearch && v.isPublic;
        if (statusFilter === "private") return matchesSearch && !v.isPublic;
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "views") return (b.views || 0) - (a.views || 0);
        if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [videos, searchQuery, statusFilter, sortBy]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-xl shadow-indigo-500/5">
          <BarChart3 size={32} />
        </div>
        <h3 className="text-2xl font-extrabold text-zinc-100 tracking-tight">LevelTube Studio</h3>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          Sign in to access your creator dashboard, upload content, and manage video analytics.
        </p>
        <Link
          href="/login"
          className="mt-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-sm px-8 py-3 rounded-full shadow-lg shadow-indigo-600/20 transition-all duration-300"
        >
          Sign In to Creator Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-zinc-800/80 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white flex-shrink-0">
              <Zap size={28} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight">
                  Studio Dashboard
                </h1>
                <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Pro Studio
                </span>
              </div>
              <p className="text-xs md:text-sm text-zinc-400 mt-1">
                Welcome back, <span className="text-zinc-200 font-semibold">{user.fullName || user.userName}</span>. Manage your channel content and monitor real-time growth.
              </p>
            </div>
          </div>

          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-xl shadow-indigo-600/25 border border-indigo-400/30 transition-all duration-300 flex-shrink-0"
          >
            <Upload size={18} />
            <span>Upload Content</span>
          </button>
        </div>
      </div>

      {loading ? (
        // Skeleton loader
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-zinc-900/60 border border-zinc-800/50 animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 rounded-3xl bg-zinc-900/60 border border-zinc-800/50 animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Analytics Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: "Total Content",
                value: stats?.totalVideos || videos.length || 0,
                unit: "Videos",
                icon: Film,
                gradient: "from-indigo-500/20 to-indigo-600/5",
                iconBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
                badge: "Active Library",
              },
              {
                title: "Total Channel Views",
                value: (stats?.totalViews || 0).toLocaleString(),
                unit: "Views",
                icon: Eye,
                gradient: "from-violet-500/20 to-purple-600/5",
                iconBg: "bg-violet-500/15 text-violet-400 border-violet-500/20",
                badge: "All-Time Views",
              },
              {
                title: "Subscribers",
                value: (stats?.totalSubscribers || 0).toLocaleString(),
                unit: "Subscribers",
                icon: Users,
                gradient: "from-blue-500/20 to-cyan-600/5",
                iconBg: "bg-blue-500/15 text-blue-400 border-blue-500/20",
                badge: "Channel Audience",
              },
              {
                title: "Total Likes",
                value: (stats?.totalLikes || 0).toLocaleString(),
                unit: "Reactions",
                icon: ThumbsUp,
                gradient: "from-pink-500/20 to-rose-600/5",
                iconBg: "bg-pink-500/15 text-pink-400 border-pink-500/20",
                badge: "Community Love",
              },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <div
                  key={i}
                  className={`relative overflow-hidden bg-gradient-to-b ${metric.gradient} bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-3xl flex flex-col justify-between gap-4 shadow-lg backdrop-blur-md hover:border-zinc-700/80 transition-all duration-300`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">
                      {metric.title}
                    </span>
                    <div className={`p-2.5 rounded-2xl border ${metric.iconBg}`}>
                      <Icon size={18} />
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-3xl font-extrabold text-zinc-100 tracking-tight">
                      {metric.value}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-500">
                      {metric.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-400 pt-2 border-t border-zinc-800/50">
                    <TrendingUp size={12} />
                    <span>{metric.badge}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Videos Inventory Section */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
            {/* Table Control Header */}
            <div className="p-5 border-b border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Film size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-100">
                    Video Inventory
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {filteredVideos.length} of {videos.length} videos shown
                  </p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Status</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>

                {/* Sort dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
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
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                      <th className="py-3.5 px-5">Video Title</th>
                      <th className="py-3.5 px-4">Visibility</th>
                      <th className="py-3.5 px-4">Uploaded</th>
                      <th className="py-3.5 px-4">Views</th>
                      <th className="py-3.5 px-5 text-right">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40 text-sm">
                    {filteredVideos.map((vid) => (
                      <tr
                        key={vid._id}
                        className="hover:bg-indigo-500/[0.03] transition-colors group"
                      >
                        {/* Video Thumbnail & Details */}
                        <td className="py-4 px-5 max-w-sm">
                          <div className="flex gap-3.5 items-center">
                            <Link
                              href={`/watch/${vid._id}`}
                              className="relative w-24 aspect-video bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0 block group/thumb border border-zinc-800"
                            >
                              <img
                                src={vid.thumbnail}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                <Play size={16} className="text-white fill-white" />
                              </div>
                            </Link>

                            <div className="flex flex-col min-w-0">
                              <Link
                                href={`/watch/${vid._id}`}
                                className="font-bold text-zinc-200 hover:text-indigo-400 transition-colors line-clamp-1 text-sm"
                              >
                                {vid.title}
                              </Link>
                              <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5 font-light">
                                {vid.description || "No description provided"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Visibility Toggle */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleTogglePublish(vid._id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              vid.isPublic
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800"
                            }`}
                          >
                            {vid.isPublic ? (
                              <>
                                <ToggleRight size={16} className="text-emerald-400" />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={16} />
                                <span>Private</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Upload Date */}
                        <td className="py-4 px-4 text-xs text-zinc-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-zinc-500" />
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
                        <td className="py-4 px-4 text-xs text-zinc-300 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-zinc-800/60 w-fit">
                            <Eye size={13} className="text-indigo-400" />
                            <span>{(vid.views || 0).toLocaleString()}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/watch/${vid._id}`}
                              className="text-zinc-400 hover:text-zinc-200 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-all"
                              title="Watch Video"
                            >
                              <ExternalLink size={14} />
                            </Link>

                            <button
                              onClick={() => triggerEdit(vid)}
                              className="text-zinc-400 hover:text-indigo-400 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-indigo-500/40 transition-all"
                              title="Edit Video"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              onClick={() => handleDeleteVideo(vid._id)}
                              className="text-zinc-400 hover:text-rose-400 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 hover:border-rose-500/40 transition-all"
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
              <div className="text-center py-20 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                  <Film size={28} />
                </div>
                <h4 className="font-bold text-base text-zinc-300">No videos found</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
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
                    className="mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-full shadow-lg shadow-indigo-600/20"
                  >
                    Upload First Video
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Video Modal Overlay */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 md:p-7 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in relative overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-100">Upload Video</h3>
                  <p className="text-xs text-zinc-400">Publish content to LevelTube</p>
                </div>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded-xl hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4 overflow-y-auto pr-1">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Video Title *</label>
                <input
                  type="text"
                  placeholder="Give your video a compelling title"
                  value={upTitle}
                  onChange={(e) => setUpTitle(e.target.value)}
                  required
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Description *</label>
                <textarea
                  placeholder="Tell viewers about your video..."
                  value={upDesc}
                  onChange={(e) => setUpDesc(e.target.value)}
                  required
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                />
              </div>

              {/* File Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Video File */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-bold">Video File (.mp4) *</label>
                  <label className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-all group">
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

                {/* Thumbnail File */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-bold">Thumbnail Image *</label>
                  <label className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition-all group relative overflow-hidden">
                    {thumbPreview ? (
                      <img
                        src={thumbPreview}
                        alt="Preview"
                        className="w-full h-20 object-cover rounded-xl"
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

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-xs font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-40 flex items-center gap-2"
                >
                  {upLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
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

      {/* Edit Video Modal Overlay */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-zinc-100">Edit Details</h3>
                  <p className="text-xs text-zinc-400">Update video metadata</p>
                </div>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded-xl hover:bg-zinc-800"
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
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-bold">New Thumbnail (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleThumbSelect(e.target.files?.[0], true)}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2 px-3 text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800 file:cursor-pointer"
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
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg disabled:opacity-40"
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
