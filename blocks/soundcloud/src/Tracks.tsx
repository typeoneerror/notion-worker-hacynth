import { CustomBlockQueryDataSourceErrorInfo } from '@notionhq/custom-blocks';
import { useDataSource } from '@notionhq/custom-blocks/react';

type Track = ReturnType<typeof useDataSource>['items'][number];

type TracksProps = {
  tracks: Track[];
  error: CustomBlockQueryDataSourceErrorInfo | undefined;
};

export function Tracks({ tracks, error }: TracksProps) {
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
      {sortedTracks.map((track) => (
        <li key={track.id}>{String(track.propertiesByKey.title ?? 'Untitled')}</li>
      ))}
    </ul>
  );
}
