import { CustomBlockGetPageErrorInfo, NotionPage } from '@notionhq/custom-blocks';

type TrackPropertiesProps = {
  track: NotionPage | null;
  isLoading: boolean;
  error: CustomBlockGetPageErrorInfo | null;
};

export function TrackProperties({ track, isLoading, error }: TrackPropertiesProps) {
  if (error || !track) {
    return <p>Error: {track === null ? 'No track found' : error?.message}</p>;
  }

  if (isLoading) {
    return <p>Loading track properties...</p>;
  }

  console.log(track);
  console.log(track.properties);

  return <p>{track.toString()}</p>;
}
