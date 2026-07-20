"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/services/api";
import VideoCard from "@/components/VideoCard";
import { Film, Flame } from "lucide-react";

const CATEGORIES = [
  "All",
  "Sports",
  "Coding",
  "Nature",
  "Gaming",
  "Education",
  "Comedy",
  "Travel",
];

export default function HomePage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("query") || "";
  const tab = searchParams.get("tab") || "";
  const isTrending = tab === "trending";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function loadVideos() {
      setLoading(true);
      try {
        const response = await api.videos.getAll({
          query: searchQuery !== "" ? searchQuery : undefined,
        });
        if (response.success && response.data) {
          let list = response.data;

          if (selectedCategory !== "All") {
            list = list.filter(
              (video) =>
                video.title
                  .toLowerCase()
                  .includes(selectedCategory.toLowerCase()) ||
                video.description
                  .toLowerCase()
                  .includes(selectedCategory.toLowerCase()),
            );
          }

          // Trending tab: sort by view count, most-viewed first
          if (isTrending) {
            list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
          }

          setVideos(list);
        }
      } catch (err) {
        console.error("Failed to load videos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, [searchQuery, selectedCategory, isTrending]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      {/* Category Chips Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              selectedCategory === category
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {isTrending && (
        <div className="flex items-center gap-2 text-zinc-200 text-sm font-semibold">
          <Flame size={16} className="text-orange-400" />
          <span>Trending — sorted by most views</span>
        </div>
      )}

      {searchQuery && (
        <div className="text-zinc-400 text-sm">
          Search results for:{" "}
          <span className="text-indigo-400 font-semibold">"{searchQuery}"</span>
        </div>
      )}

      {/* Video Grid */}
      {loading ? (
        // Skeleton Loader
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl bg-zinc-900/40 border border-zinc-900 p-2.5 animate-pulse"
            >
              <div className="aspect-video w-full rounded-xl bg-zinc-800"></div>
              <div className="flex gap-3 mt-1">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0"></div>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-5/6 bg-zinc-800 rounded"></div>
                  <div className="h-3 w-1/2 bg-zinc-800 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel border border-zinc-900 rounded-3xl p-8 max-w-md mx-auto mt-8">
          <div className="p-4 bg-zinc-900/60 rounded-full text-zinc-600 mb-4 ring-4 ring-zinc-900/20">
            <Film size={36} />
          </div>
          <h3 className="font-bold text-lg text-zinc-200">No Videos Found</h3>
          <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
            We couldn't find any videos matching your search or filters. Try
            searching for other keywords or check back later!
          </p>
        </div>
      )}
    </div>
  );
}
