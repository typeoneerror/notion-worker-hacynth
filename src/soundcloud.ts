export const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';

export const ACCESS_LEVELS = ['playable', 'preview', 'blocked'] as const;
export type AccessType = (typeof ACCESS_LEVELS)[number];

export type SoundcloudTrack = {
  id: number;
  access: AccessType;
  artwork_url: string;
  comment_count: number;
  duration: number;
  favoritings_count: number;
  permalink_url: string;
  playback_count: number;
  release_year: number;
  release_month: number;
  release_day: number;
  title: string;
  uri: string;
  urn: string;
};

export type SoundcloudResults = {
  collection: SoundcloudTrack[];
  next_href?: string | undefined;
};

export function formatDate({
  release_year: y,
  release_month: m,
  release_day: d,
}: SoundcloudTrack): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

export function formatArtworkUrl(url: string | null, size = 't500x500'): string | null {
  return url ? url.replace('-large.', `-${size}.`) : null;
}
