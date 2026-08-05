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

export type SoundcloudPage<T> = {
  collection: T[];
  next_href?: string | undefined;
};

export type SoundcloudResults = SoundcloudPage<SoundcloudTrack>;

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

export async function soundcloudFetchPage<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
  });

  if (!response.ok) {
    // FIXME: add better error handling
    throw new Error(`SoundCloud [${response.status}]: ${await response.text()}`);
  }

  return (await response.json()) as T;
}

export async function soundcloudFetchAll<T>(url: string, token: string): Promise<T[]> {
  const items: T[] = [];
  let next: string | null = url;
  while (next) {
    const response: SoundcloudPage<T> = await soundcloudFetchPage(next, token);
    items.push(...(response.collection ?? []));
    next = response.next_href ?? null;
  }
  return items;
}
