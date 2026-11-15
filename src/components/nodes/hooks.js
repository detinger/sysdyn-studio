import useStore from '../../store';

/** Current solver value for an element at the playback cursor, if a run exists. */
export function usePlaybackValue(id) {
  return useStore((s) => {
    const series = s.run?.series?.[id];
    return series ? series[Math.min(s.playback.index, series.length - 1)] : undefined;
  });
}

/** Run is from an older model revision. */
export const useRunStale = () => useStore((s) => !!s.run && s.run.modelRevision !== s.revision);
