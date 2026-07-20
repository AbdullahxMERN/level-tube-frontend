"use client";

import React, { useState, useEffect } from "react";
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
  Edit,
  X,
  ToggleLeft,
  ToggleRight,
  Eye,
  Calendar,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [upTitle, setUpTitle] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upVideoFile, setUpVideoFile] = useState(null);
  const [upThumbFile, setUpThumbFile] = useState(null);
  const [upLoading, setUpLoading] = useState(false);

  // Edit Modal states
  const [editOpen, setEditOpen] = useState(false);
  const [editVideoId, setEditVideoId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editThumbFile, setEditThumbFile] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Auto-open the upload modal when navigated to /dashboard?upload=true
  // (used by the top nav and mobile bottom nav Upload buttons)
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

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!upTitle.trim() || !upVideoFile || !upThumbFile)
      return alert("Please fill in all fields");

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
        setUploadOpen(false);
        alert("Video uploaded successfully!");
        loadDashboardData(); // Reload stats
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
                  thumbnail: response.data?.thumbnail || v.thumbnail,
                }
              : v,
          ),
        );
        setEditOpen(false);
        setEditThumbFile(null);
        alert("Video details updated successfully!");
      }
    } catch (err) {
      alert("Edit failed: " + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const response = await api.videos.delete(id);
      if (response.success) {
        setVideos((prev) => prev.filter((v) => v._id !== id));
        loadDashboardData(); // Reload stats
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
    setEditOpen(true);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-panel max-w-md mx-auto">
        <BarChart3 size={36} className="text-zinc-600 mb-3" />
        <h3 className="font-bold text-lg text-zinc-200">Studio Dashboard</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs px-4">
          Please sign in to upload videos, analyze stats, and manage your
          content.
        </p>
        <Link
          href="/login"
          className="mt-4 bg-zinc-150 hover:bg-zinc-250 text-zinc-950 px-6 py-2.5 rounded-full text-xs font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} className="text-indigo-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Studio Dashboard</h1>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs px-5 py-2.5 rounded-full shadow-lg shadow-indigo-600/10 transition-all duration-300"
        >
          <Upload size={14} />
          <span>Upload Video</span>
        </button>
      </div>

      {loading ? (
        // Loading state
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-zinc-900 animate-pulse"
              ></div>
            ))}
          </div>
          <div className="h-60 rounded-3xl bg-zinc-900 animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Videos",
                val: stats?.totalVideos || 0,
                icon: Film,
                color: "text-indigo-400 bg-indigo-500/5",
              },
              {
                label: "Total Views",
                val: stats?.totalViews?.toLocaleString() || 0,
                icon: BarChart3,
                color: "text-purple-400 bg-purple-500/5",
              },
              {
                label: "Subscribers",
                val: stats?.totalSubscribers?.toLocaleString() || 0,
                icon: Users,
                color: "text-pink-400 bg-pink-500/5",
              },
              {
                label: "Likes Gained",
                val: stats?.totalLikes?.toLocaleString() || 0,
                icon: ThumbsUp,
                color: "text-blue-400 bg-blue-500/5",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="glass-panel border border-zinc-900 p-5 rounded-3xl flex items-center justify-between bg-zinc-900/10"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-zinc-500 font-semibold">
                      {card.label}
                    </span>
                    <span className="text-2xl font-bold text-zinc-100">
                      {card.val}
                    </span>
                  </div>
                  <div className={`p-4 rounded-2xl ${card.color}`}>
                    <Icon size={20} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Videos Inventory Table */}
          <div className="glass-panel border border-zinc-900 rounded-3xl overflow-hidden bg-zinc-900/5 p-4 flex flex-col gap-4">
            <h3 className="font-bold text-base text-zinc-200 px-2">
              Uploaded Videos ({videos.length})
            </h3>

            {videos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-xs font-semibold text-zinc-500">
                      <th className="py-3 px-4">Video Details</th>
                      <th className="py-3 px-4">Publish Status</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4">Views</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((vid) => (
                      <tr
                        key={vid._id}
                        className="border-b border-zinc-900/40 text-sm hover:bg-zinc-900/10 group transition-colors"
                      >
                        <td className="py-3 px-4 max-w-xs">
                          <div className="flex gap-3 items-center min-w-0">
                            <Link
                              href={`/watch/${vid._id}`}
                              className="w-16 aspect-video bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 block"
                            >
                              <img
                                src={vid.thumbnail}
                                alt={vid.title}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                            <div className="flex flex-col min-w-0">
                              <Link
                                href={`/watch/${vid._id}`}
                                className="font-semibold text-zinc-200 hover:text-indigo-400 truncate"
                              >
                                {vid.title}
                              </Link>
                              <span className="text-[10px] text-zinc-500 truncate">
                                {vid.description}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleTogglePublish(vid._id)}
                            className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${
                              vid.isPublic ? "text-green-400" : "text-zinc-500"
                            }`}
                          >
                            {vid.isPublic ? (
                              <>
                                <ToggleRight size={18} />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft size={18} />
                                <span>Private</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            <span>
                              {new Date(vid.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <Eye size={12} />
                            <span>{vid.views?.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => triggerEdit(vid)}
                              className="text-zinc-500 hover:text-indigo-400 p-2 rounded-lg hover:bg-zinc-900 transition-all"
                              title="Edit Video"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(vid._id)}
                              className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-all"
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
              <div className="text-center py-16 text-zinc-600">
                <Film className="mx-auto mb-3 opacity-20" size={36} />
                <p className="text-sm">
                  You haven't uploaded any videos yet. Publish your first video!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Video Modal overlay */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Upload size={20} className="text-indigo-400" />
                <h3 className="font-bold text-lg text-zinc-200">
                  Upload New Video
                </h3>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="flex flex-col gap-4 overflow-y-auto pr-1"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">
                  Video Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js App Router Masterclass"
                  value={upTitle}
                  onChange={(e) => setUpTitle(e.target.value)}
                  required
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">
                  Description
                </label>
                <textarea
                  placeholder="Describe your video..."
                  value={upDesc}
                  onChange={(e) => setUpDesc(e.target.value)}
                  required
                  rows={4}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-semibold">
                    Video File
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUpVideoFile(e.target.files?.[0])}
                    required
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2 px-3 text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800 file:cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400 font-semibold">
                    Thumbnail Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUpThumbFile(e.target.files?.[0])}
                    required
                    className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2 px-3 text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800 file:cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-zinc-850 pt-4">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-lg disabled:opacity-40"
                >
                  {upLoading ? "Uploading details..." : "Publish Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal overlay */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <Edit size={20} className="text-indigo-400" />
                <h3 className="font-bold text-lg text-zinc-200">
                  Edit Video Details
                </h3>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">
                  Video Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">
                  Description
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                  rows={4}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">
                  New Thumbnail Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditThumbFile(e.target.files?.[0])}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2 px-3 text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-zinc-200 hover:file:bg-zinc-800 file:cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-zinc-850 pt-4">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="text-zinc-400 hover:text-zinc-200 text-sm font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-lg disabled:opacity-40"
                >
                  {editLoading ? "Updating details..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
