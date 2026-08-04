import { Worker } from '@notionhq/workers';
import * as Builder from '@notionhq/workers/builder';
import * as Schema from '@notionhq/workers/schema';
import {
  ACCESS_LEVELS,
  SOUNDCLOUD_API_BASE,
  formatArtworkUrl,
  formatDate,
  SoundcloudResults,
  SoundcloudTrack,
} from './soundcloud.js';

const worker = new Worker();
export default worker;

const soundcloudAuth = worker.oauth('soundcloudAuth', {
  name: 'soundcloud-oauth',
  authorizationEndpoint: 'https://secure.soundcloud.com/authorize',
  tokenEndpoint: 'https://secure.soundcloud.com/oauth/token',
  scope: '',
  clientId: process.env.SOUNDCLOUD_CLIENT_ID ?? '',
  clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET ?? '',
});

const tracks = worker.database('tracks', {
  type: 'managed',
  initialTitle: 'SC Tracks',
  primaryKeyProperty: 'ID',
  schema: {
    properties: {
      ID: Schema.richText(),
      Title: Schema.title(),
      'Release Date': Schema.date(),
      URL: Schema.url(),

      Plays: Schema.number(),
      Favorites: Schema.number(),
      Duration: Schema.number(),

      'Access Type': Schema.select(ACCESS_LEVELS.map((name) => ({ name, color: 'gray' as const }))),
      URI: Schema.url(),
      URN: Schema.richText(),
    },
  },
});

async function fetchTracks(
  url: string = `${SOUNDCLOUD_API_BASE}/me/tracks?limit=100&linked_partitioning=true`
): Promise<SoundcloudResults> {
  const token = await soundcloudAuth.accessToken();
  const response = await fetch(url, {
    headers: { Authorization: `OAuth ${token}` },
  });

  if (!response.ok) {
    // FIXME: add better error handling
    throw new Error(`SoundCloud [${response.status}]: ${await response.text()}`);
  }

  return (await response.json()) as SoundcloudResults;
}

function updateTrack(t: SoundcloudTrack) {
  const cover = formatArtworkUrl(t.artwork_url);
  return {
    type: 'upsert' as const,
    key: String(t.id),
    properties: {
      ID: Builder.richText(String(t.id)),
      Title: Builder.title(t.title),
      'Release Date': Builder.date(formatDate(t)),
      URL: Builder.url(t.permalink_url),
      Plays: Builder.number(t.playback_count ?? 0),
      Favorites: Builder.number(t.favoritings_count ?? 0),
      Duration: Builder.number(t.duration),
      'Access Type': Builder.select(t.access),
      URI: Builder.url(t.uri),
      URN: Builder.richText(t.urn),
    },
    icon: Builder.imageIcon(t.artwork_url),
    ...(cover ? { cover: Builder.imageCover(cover, 0) } : {}),
  };
}

const soundcloudPacer = worker.pacer('soundcloudPacer', {
  allowedRequests: 5,
  intervalMs: 1000,
});

type BackfillState = { nextHref?: string };

worker.sync('tracksBackfill', {
  database: tracks,
  mode: 'replace',
  schedule: '1d',
  execute: async (state?: BackfillState) => {
    await soundcloudPacer.wait();

    const results = await fetchTracks(state?.nextHref);
    const nextHref = results.next_href ?? undefined;

    return {
      changes: (results.collection ?? []).map(updateTrack),
      hasMore: Boolean(nextHref),
      nextState: nextHref ? { nextHref } : undefined,
    };
  },
});

worker.customBlock('custom', {
  path: './blocks/custom',
  command: 'npx vite build',
  output: 'dist',
  version: 1,
  dataSources: {},
});
