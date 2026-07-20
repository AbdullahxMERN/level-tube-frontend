"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { UserCheck, Users } from "lucide-react";
import Link from "next/link";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscriptions() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // getSubscribers(user._id) hits /subscriptions/u/:subscriberId,
        // which returns the channels THIS user has subscribed to
        // (each item is a subscription doc with a populated `channel` field)
        const response = await api.subscriptions.getSubscribers(user._id);
        if (response.success && response.data) {
          const channelList = response.data
            .map((sub) => sub.channel)
            .filter(Boolean);
          setChannels(channelList);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSubscriptions();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-panel max-w-md mx-auto">
        <UserCheck size={36} className="text-zinc-600 mb-3" />
        <h3 className="font-bold text-lg text-zinc-200">
          Manage Subscriptions
        </h3>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs px-4">
          Please sign in to view updates and new videos from your favorite
          creators.
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
    <div className="flex flex-col gap-6 pb-16 animate-fade-in">
      <div className="flex items-center gap-3">
        <UserCheck size={24} className="text-indigo-400" />
        <h1 className="text-2xl font-bold text-zinc-100">Subscriptions</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-zinc-900/40 border border-zinc-900 animate-pulse"
            ></div>
          ))}
        </div>
      ) : channels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <Link
              key={channel._id}
              href={`/channel/${channel.userName}`}
              className="flex items-center gap-4 bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 p-5 rounded-2xl group transition-all duration-300"
            >
              <img
                src={
                  channel.avatar ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
                }
                alt={channel.fullName}
                className="w-14 h-14 rounded-full object-cover border border-zinc-800 flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-zinc-100 group-hover:text-indigo-400 transition-colors truncate">
                  {channel.fullName}
                </span>
                <span className="text-xs text-zinc-500 truncate">
                  @{channel.userName}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-zinc-500">
          <Users className="mx-auto mb-3 opacity-20" size={36} />
          <p>You haven't subscribed to any channels yet.</p>
        </div>
      )}
    </div>
  );
}
