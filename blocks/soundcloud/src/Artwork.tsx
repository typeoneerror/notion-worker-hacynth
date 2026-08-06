import { Track } from './Tracks';

type PlayerProps = {
  currentTrack: Track | undefined;
};

function formatArtworkUrl(url: string, size = 't500x500'): string {
  return url.replace('-large.', `-${size}.`);
}

export function Artwork({ currentTrack }: PlayerProps) {
  const artworkUrl = currentTrack ? String(currentTrack.propertiesByKey.artwork_url ?? '') : null;

  if (!artworkUrl) {
    return <p>No artwork available for track.</p>;
  }

  return <img className="artwork" src={formatArtworkUrl(artworkUrl)} />;
}
