export type StreamServerId =
  | '2embed'
  | 'vidsrc'
  | 'superembed'
  | 'peachify'
  | 'autoembed'
  | 'vidlink'
  | 'embedsu'
  | 'videasy'
  | 'smashystream'
  | 'vidking'
  | 'direct';

export interface StreamServerOption {
  id: StreamServerId;
  name: string;
  badge: string;
  description: string;
  hasHindi: boolean;
}

export const STREAM_SERVERS: StreamServerOption[] = [
  {
    id: '2embed',
    name: 'Server Epsilon (2Embed - Dual Audio)',
    badge: 'Multi-Stream',
    description: 'Dual Audio multi-stream server with instant Hindi audio playback',
    hasHindi: true,
  },
  {
    id: 'vidsrc',
    name: 'Server Beta (VidSrc - Dual Audio / 1080p)',
    badge: '1080p HD Dual Audio',
    description: 'Direct 1080p stream with dual audio channels and subtitles',
    hasHindi: true,
  },
  {
    id: 'superembed',
    name: 'Server Alpha (SuperEmbed - Hindi / Multi-Audio)',
    badge: '1080p / 4K Multi-Track',
    description: 'High-reliability embed server with native Hindi dubs and multi-track audio',
    hasHindi: true,
  },
  {
    id: 'peachify',
    name: 'Peachify VIP (Hindi Audio Dub)',
    badge: 'Hindi Dub VIP',
    description: 'Direct 1080p stream with native Hindi dual-audio dub support',
    hasHindi: true,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed 4K (Ultra Fast)',
    badge: 'Primary 4K',
    description: 'Fast 4K CDN with universal multi-stream auto-detection',
    hasHindi: true,
  },
  {
    id: 'vidlink',
    name: 'VidLink Ultra (Multi-Audio)',
    badge: 'Multi-Audio',
    description: 'Bufferless stream with integrated audio track switcher and subtitles',
    hasHindi: true,
  },
  {
    id: 'embedsu',
    name: 'Server Gamma (EmbedSu - Ultra HD)',
    badge: '1080p Ultra',
    description: 'Ultra HD high-bitrate multi-stream player',
    hasHindi: false,
  },
  {
    id: 'videasy',
    name: 'Videasy HD Stream',
    badge: 'Clean Player',
    description: 'Direct multi-source stream with clean player and subtitle support',
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
    name: 'VidKing 4K Ultra',
    badge: 'Ultra HD',
    description: 'High-bitrate server with auto-next episode and 4K capability',
    hasHindi: false,
  },
  {
    id: 'direct',
    name: 'Direct HTML5 Player',
    badge: '100% Up',
    description: 'Native HTML5 stream player with 100% bufferless playback',
    hasHindi: false,
  },
];
