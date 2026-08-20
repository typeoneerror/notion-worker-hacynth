import {
  useBlockId,
  useCurrentUser,
  useDataSource,
  usePage,
  useParent,
  useTheme,
} from '@notionhq/custom-blocks/react';

import {
  CustomBlockGetPageErrorInfo,
  NotionPage,
  NotionPageId,
  pages,
} from '@notionhq/custom-blocks';

import { useEffect, useState } from 'react';

import { Tracks } from './Tracks';
import { TrackProperties } from './TrackProperties';
import { describeParent } from './utils';

function usePageById(pageId: NotionPageId) {
  const [page, setPage] = useState<NotionPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<CustomBlockGetPageErrorInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const result = await pages.get(pageId);
      if (cancelled) return;

      if (result.status === 'error') {
        setError(result.error);
        setPage(null);
      } else {
        setError(null);
        setPage(result.page);
      }

      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [pageId]);

  return { page, isLoading, error };
}

export function App() {
  const me = useCurrentUser();
  const blockId = useBlockId();
  const page = usePage();
  const parent = describeParent(useParent());
  const theme = useTheme();

  const { items: tracks, isLoading, error } = useDataSource('tracks', { limit: 999 });
  const { page: track, isLoading: isTrackLoading, error: trackError } = usePageById(page.id);

  if (isLoading) {
    return (
      <div className="step">
        <span className="label">Tracks</span>
        <p>Loading track data...</p>
      </div>
    );
  }

  const currentTrack = tracks.find((track) => track.id === page.id);
  return (
    <main aria-labelledby="starter-title" data-display-mode={theme}>
      <section className="starter-card">
        <div className="starter-status">
          <span className="status-dot" aria-hidden="true" />
          Custom block
        </div>

        <div className="starter-heading">
          <span className="wave" aria-hidden="true">
            👋
          </span>
          <div>
            <h1 id="starter-title">Hello, {me.name}!</h1>
            <p>This is a basic custom block example.</p>
          </div>
        </div>

        <div className="step">
          <span className="label">Location</span>
          <p>
            You're viewing <em className="info">{blockId}</em> inside{' '}
            <em className="info">{page.id}</em>.
          </p>
        </div>

        <div className="step">
          <span className="label">Parent</span>
          <p>
            This block is parented by <em className="info">{parent.id}</em> which is a{' '}
            <em className="info">{parent.type}</em>.
          </p>
        </div>

        <div className="step">
          <span className="label">Tracks</span>
          <Tracks tracks={tracks} currentTrack={currentTrack} error={error} />
        </div>

        <div className="step">
          <span className="label">Track Properties</span>

          <TrackProperties track={track} isLoading={isTrackLoading} error={trackError} />
        </div>
      </section>
    </main>
  );
}
