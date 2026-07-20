'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { ThumbsUp, Film } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';

export default function LikedVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLikedVideos() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await api.likes.getLikedVideos();
        if (response.success && response.data) {
          setVideos(response.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadLikedVideos();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-panel max-w-md mx-auto">
        <ThumbsUp size={36} className="text-zinc-600 mb-3" />
        <h3 className="font-bold text-lg text-zinc-200">Liked Videos</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs px-4">Please sign in to keep track of all videos you've liked and want to replay.</p>
        <Link href="/login" className="mt-4 bg-zinc-150 hover:bg-zinc-250 text-zinc-950 px-6 py-2.5 rounded-full text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 animate-fade-in">
      <div className="flex items-center gap-3">
        <ThumbsUp size={24} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Liked Videos</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-60 rounded-2xl bg-zinc-900/40 border border-zinc-900 animate-pulse"></div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <Film className="mx-auto mb-3 opacity-20" size={36} />
          <p>No liked videos yet.</p>
        </div>
      )}
    </div>
  );
}
