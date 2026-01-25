import { Component, For, Show } from 'solid-js';
import { BlockedItem, BlockedArtist } from '@/utils/types';
import { ReloadIcon, DeleteIcon, ExternalIcon } from './Icons';
import { TAB_AI_DB, TabType, TAB_KEYWORDS, TAB_SONGS, TAB_ARTISTS } from '@/utils/constants';

interface BlockListProps {
  items: (string | BlockedItem | BlockedArtist)[];
  currentTab: TabType;
  onDelete: (item: string | BlockedItem | BlockedArtist) => void;
  onReloadAI?: () => void;
  isLoading?: boolean;
  isReloadDisabled?: boolean;
}

const getDisplayText = (item: string | BlockedItem | BlockedArtist) => {
  if (typeof item === 'string') return item;
  if ('title' in item) return `${item.artist || 'Unknown'} - ${item.title}`;
  if ('name' in item) return item.name;
  return JSON.stringify(item);
};

const TAB_NAME_SINGULAR: Record<string, string> = {
  [TAB_KEYWORDS]: 'keyword',
  [TAB_SONGS]: 'song',
  [TAB_ARTISTS]: 'artist',
};

export const BlockList: Component<BlockListProps> = (props) => {
  return (
    <ul id="list">
      <Show when={props.currentTab === TAB_AI_DB}>
        <li class="ai-info">
          <div class="main-stats">
             <div class="count">{props.isLoading ? '...' : props.items.length}</div>
            <div class="label">AI Artists Blocked</div>
          </div>
          <button 
                class="action-btn reload-db" 
                onClick={props.onReloadAI}
                disabled={props.isLoading || props.isReloadDisabled}
          >
            <ReloadIcon /> Reload AI DB
          </button>
          <div class="source-links">
            <a href="https://souloverai.com" target="_blank">Soul Over AI</a> ⋅ 
            <a href="https://github.com/xoundbyte/soul-over-ai" target="_blank">GitHub</a> ⋅ 
            <a href="https://souloverai.com/add" target="_blank">Suggest new addition</a>
          </div>
        </li>
      </Show>

      <Show when={props.currentTab !== TAB_AI_DB}>
        <Show when={!props.isLoading} fallback={<li class="loading">Loading...</li>}>
          <Show when={props.items.length > 0} fallback={
            <li class="empty">
              <img src="/sad-teddy.svg" class="empty-icon" alt="No content" />
              <span>No {TAB_NAME_SINGULAR[props.currentTab]} yet.</span>
            </li>
          }>
            <For each={props.items}>
              {(item) => (
                <li>
                  <div class="item-info">
                    <Show 
                      when={typeof item === 'object' && 'id' in item && (item as BlockedArtist).id} 
                      fallback={<span>{getDisplayText(item)}</span>}
                    >
                       <a 
                          href={`https://music.youtube.com/channel/${(item as BlockedArtist).id}`} 
                          target="_blank" 
                          class="artist-link"
                       >
                          {getDisplayText(item)} <ExternalIcon />
                       </a>
                    </Show>
                  </div>
                  <button class="delete-btn" onClick={() => props.onDelete(item)} title="Delete">
                    <DeleteIcon />
                  </button>
                </li>
              )}
            </For>
          </Show>
        </Show>
      </Show>
    </ul>
  );
};
