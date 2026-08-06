import { CustomBlockQueryDataSourceErrorInfo } from '@notionhq/custom-blocks';
import { useDataSource } from '@notionhq/custom-blocks/react';

export type Track = ReturnType<typeof useDataSource>['items'][number];

type TracksProps = {
  currentTrack: Track | undefined;
  error: CustomBlockQueryDataSourceErrorInfo | undefined;
  tracks: Track[];
};

export function Tracks({ currentTrack, tracks, error }: TracksProps) {
  if (tracks.length === 0) {
    return <p>No tracks found.</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  const sortedTracks = tracks.sort((a, b) =>
    String(a.propertiesByKey.title ?? '').localeCompare(
      String(b.propertiesByKey.title ?? ''),
      undefined,
      { sensitivity: 'base', numeric: true }
    )
  );

  return (
    <ul>
      {sortedTracks.map((track) => {
        const isSelected = track.id === currentTrack.id;
        const className = isSelected ? 'selected' : undefined;
        const title = String(track.propertiesByKey.title ?? 'Untitled');
        return (
          <li className={className} key={track.id}>
            {title}
            {isSelected && (
              <>
                {' '}
                <span className="selected">← Selected</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
