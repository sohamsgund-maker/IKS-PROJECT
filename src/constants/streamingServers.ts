export type StreamServerId =
  | 'autoembed'
  | 'peachify'
  | 'vidlink'
  | 'videasy'
  | 'direct'
  | 'smashystream'
  | 'vidking';

export interface StreamServerOption {
  id: StreamServerId;
  name: string;
  badge: string;
  description: string;
  hasHindi: boolean;
}

export const STREAM_SERVERS: StreamServerOption[] = [
  {
    id: 'autoembed',
    name: 'AutoEmbed 4K (Ultra Fast & Clean)',
    badge: 'Primary 4K',
    description: 'Fast 4K universal CDN stream prioritizing Hindi audio without ads',
    hasHindi: true,
  },
  {
    id: 'peachify',
    name: 'Peachify VIP (Hindi Audio Dub)',
    badge: 'Hindi Dub VIP',
    description: 'Direct 1080p stream with native Hindi dual-audio track support',
    hasHindi: true,
  },
  {
    id: 'vidlink',
    name: 'VidLink Ultra (Multi-Audio)',
    badge: 'Multi-Audio VIP',
    description: 'Bufferless VIP stream with integrated audio track switcher and subtitles',
    hasHindi: true,
  },
  {
    id: 'videasy',
    name: 'Videasy HD Stream',
    badge: 'Clean Player',
    description: 'Direct multi-source stream with clean player and subtitle support',
    hasHindi: true,
  },
  {
    id: 'direct',
    name: 'Direct Media Player (HTML5)',
    badge: '100% Ad-Free',
    description: 'Pure HTML5 MP4 / HLS player with zero ads and bufferless playback',
    hasHindi: true,
  },
  {
    id: 'smashystream',
    name: 'SmashyStream Fast Mirror',
    badge: 'Fast Mirror',
    description: 'High-speed cloud mirror for global cinema and TV series',
    hasHindi: false,
  },
  {
    id: 'vidking',
    name: 'VidKing Ultra HD',
    badge: 'Ultra HD',
    description: 'High-bitrate server with auto-next episode and 4K capability',
    hasHindi: false,
  },
];
