'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Camera, Film, ListMusic, MessageSquare, Info, ShieldAlert, Edit3, X } from 'lucide-react';
import VideoCard from '@/components/VideoCard';

export default function ChannelPage() {
  const { username } = useParams();
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth();
  
  const [channelUser, setChannelUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Channel Data states
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  const isOwner = currentUser && currentUser.userName === username;

  useEffect(() => {
    async function loadChannel() {
      setLoading(true);
      try {
        const response = await api.auth.getChannelDetails(username);
        if (response.success && response.data) {
          const profile = response.data;
          setChannelUser(profile);
          setSubscribersCount(profile.subscribersCount || 0);
          setIsSubscribed(profile.isSubscribed || false);

          // Load sub-resources
          const videosRes = await api.videos.getAll({ userId: profile._id });
          if (videosRes.success && videosRes.data) {
            // Filter videos belonging to this user
            setVideos(videosRes.data.filter(v => v.owner?._id === profile._id || v.owner === profile._id));
          }

          const playlistsRes = await api.playlists.getUserPlaylists(profile._id);
          if (playlistsRes.success && playlistsRes.data) {
            setPlaylists(playlistsRes.data);
          }

          const tweetsRes = await api.tweets.getUserTweets(profile._id);
          if (tweetsRes.success && tweetsRes.data) {
            setTweets(tweetsRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load channel:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChannel();
  }, [username]);

  const handleSubscribeToggle = async () => {
    if (!currentUser) return alert('Please sign in to subscribe');
    
    const nextSubscribed = !isSubscribed;
    setIsSubscribed(nextSubscribed);
    setSubscribersCount(prev => prev + (nextSubscribed ? 1 : -1));

    try {
      await api.subscriptions.toggle(channelUser._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await api.auth.changeAvatar(file);
      if (response.success && response.data) {
        setChannelUser(prev => ({ ...prev, avatar: response.data.avatar }));
        await refreshUser();
        alert('Avatar updated successfully!');
      }
    } catch (err) {
      alert('Failed to update avatar: ' + err.message);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await api.auth.changeCoverImage(file);
      if (response.success && response.data) {
        setChannelUser(prev => ({ ...prev, coverImage: response.data.coverImage }));
        await refreshUser();
        alert('Cover image updated successfully!');
      }
    } catch (err) {
      alert('Failed to update cover image: ' + err.message);
    }
  };

  const handleOpenEditModal = () => {
    setEditFullName(channelUser.fullName || '');
    setEditUserName(channelUser.userName || '');
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditError('');

    const trimmedName = editFullName.trim();
    const trimmedUsername = editUserName.trim().toLowerCase().replace(/\s+/g, '');

    if (!trimmedName) {
      setEditError('Full name is required');
      return;
    }
    if (!trimmedUsername) {
      setEditError('Username is required');
      return;
    }

    setEditSaving(true);
    try {
      const response = await api.auth.updateProfile(
        trimmedName,
        channelUser.email,
        trimmedUsername
      );

      if (response.success && response.data) {
        const updatedUser = response.data;
        await refreshUser();
        setIsEditModalOpen(false);

        if (updatedUser.userName && updatedUser.userName !== username) {
          router.push(`/channel/${updatedUser.userName}`);
        } else {
          setChannelUser(prev => ({
            ...prev,
            fullName: updatedUser.fullName,
            userName: updatedUser.userName
          }));
        }
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="w-full h-44 md:h-60 bg-zinc-900 rounded-3xl"></div>
        <div className="flex flex-col md:flex-row md:items-center gap-4 px-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-zinc-900 -mt-12 border-4 border-zinc-950"></div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-6 w-1/3 bg-zinc-900 rounded"></div>
            <div className="h-4 w-1/4 bg-zinc-900 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!channelUser) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-bold text-zinc-300">Channel not found</h3>
        <Link href="/" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Cover/Banner Image */}
      <div className="relative w-full h-44 md:h-64 rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-900 group">
        <img
          src={channelUser.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200'}
          alt="Channel Banner"
          className="w-full h-full object-cover"
        />
        {isOwner && (
          <label className="absolute bottom-4 right-4 bg-zinc-950/80 backdrop-blur-md hover:bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white p-2.5 rounded-full cursor-pointer transition-all duration-200 flex items-center gap-2 text-xs font-semibold shadow-lg">
            <Camera size={14} />
            <span>Edit Banner</span>
            <input type="file" onChange={handleCoverChange} className="hidden" accept="image/*" />
          </label>
        )}
      </div>

      {/* Profile Header Details */}
      <div className="flex flex-col md:flex-row md:items-center gap-5 px-4 md:px-6">
        {/* Avatar */}
        <div className="relative w-24 h-24 md:w-32 md:h-32 -mt-12 md:-mt-16 flex-shrink-0">
          <img
            src={channelUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
            alt={channelUser.fullName}
            className="w-full h-full rounded-full object-cover border-4 border-zinc-950 shadow-2xl bg-zinc-900"
          />
          {isOwner && (
            <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full cursor-pointer transition-colors duration-200 border border-zinc-950 shadow-md">
              <Camera size={14} />
              <input type="file" onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </label>
          )}
        </div>

        {/* Username/Stats & Subscribe Button */}
        <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">{channelUser.fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-zinc-400 font-light">
              <span>@{channelUser.userName}</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              <span>{subscribersCount} subscribers</span>
              <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
              <span>{channelUser.channelsSubscribedToCount || 0} subscribed</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwner ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenEditModal}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
                <Link
                  href="/dashboard"
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-semibold text-sm px-5 py-2.5 rounded-full transition-all duration-200"
                >
                  Customize Videos
                </Link>
              </div>
            ) : (
              <button
                onClick={handleSubscribeToggle}
                className={`font-semibold text-sm px-8 py-2.5 rounded-full transition-all duration-300 ${
                  isSubscribed
                    ? 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/10'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-zinc-900 mt-4">
        <div className="flex gap-6 overflow-x-auto px-4">
          {[
            { id: 'videos', label: 'Videos', icon: Film },
            { id: 'playlists', label: 'Playlists', icon: ListMusic },
            { id: 'tweets', label: 'Tweets', icon: MessageSquare },
            { id: 'about', label: 'About', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3.5 text-sm font-semibold border-b-2 transition-all duration-200 whitespace-nowrap focus:outline-none ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Content */}
      <div className="px-4">
        {activeTab === 'videos' && (
          <div>
            {videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-500">
                <Film className="mx-auto mb-3 opacity-20" size={36} />
                <p>This channel hasn't uploaded any videos yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            {playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {playlists.map((pl) => (
                  <div key={pl._id} className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between group hover:border-zinc-800 transition-colors">
                    <div>
                      <ListMusic className="text-indigo-400 mb-2" size={24} />
                      <h3 className="font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">{pl.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{pl.description}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 mt-4 block">{pl.videos?.length || 0} videos</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-zinc-500">
                <ListMusic className="mx-auto mb-3 opacity-20" size={36} />
                <p>This channel has no public playlists.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tweets' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            {tweets.length > 0 ? (
              tweets.map((tweet) => (
                <div key={tweet._id} className="glass-panel border border-zinc-900 p-5 rounded-2xl flex flex-col gap-3">
                  <div className="flex gap-3">
                    <img
                      src={channelUser.avatar}
                      alt={channelUser.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-800"
                    />
                    <div>
                      <p className="font-bold text-sm text-zinc-200">{channelUser.fullName}</p>
                      <p className="text-[10px] text-zinc-500">@{channelUser.userName} • {new Date(tweet.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 font-light leading-relaxed">{tweet.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-zinc-500">
                <MessageSquare className="mx-auto mb-3 opacity-20" size={36} />
                <p>This channel hasn't posted any tweets yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl mx-auto glass-panel border border-zinc-900 p-6 rounded-3xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="font-bold text-lg text-zinc-200">About the Creator</h3>
              {isOwner && (
                <button
                  onClick={handleOpenEditModal}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/20 transition-all"
                >
                  <Edit3 size={13} />
                  <span>Edit Details</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
              <div>
                <p className="text-zinc-500 text-xs">Name</p>
                <p className="text-zinc-200 font-medium">{channelUser.fullName}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Username</p>
                <p className="text-zinc-200 font-medium">@{channelUser.userName}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Email</p>
                <p className="text-zinc-200 font-medium">{channelUser.email || 'Private'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-xs">Verified User</p>
                <p className="text-green-400 font-semibold flex items-center gap-1">Yes</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Channel Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl max-w-md w-full shadow-2xl flex flex-col gap-5 relative">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                <Edit3 size={18} className="text-indigo-400" />
                Edit Channel Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-2xl flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Channel Name (Full Name)
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => {
                    setEditFullName(e.target.value);
                    if (editError) setEditError('');
                  }}
                  placeholder="Enter full name"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-sm text-zinc-500">@</span>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => {
                      setEditUserName(e.target.value);
                      if (editError) setEditError('');
                    }}
                    placeholder="username"
                    required
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Updating your username will change your channel handle and URL.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSaving}
                  className="px-5 py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
