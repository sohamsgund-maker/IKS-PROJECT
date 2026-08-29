import React, { useState } from 'react';
import { Radio, Play, Activity } from 'lucide-react';

interface LiveChannel {
  id: string;
  name: string;
  category: 'Sports' | 'News' | 'Movies' | 'Anime' | 'Entertainment';
  logo: string;
  streamUrl: string;
  country: string;
  viewers: string;
}

const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'ch_1',
    name: 'Red Bull TV HD',
    category: 'Sports',
    logo: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=300&q=80',
    streamUrl: 'https://d35j504z0x2vu2.cloudfront.net/v1/master/0bc8e8376ac8417a8c92a3073e2d7f4577bf64e6/RedBullTV-Live/master.m3u8',
    country: 'Global',
    viewers: '18.4K',
  },
  {
    id: 'ch_2',
    name: 'Anime 24/7 Live',
    category: 'Anime',
    logo: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    country: 'Japan',
    viewers: '24.9K',
  },
  {
    id: 'ch_3',
    name: 'Cinema World 4K',
    category: 'Movies',
    logo: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    country: 'USA',
    viewers: '31.2K',
  },
  {
    id: 'ch_4',
    name: 'Action Sports HD',
    category: 'Sports',
    logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    country: 'UK',
    viewers: '14.1K',
  },
  {
    id: 'ch_5',
    name: 'Global News 24',
    category: 'News',
    logo: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=300&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    country: 'Global',
    viewers: '42.8K',
  },
  {
    id: 'ch_6',
    name: 'Bollywood Music Hits',
    category: 'Entertainment',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    country: 'India',
    viewers: '19.5K',
  },
];

export const LiveTVPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeChannel, setActiveChannel] = useState<LiveChannel>(LIVE_CHANNELS[0]);

  const categories = ['All', 'Sports', 'Anime', 'Movies', 'Entertainment', 'News'];

  const filteredChannels = selectedCategory === 'All'
    ? LIVE_CHANNELS
    : LIVE_CHANNELS.filter(ch => ch.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-[#7c5cff] animate-pulse" />
            <span>Live TV & Broadcasts</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            24/7 Live Sports, Anime, News & Cinema Streams
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#7c5cff] text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/[0.05] text-zinc-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Active Live Video Stream Player */}
      <div className="rounded-3xl overflow-hidden bg-black border border-white/[0.1] shadow-2xl space-y-3 p-4">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#09090f]">
          <video
            key={activeChannel.id}
            src={activeChannel.streamUrl}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />

          {/* Live Indicator Pill */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/90 text-white font-extrabold text-xs shadow-lg backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>LIVE NOW</span>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 text-zinc-300 text-xs font-bold border border-white/10 backdrop-blur-md">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeChannel.viewers} Watching</span>
          </div>
        </div>

        {/* Channel Details Info Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1">
          <div className="flex items-center gap-3">
            <img
              src={activeChannel.logo}
              alt={activeChannel.name}
              className="w-10 h-10 rounded-xl object-cover border border-white/10"
            />
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {activeChannel.name}
              </h3>
              <p className="text-xs text-zinc-400">
                {activeChannel.category} • {activeChannel.country} Broadcast • 1080p 60FPS
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#7c5cff]/20 text-[#a28bff] text-xs font-bold border border-[#7c5cff]/30">
            Official Live Stream
          </span>
        </div>
      </div>

      {/* Available Channels Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
          Browse Live Channels ({filteredChannels.length})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredChannels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`group p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                activeChannel.id === channel.id
                  ? 'bg-[#7c5cff]/15 border-[#7c5cff] shadow-lg shadow-purple-500/20'
                  : 'bg-[#101018] border-white/[0.06] hover:border-white/[0.2] hover:bg-white/[0.04]'
              }`}
            >
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/40">
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white truncate leading-tight">
                  {channel.name}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                  <span>{channel.category}</span>
                  <span className="text-emerald-400 font-semibold">{channel.viewers}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
