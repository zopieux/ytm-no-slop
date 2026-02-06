import { Component, For, Show, createSignal, onCleanup } from 'solid-js';
import { HistoryItem, SkipReason, SkipSource } from '@/utils/types';
import { HISTORY_LIMIT } from '@/utils/constants';

interface HistoryListProps {
  items: HistoryItem[];
}

const formatTimeAgo = (timestamp: number, current: number) => {
  const diff = current - timestamp;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getSkipCount = (items: HistoryItem[], currentItem: HistoryItem) => {
  const key = `${currentItem.title}|${currentItem.artist}`;
  return items.filter((i) => `${i.title}|${i.artist}` === key).length;
};

const formatVerboseReason = (reason: SkipReason | string): string => {
  // Backward compatibility with the old format.
  if (typeof reason === 'string') {
    return reason;
  }
  const manually = reason.source === SkipSource.MANUAL ? ' (manually)' : '';
  switch (reason.type) {
    case 'matched_keyword':
      return `Blocked by keyword “${reason.keyword}”`;
    case 'matched_song':
      return `Blocked by song title “${reason.title}”${manually}`;
    case 'matched_artist':
      if (reason.artistId && reason.canonicalArtistId) {
        return `Blocked by artist “${reason.artistName}”${manually} (ID: ${reason.artistId}, canonical ID: ${reason.canonicalArtistId})`;
      } else if (reason.artistId) {
        return `Blocked by artist “${reason.artistName}”${manually} (ID: ${reason.artistId})`;
      } else {
        return `Blocked by artist “${reason.artistName}”${manually}`;
      }
  }
};

export const HistoryList: Component<HistoryListProps> = (props) => {
  const [now, setNow] = createSignal(Date.now());

  const timer = setInterval(() => {
    setNow(Date.now());
  }, 5000);

  onCleanup(() => clearInterval(timer));

  return (
    <ul id="list" class="history-list">
      <Show
        when={props.items.length > 0}
        fallback={
          <li class="empty">
            <img src="/sad-teddy.svg" class="empty-icon" alt="No content" />
            <span>No history yet.</span>
          </li>
        }
      >
        <div class="history-table">
          <For each={props.items}>
            {(item) => {
              const count = getSkipCount(props.items, item);
              return (
                <div class="history-row">
                  <div class="col-when" title={new Date(item.timestamp).toLocaleString()}>
                    {formatTimeAgo(item.timestamp, now())}
                  </div>
                  <div class="col-title" title={formatVerboseReason(item.reason)}>
                    {item.title} <span class="artist-dim">⋅ {item.artist}</span>
                  </div>
                  <div class="col-times">
                    <Show when={count > 1}>
                      <span title={`Skipped ${count} times over the last ${HISTORY_LIMIT} songs`}>
                        ×{count}
                      </span>
                    </Show>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </ul>
  );
};
