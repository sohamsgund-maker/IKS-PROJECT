export type StreamServerId =
  | '2embed'
  | 'peachify'
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
    badge: 'Multi-Stream (Primary)',
    description: 'High-speed Dual Audio multi-stream server with instant Hindi & multi-language playback',
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
    id: 'direct',
    name: 'Direct Media Player (HTML5)',
    badge: '100% Ad-Free',
    description: 'Pure HTML5 MP4 / HLS player with zero ads and bufferless playback',
    hasHindi: true,
  },
];

