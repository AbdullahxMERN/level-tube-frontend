"use client";
import Link from "next/link";
import { Play } from "lucide-react";

export default function VideoCard({ video }) {
  return (
    <Link
      href={`/watch/${video._id}`}
      className="flex flex-col gap-2 rounded-2xl bg-zinc-900/40 border border-zinc-900 p-2.5 hover:border-zinc-700 transition-colors"
    >
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-800">
        {video.thumbnail ? (
          <img
            src={video.thumbnail.replace(
              "/upload/",
              "/upload/q_auto:best,f_auto/",
            )}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <Play size={32} />
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-1 px-1">
        <img
          src={video.owner?.avatar}
          alt={video.owner?.userName || "channel"}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-zinc-800"
        />
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <h3 className="font-semibold text-sm text-zinc-200 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-zinc-500 truncate">
            {video.owner?.fullName || video.owner?.userName}
          </p>
          <span className="text-xs text-zinc-600">{video.views} views</span>
        </div>
      </div>
    </Link>
  );
}
