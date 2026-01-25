import { Component } from 'solid-js';
import { TAB_KEYWORDS, TAB_SONGS, TAB_ARTISTS, TAB_AI_DB, TabType } from '@/utils/constants';

interface TabsProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Tabs: Component<TabsProps> = (props) => {
  return (
    <div class="tabs">
      <button 
        class={`tab-btn ${props.currentTab === TAB_KEYWORDS ? 'active' : ''}`} 
        onClick={() => props.onTabChange(TAB_KEYWORDS)}
      >
        Keywords
      </button>
      <button 
        class={`tab-btn ${props.currentTab === TAB_SONGS ? 'active' : ''}`} 
        onClick={() => props.onTabChange(TAB_SONGS)}
      >
        Songs
      </button>
      <button 
        class={`tab-btn ${props.currentTab === TAB_ARTISTS ? 'active' : ''}`} 
        onClick={() => props.onTabChange(TAB_ARTISTS)}
      >
        Artists
      </button>
      <button 
        class={`tab-btn ${props.currentTab === TAB_AI_DB ? 'active' : ''}`} 
        onClick={() => props.onTabChange(TAB_AI_DB)}
      >
        AI DB
      </button>
    </div>
  );
};
