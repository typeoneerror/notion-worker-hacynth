// FIXME: security rules prevent using the player

import { Track } from './Tracks';

type PlayerProps = {
  currentTrack: Track | undefined;
};

export function Player({ currentTrack }: PlayerProps) {
  const uri = currentTrack ? String(currentTrack.propertiesByKey.uri ?? '') : null;

  if (!uri) {
    return <p>No track available for player.</p>;
  }

  const src =
    'https://w.soundcloud.com/player/?url=' + encodeURIComponent(uri) + '&auto_play=false';

  return (
    <iframe
      title="SoundCloud player"
      width="100%"
      height="166"
      allow="autoplay"
      frameBorder="no"
      src={src}
    />
  );
}
