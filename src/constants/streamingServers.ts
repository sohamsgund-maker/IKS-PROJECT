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
    name: 'Server 1: VidLink (Ultra Fast 4K • Multi-Audio)',
    badge: 'Fastest 4K',
    description: 'Ultra high-speed bufferless player with multi-language audio & subtitles',
    hasHindi: true,
  },
  {
    id: 'peachify',
    name: 'Server 2: Peachify VIP (Hindi Audio Dub)',
    badge: 'Hindi Dub VIP',
    description: 'Direct 1080p stream with native Hindi dual-audio track support',
    hasHindi: true,
  },
  {
    id: '2embed',
    name: 'Server 3: 2Embed (Dual Audio Mirrors)',
    badge: 'Multi-Stream',
    description: 'High-speed Dual Audio multi-stream server with instant Hindi & multi-language playback',
    hasHindi: true,
  },
  {
    id: 'direct',
    name: 'Direct Media Player (HTML5)',
    badge: '100% Ad-Free',
    description: 'Pure HTML5 MP4 / HLS player with zero ads and bufferless playback',
    hasHindi: true,
  },
];

