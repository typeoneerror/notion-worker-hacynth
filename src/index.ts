import { WebhookEvent, Worker } from '@notionhq/workers';
import * as Builder from '@notionhq/workers/builder';
import * as Schema from '@notionhq/workers/schema';
import { getProp, getPlainText } from './properties.js';
import {
  ACCESS_LEVELS,
  SOUNDCLOUD_API_BASE,
  SOUNDCLOUD_LIST_ARGS,
  formatArtworkUrl,
  formatDate,
  soundcloudFetch,
  soundcloudFetchAll,
  soundcloudFetchPage,
  SoundcloudResults,
  SoundcloudTrack,
} from './soundcloud.js';

const worker = new Worker();
export default worker;

/**
 * Authenticate with the Soundcloud (OAuth 2.1).
 */
const soundcloudAuth = worker.oauth('soundcloudAuth', {
  name: 'soundcloud-oauth',
  authorizationEndpoint: 'https://secure.soundcloud.com/authorize',
  tokenEndpoint: 'https://secure.soundcloud.com/oauth/token',
  scope: '',
  clientId: process.env.SOUNDCLOUD_CLIENT_ID ?? '',
  clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET ?? '',
});

/**
 * Defines the data source where tracks will be synced.
 */
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
      'Artwork URL': Schema.url(),

      Plays: Schema.number(),
      Favorites: Schema.number(),
      Comments: Schema.number(),
      Duration: Schema.number(),

      'Access Type': Schema.select(ACCESS_LEVELS.map((name) => ({ name, color: 'gray' as const }))),
      URI: Schema.url(),
      URN: Schema.richText(),
    },
  },
});

/**
 *  Returns upsert data to update a specific row in Notion with the track details.
 */
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
      'Artwork URL': Builder.url(t.artwork_url),
      Plays: Builder.number(t.playback_count ?? 0),
      Favorites: Builder.number(t.favoritings_count ?? 0),
      Comments: Builder.number(t.comment_count ?? 0),
      Duration: Builder.number(t.duration),
      'Access Type': Builder.select(t.access),
      URI: Builder.url(t.uri),
      URN: Builder.richText(t.urn),
    },
    icon: Builder.imageIcon(t.artwork_url),
    ...(cover ? { cover: Builder.imageCover(cover, 0) } : {}),
  };
}

/**
 * Rate-limit the Soundcloud requests.
 */
const soundcloudPacer = worker.pacer('soundcloudPacer', {
  allowedRequests: 5,
  intervalMs: 1000,
});

type BackfillState = { nextHref?: string | undefined };

/**
 * Sync the authenticated user's tracks daily (or on demand).
 */
worker.sync('tracksBackfill', {
  database: tracks,
  mode: 'replace',
  schedule: '1d',
  execute: async (state?: BackfillState) => {
    await soundcloudPacer.wait();
    const token = await soundcloudAuth.accessToken();
    const results = await soundcloudFetchPage<SoundcloudResults>(
      state?.nextHref || `${SOUNDCLOUD_API_BASE}/me/tracks?${SOUNDCLOUD_LIST_ARGS}`,
      token
    );
    const nextHref = results.next_href ?? undefined;

    return {
      changes: (results.collection ?? []).map(updateTrack),
      hasMore: Boolean(nextHref),
      nextState: nextHref ? { nextHref } : undefined,
    };
  },
});

const PLAYLIST_URN = 'soundcloud:playlists:2279036027';

type PlaylistAction = {
  includeTrack: Boolean;
  pageId: string;
  urn: string;
};

function verifyOnPlaylistNextCheckedWebhook(event: WebhookEvent): PlaylistAction | null {
  // FIXME: actually verify w/crypto

  if (typeof event !== 'object' || event === null) return null;

  const {
    body: { data },
  } = event;

  const { id: pageId, properties } = data as {
    id: string;
    properties: Record<string, object>;
  };

  if (typeof pageId !== 'string' || pageId.length === 0) return null;
  if (typeof properties !== 'object' || properties === null) return null;

  const props = properties as Record<string, unknown>;

  const urnProp = getProp(props, 'URN', 'rich_text');
  const nextProp = getProp(props, 'Next?', 'checkbox');
  if (!urnProp || !nextProp) return null;

  const urn = getPlainText(urnProp.rich_text);
  if (!urn.startsWith('soundcloud:tracks:')) return null;
  const includeTrack = nextProp.checkbox;

  return { includeTrack, pageId, urn };
}

async function updatePlaylist({ includeTrack, urn }: PlaylistAction) {
  const token = await soundcloudAuth.accessToken();

  // Fetch existing tracks
  const playlistUrl = `${SOUNDCLOUD_API_BASE}/playlists/${encodeURIComponent(PLAYLIST_URN)}`;
  const url = `${playlistUrl}/tracks?${SOUNDCLOUD_LIST_ARGS}`;
  const currentTracks = await soundcloudFetchAll<SoundcloudTrack>(url, token);

  // Build new tracks
  const urns = currentTracks.map((t) => t.urn);
  const updatedUrns = includeTrack ? [...urns, urn] : urns.filter((u) => u !== urn);
  const tracks = updatedUrns.map((urn) => ({ urn }));
  const body = JSON.stringify({
    playlist: {
      tracks,
    },
  });

  // FIXME: should probably handle this error
  await soundcloudFetch(playlistUrl, token, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playlist: {
        tracks,
      },
    }),
  });
}

/**
 * Webhook to add a specific track to the "Next" playlist.
 *
 * TODO: could just load state from Notion database instead.
 */
worker.webhook('onPlaylistNextChecked', {
  title: 'Add to "Next" playlist',
  description: 'Adds the requested track to the "Next" playlist',
  execute: async (events) => {
    for (const event of events) {
      const request = verifyOnPlaylistNextCheckedWebhook(event);

      if (!request) {
        throw new Error(`Unable to verify webhook delivery ${event.deliveryId}`);
      }

      await updatePlaylist(request);
    }
  },
});

worker.customBlock('Soundcloud', {
  path: './blocks/soundcloud',
  command: 'npx vite build',
  output: 'dist',
  version: 1,
  dataSources: {
    tracks: {
      name: 'Tracks',
      description: 'Soundcloud Tracks',
      properties: {
        title: {
          name: 'Title',
          description: 'The title of the song',
          type: 'title',
        },
        uri: {
          name: 'URI',
          description: 'The URI of the track reference on Soundcloud',
          type: 'url',
        },
        url: {
          name: 'URL',
          description: 'The URL to the track on Soundcloud',
          type: 'url',
        },
        artwork_url: {
          name: 'Artwork URL',
          description: "The URL to the track's artwork on Soundcloud",
          type: 'url',
        },
      },
    },
  },
});
