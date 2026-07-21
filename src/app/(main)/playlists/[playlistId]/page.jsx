'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { 
  ListMusic, 
  Trash2, 
  Play, 
  ArrowLeft, 
  Plus, 
  Search, 
  Video, 
  Image, 
  Loader2, 
  X 
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal open states
  const [isExistingModalOpen, setIsExistingModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Existing videos state
  const [existingVideos, setExistingVideos] = useState([]);
  const [existingVideosLoading, setExistingVideosLoading] = useState(false);
  const [existingSearchQuery, setExistingSearchQuery] = useState('');

  // Upload/Add state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVideoFile, setUploadVideoFile] = useState(null);
  const [uploadThumbnailFile, setUploadThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadPlaylist = async () => {
    setLoading(true);
    try {
      const response = await api.playlists.getById(playlistId);
      if (response.success && response.data) {
        setPlaylist(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const handleRemoveVideo = async (videoId) => {
    try {
      const response = await api.playlists.removeVideo(playlistId, videoId);
      if (response.success) {
        setPlaylist(prev => ({
          ...prev,
          videos: prev.videos.filter(v => v._id !== videoId)
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all existing videos in system for "Add from Existing Videos" modal
  const loadExistingVideos = async () => {
    setExistingVideosLoading(true);
    try {
      const response = await api.videos.getAll();
      if (response.success && response.data) {
        // Only show videos NOT already in the playlist
        const currentVideoIds = (playlist?.videos || []).map(v => v._id);
        const filtered = response.data.filter(v => !currentVideoIds.includes(v._id));
        setExistingVideos(filtered);
      }
    } catch (err) {
      console.error("Failed to load existing videos:", err);
    } finally {
      setExistingVideosLoading(false);
    }
  };

  useEffect(() => {
    if (isExistingModalOpen) {
      loadExistingVideos();
    }
  }, [isExistingModalOpen]);

  const handleAddExistingVideo = async (videoId) => {
    try {
      const response = await api.playlists.addVideo(playlistId, videoId);
      if (response.success && response.data) {
        setPlaylist(response.data);
        // Remove from the modal list instantly
        setExistingVideos(prev => prev.filter(v => v._id !== videoId));
      }
    } catch (err) {
      console.error("Failed to add video to playlist:", err);
      alert("Failed to add video to playlist: " + err.message);
    }
  };

  const handleUploadAndAdd = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadDescription.trim() || !uploadVideoFile || !uploadThumbnailFile) {
      return alert("Please fill in all fields and select files.");
    }

    setUploading(true);
    try {
      // 1. Upload the video to Cloudinary/Gallery
      const uploadRes = await api.videos.upload(
        uploadTitle,
        uploadDescription,
        uploadVideoFile,
        uploadThumbnailFile
      );

      if (uploadRes.success && uploadRes.data?._id) {
        const newVideoId = uploadRes.data._id;
        
        // 2. Add this newly uploaded video to our playlist
        const addRes = await api.playlists.addVideo(playlistId, newVideoId);
        if (addRes.success && addRes.data) {
          setPlaylist(addRes.data);
          
          // Reset form & close modal
          setUploadTitle('');
          setUploadDescription('');
          setUploadVideoFile(null);
          setUploadThumbnailFile(null);
          setIsGalleryModalOpen(false);
        }
      }
    } catch (err) {
      console.error("Failed to upload and add video:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const isOwner = playlist && (playlist.owner?._id === user?._id || playlist.owner === user?._id);

  // Filter existing videos for search bar inside modal
  const searchedExistingVideos = existingVideos.filter(video => 
    video.title?.toLowerCase().includes(existingSearchQuery.toLowerCase()) ||
    video.owner?.fullName?.toLowerCase().includes(existingSearchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-1/4 bg-zinc-900 rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="h-60 rounded-3xl bg-zinc-900"></div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="h-10 bg-zinc-900 rounded"></div>
            <div className="h-10 bg-zinc-900 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-zinc-300">Playlist not found</h3>
        <button onClick={() => router.back()} className="mt-4 text-indigo-400 flex items-center gap-2 mx-auto">
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 animate-fade-in relative">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 text-sm font-semibold self-start"
      >
        <ArrowLeft size={16} />
        <span>Back to Playlists</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Playlist Info Box */}
        <div className="glass-panel border border-zinc-900 p-6 rounded-3xl bg-gradient-to-b from-zinc-900/30 to-zinc-950 flex flex-col justify-between h-fit gap-6">
          <div className="flex flex-col gap-4">
            <div className="bg-indigo-600/10 text-indigo-400 p-4 rounded-3xl w-fit">
              <ListMusic size={32} />
            </div>
            
            <h1 className="text-2xl font-bold text-zinc-100">{playlist.name}</h1>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">{playlist.description || 'No description'}</p>
          </div>

          <div className="flex flex-col gap-4 border-t border-zinc-900 pt-4">
            {/* Owner Actions */}
            {isOwner && (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setIsExistingModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs px-4 py-3 rounded-full transition-all duration-200 cursor-pointer"
                >
                  <Plus size={14} className="text-indigo-400" />
                  <span>Add from Existing Videos</span>
                </button>
                <button
                  onClick={() => setIsGalleryModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-3 rounded-full transition-all duration-200 shadow-lg shadow-indigo-600/10 cursor-pointer"
                >
                  <Video size={14} />
                  <span>Add from Gallery</span>
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 text-xs text-zinc-500">
              <p>Created by: <span className="text-zinc-300 font-medium">@{playlist.owner?.userName || 'creator'}</span></p>
              <p>{playlist.videos?.length || 0} Videos</p>
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {playlist.videos && playlist.videos.length > 0 ? (
            playlist.videos.map((video, idx) => (
              <div 
                key={video._id}
                className="flex items-center justify-between gap-4 p-3 bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 rounded-2xl group transition-all"
              >
                <div className="flex gap-4 items-center min-w-0">
                  <span className="text-xs font-bold text-zinc-600 w-4 text-center">{idx + 1}</span>
                  
                  <Link href={`/watch/${video._id}`} className="relative w-28 aspect-video rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 block">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play size={16} fill="white" className="text-white" />
                    </div>
                  </Link>

                  <div className="flex flex-col min-w-0 py-0.5">
                    <Link href={`/watch/${video._id}`} className="font-bold text-sm text-zinc-200 hover:text-indigo-400 transition-colors truncate">
                      {video.title}
                    </Link>
                    <span className="text-[10px] text-zinc-500 mt-1">
                      {video.owner?.fullName || 'Creator'} • {video.views?.toLocaleString()} views
                    </span>
                  </div>
                </div>

                {/* If current user is playlist owner, allow removing video */}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveVideo(video._id)}
                    className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-all mr-2 cursor-pointer"
                    title="Remove from playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 glass-panel border-zinc-900 rounded-3xl text-zinc-500">
              <ListMusic className="mx-auto mb-3 opacity-20 text-indigo-400" size={36} />
              <p className="text-zinc-400 font-light">This playlist has no videos. Add some to get started!</p>
            </div>
          )}
        </div>
      </div>

      {/* 1. Modal: Add from Existing Videos */}
      {isExistingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Video size={20} className="text-indigo-400" />
                <h3 className="font-bold text-lg text-zinc-200">Add from Existing Videos</h3>
              </div>
              <button 
                onClick={() => {
                  setIsExistingModalOpen(false);
                  setExistingSearchQuery('');
                }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4 flex-shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search videos by title or creator..."
                value={existingSearchQuery}
                onChange={(e) => setExistingSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Videos List Container */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[250px]">
              {existingVideosLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500 text-sm">
                  <Loader2 className="animate-spin text-indigo-400" size={28} />
                  <span>Fetching library...</span>
                </div>
              ) : searchedExistingVideos.length > 0 ? (
                searchedExistingVideos.map((video) => (
                  <div 
                    key={video._id}
                    className="flex items-center justify-between gap-4 p-2 bg-zinc-955 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all"
                  >
                    <div className="flex gap-3 items-center min-w-0">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-20 aspect-video rounded-lg object-cover bg-zinc-800 flex-shrink-0" 
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-zinc-200 truncate">{video.title}</span>
                        <span className="text-[9px] text-zinc-500 mt-0.5 truncate">
                          @{video.owner?.userName || 'creator'} • {video.views || 0} views
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddExistingVideo(video._id)}
                      className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] px-3.5 py-2 rounded-full transition-all flex-shrink-0 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Add</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  {existingSearchQuery ? "No matching videos found." : "No videos available to add."}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-zinc-850 pt-4 mt-4 flex-shrink-0">
              <button
                onClick={() => {
                  setIsExistingModalOpen(false);
                  setExistingSearchQuery('');
                }}
                className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 text-xs font-semibold px-5 py-2.5 rounded-full transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Add from Gallery */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Video size={20} className="text-indigo-400" />
                <h3 className="font-bold text-lg text-zinc-200">Upload Video & Add to Playlist</h3>
              </div>
              <button 
                onClick={() => !uploading && setIsGalleryModalOpen(false)}
                disabled={uploading}
                className="text-zinc-505 hover:text-zinc-300 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadAndAdd} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Video Title</label>
                <input
                  type="text"
                  placeholder="e.g. Setting up MongoDB"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                  disabled={uploading}
                  className="bg-zinc-955 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Description</label>
                <textarea
                  placeholder="Tell viewers what this video is about..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  required
                  rows={3}
                  disabled={uploading}
                  className="bg-zinc-955 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50"
                />
              </div>

              {/* Video Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Video File</label>
                <div className="relative border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setUploadVideoFile(e.target.files?.[0] || null)}
                    required
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Video className="text-indigo-400 mb-2 opacity-80" size={24} />
                  <span className="text-xs text-zinc-400 text-center font-medium max-w-[280px] truncate">
                    {uploadVideoFile ? uploadVideoFile.name : "Select video from gallery"}
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-1">MP4, WebM format recommended</span>
                </div>
              </div>

              {/* Thumbnail Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Thumbnail Image</label>
                <div className="relative border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadThumbnailFile(e.target.files?.[0] || null)}
                    required
                    disabled={uploading}
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <Image className="text-indigo-400 mb-2 opacity-80" size={24} />
                  <span className="text-xs text-zinc-400 text-center font-medium max-w-[280px] truncate">
                    {uploadThumbnailFile ? uploadThumbnailFile.name : "Select thumbnail image"}
                  </span>
                  <span className="text-[10px] text-zinc-550 mt-1">PNG, JPG format recommended</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 border-t border-zinc-850 pt-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  disabled={uploading}
                  className="text-zinc-450 hover:text-zinc-300 text-xs font-semibold px-5 py-2.5 disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-2.5 rounded-full shadow-lg shadow-indigo-600/10 disabled:opacity-40 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Publishing & Adding...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload & Add</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
