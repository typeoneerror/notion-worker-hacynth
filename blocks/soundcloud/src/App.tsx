import {
  useBlockId,
  useCurrentUser,
  useDataSource,
  usePage,
  useParent,
  useTheme,
} from '@notionhq/custom-blocks/react';

import { Tracks } from './Tracks';
import { describeParent } from './utils';

export function App() {
  const me = useCurrentUser();
  const blockId = useBlockId();
  const page = usePage();
  const parent = describeParent(useParent());
  const theme = useTheme();

  const { items: tracks, isLoading, error } = useDataSource('tracks', { limit: 999 });

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
      </section>
    </main>
  );
}
