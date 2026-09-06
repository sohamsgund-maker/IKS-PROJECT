export type StreamServerId =
  | 'vidlink'
  | 'peachify'
  | '2embed'
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
    id: 'vidlink',
    name: '👑 VidLink VIP (Ultra Fast 4K • Ad-Free)',
    badge: '👑 VIP 4K Pro',
    description: 'VIP unlocked high-speed 4K bufferless player with multi-audio & instant subtitles',
    hasHindi: true,
  },
  {
    id: 'peachify',
    name: '👑 Peachify VIP (Hindi Audio Dub • 0 Ads)',
    badge: '👑 VIP Hindi Dub',
    description: 'Direct VIP 1080p high-bandwidth stream with native Hindi dual-audio support',
    hasHindi: true,
  },
  {
    id: '2embed',
    name: '👑 2Embed VIP (Multi-Stream Mirrors)',
    badge: '👑 VIP Mirror',
    description: 'High-speed Dual Audio multi-stream VIP server with instant playback',
    hasHindi: true,
  },
  {
    id: 'direct',
    name: '👑 Direct HTML5 VIP (100% Ad-Free Engine)',
    badge: '👑 100% Ad-Free',
    description: 'Pure HTML5 MP4 / HLS player with zero ads and bufferless playback',
    hasHindi: true,
  },
];

