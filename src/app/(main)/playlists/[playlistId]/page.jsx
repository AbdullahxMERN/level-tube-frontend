'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { ListMusic, Trash2, Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function PlaylistDetailPage() {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="flex flex-col gap-6 pb-16 animate-fade-in">
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

          <div className="flex flex-col gap-2 mt-4 text-xs text-zinc-500 border-t border-zinc-900 pt-4">
            <p>Created by: <span className="text-zinc-300 font-medium">@{playlist.owner?.userName || 'creator'}</span></p>
            <p>{playlist.videos?.length || 0} Videos</p>
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
                {(!playlist.owner || playlist.owner._id === user?._id || playlist.owner === user?._id) && (
                  <button
                    onClick={() => handleRemoveVideo(video._id)}
                    className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-all mr-2"
                    title="Remove from playlist"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 glass-panel border-zinc-900 rounded-3xl text-zinc-500">
              <ListMusic className="mx-auto mb-3 opacity-20" size={36} />
              <p>This playlist has no videos. Search and add some!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
