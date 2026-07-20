'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Library, ListMusic, Plus, FolderPlus } from 'lucide-react';
import Link from 'next/link';

export default function PlaylistsPage() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating playlist
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPlaylists = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.playlists.getUserPlaylists(user._id);
      if (response.success && response.data) {
        setPlaylists(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [user]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const response = await api.playlists.create(name, description);
      if (response.success && response.data) {
        setPlaylists(prev => [...prev, response.data]);
        setName('');
        setDescription('');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-panel max-w-md mx-auto">
        <Library size={36} className="text-zinc-600 mb-3" />
        <h3 className="font-bold text-lg text-zinc-200">Your Playlists</h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs px-4">Please sign in to view and manage collections of videos you want to watch together.</p>
        <Link href="/login" className="mt-4 bg-zinc-150 hover:bg-zinc-250 text-zinc-950 px-6 py-2.5 rounded-full text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Library size={24} className="text-indigo-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Playlists</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs px-4 py-2.5 rounded-full transition-all duration-200"
        >
          <Plus size={16} />
          <span>New Playlist</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-zinc-900/40 border border-zinc-900 animate-pulse"></div>
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <Link
              key={playlist._id}
              href={`/playlists/${playlist._id}`}
              className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 p-5 rounded-3xl flex flex-col justify-between group transition-all duration-300"
            >
              <div>
                <div className="bg-indigo-600/10 p-3 rounded-2xl w-fit text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                  <ListMusic size={24} />
                </div>
                <h3 className="font-bold text-zinc-200 mt-4 group-hover:text-indigo-400 transition-colors duration-200">
                  {playlist.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2 font-light">
                  {playlist.description || 'No description'}
                </p>
              </div>
              
              <div className="flex items-center justify-between border-t border-zinc-900 mt-6 pt-3 text-[10px] text-zinc-500">
                <span>{playlist.videos?.length || 0} videos</span>
                <span>View Playlist</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <ListMusic className="mx-auto mb-3 opacity-20" size={36} />
          <p>No playlists found. Create one to organize your videos!</p>
        </div>
      )}

      {/* Create Playlist Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-md shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <FolderPlus size={20} className="text-indigo-400" />
              <h3 className="font-bold text-lg text-zinc-200">Create New Playlist</h3>
            </div>
            
            <form onSubmit={handleCreatePlaylist} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Learning Web Development"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400 font-semibold">Description (Optional)</label>
                <textarea
                  placeholder="e.g. My study guide for learning JavaScript and nextjs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl py-2.5 px-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 border-t border-zinc-850 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-250 text-sm font-semibold px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-lg shadow-indigo-600/10 disabled:opacity-40"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
