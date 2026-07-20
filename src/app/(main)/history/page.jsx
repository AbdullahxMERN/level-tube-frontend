'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { History, Film } from 'lucide-react';
import VideoCard from '@/components/VideoCard';
import Link from 'next/link';

export default function HistoryPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await api.auth.getWatchHistory();
        if (response.success && response.data) {
          setVideos(response.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-panel max-w-md mx-auto">
        <History size={36} className="text-zinc-600 mb-3" />
        <h3 className="font-bold text-lg text-zinc-200">History Private</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs px-4">Please sign in to keep track of videos you watch and resume playback.</p>
        <Link href="/login" className="mt-4 bg-zinc-150 hover:bg-zinc-250 text-zinc-950 px-6 py-2.5 rounded-full text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 animate-fade-in">
      <div className="flex items-center gap-3">
        <History size={24} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Watch History</h1>
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
          <p>No watched videos in history yet.</p>
        </div>
      )}
    </div>
  );
}
