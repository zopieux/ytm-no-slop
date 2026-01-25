import { Component, createSignal, createEffect, untrack, on } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';

import { Tabs } from './components/Tabs';
import { ControlPanel } from './components/ControlPanel';
import { BlockList } from './components/BlockList';
import { BlockedItem, BlockedArtist, AddItemRequest, RemoveItemRequest, RefreshAiDbRequest, MessageType, BlockList as BlockListType } from '@/utils/types';
import { ExportIcon, ImportIcon } from './components/Icons';
import { TAB_KEYWORDS, TAB_SONGS, TAB_ARTISTS, TAB_AI_DB, STORAGE_KEY_KEYWORDS, STORAGE_KEY_SONGS, STORAGE_KEY_ARTISTS, STORAGE_KEY_AI_DB, STORAGE_KEY_AUTO_SKIP, TabType } from '@/utils/constants';
import packageJson from '@/package.json';
import './style.sass';

const KEYS = {
  [TAB_KEYWORDS]: STORAGE_KEY_KEYWORDS,
  [TAB_SONGS]: STORAGE_KEY_SONGS,
  [TAB_ARTISTS]: STORAGE_KEY_ARTISTS,
} as const;

const App: Component = () => {
  const [currentTab, setCurrentTab] = createSignal<TabType>(TAB_KEYWORDS);
  const [store, setStore] = createStore<Record<TabType, BlockListType>>({
    [TAB_KEYWORDS]: [],
    [TAB_SONGS]: [],
    [TAB_ARTISTS]: [],
    [TAB_AI_DB]: []
  });
  const [isLoading, setIsLoading] = createSignal(false);
  const [autoSkip, setAutoSkip] = createSignal(true);

  const getDisplayText = (item: string | BlockedItem | BlockedArtist) => {
    if (typeof item === 'string') return item;
    if ('title' in item) return `${item.artist || 'Unknown'} - ${item.title}`;
    if ('name' in item) return item.name;
    return JSON.stringify(item);
  };

  const loadItems = async () => {
    const tab = untrack(currentTab);
    
    const hasCache = untrack(() => store[tab].length > 0);
    
    if (!hasCache) {
      setIsLoading(true);
    }

    let data: BlockListType;

    if (tab === TAB_AI_DB) {
      data = await storage.getItem<BlockedArtist[]>(STORAGE_KEY_AI_DB) || [];
    } else {
      const key = KEYS[tab] as `local:${string}`;
      data = await storage.getItem<BlockListType>(key) || [];
    }
      
    const sorted = [...data].sort((a, b) => {
      const textA = getDisplayText(a).toLowerCase();
      const textB = getDisplayText(b).toLowerCase();
      return textA.localeCompare(textB);
    });
    
    setStore(tab, sorted);
    setIsLoading(false);
  };

  const [hasReloaded, setHasReloaded] = createSignal(false);

  const handleReloadAI = async () => {
    setIsLoading(true);
    setHasReloaded(true);
    
    await browser.runtime.sendMessage({
      type: MessageType.REFRESH_AI_DB,
    } as RefreshAiDbRequest);

    await loadItems(); 
    setIsLoading(false);
  };

  const handleAdd = async (val: string) => {
    if (!val) return;
    const tab = currentTab();
    if (tab === TAB_AI_DB) return;

    let payload: string | BlockedItem | BlockedArtist;
    if (tab === TAB_ARTISTS) {
        payload = { name: val };
    } else if (tab === TAB_SONGS) {
        payload = { title: val, artist: "" };
    } else {
        payload = val;
    }

    await browser.runtime.sendMessage({
      type: MessageType.ADD_ITEM,
      list: tab,
      payload
    } as AddItemRequest);

    await loadItems();
  };

  const handleDelete = async (itemToRemove: string | BlockedItem | BlockedArtist) => {
    const tab = currentTab();
    if (tab === TAB_AI_DB) return;
    
    const payload = typeof itemToRemove === 'object' ? unwrap(itemToRemove) : itemToRemove;
    
    await browser.runtime.sendMessage({
      type: MessageType.REMOVE_ITEM,
      list: tab,
      payload
    } as RemoveItemRequest);

    await loadItems();
  };

  const handleExport = async () => {
    const data = {
      blockedKeywords: await storage.getItem(STORAGE_KEY_KEYWORDS) || [],
      blockedTracks: await storage.getItem(STORAGE_KEY_SONGS) || [],
      blockedArtists: await storage.getItem(STORAGE_KEY_ARTISTS) || [],
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ytm-noslop-backup.json';
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const data = JSON.parse(text);
          
          if (data.blockedKeywords) await storage.setItem(STORAGE_KEY_KEYWORDS, data.blockedKeywords);
          if (data.blockedArtists) await storage.setItem(STORAGE_KEY_ARTISTS, data.blockedArtists);
          if (data.blockedTracks) await storage.setItem(STORAGE_KEY_SONGS, data.blockedTracks);
          
          loadItems();
        } catch(err) {
          console.error("Invalid JSON File.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const toggleAutoSkip = async () => {
    const newVal = !autoSkip();
    setAutoSkip(newVal);
    await storage.setItem(STORAGE_KEY_AUTO_SKIP, newVal);
  };

  createEffect(on(currentTab, (tab) => {
    loadItems();
  }, { defer: false }));

  createEffect(async () => {
    const val = await storage.getItem<boolean>(STORAGE_KEY_AUTO_SKIP);
    if (val !== null) setAutoSkip(val);
  });
  
  // Watch for storage changes in real-
  storage.watch(STORAGE_KEY_KEYWORDS, () => {
    if (currentTab() === TAB_KEYWORDS) loadItems();
  });
  storage.watch(STORAGE_KEY_SONGS, () => {
    if (currentTab() === TAB_SONGS) loadItems();
  });
  storage.watch(STORAGE_KEY_ARTISTS, () => {
    if (currentTab() === TAB_ARTISTS) loadItems();
  });
  storage.watch(STORAGE_KEY_AI_DB, () => {
    if (currentTab() === TAB_AI_DB) loadItems();
  });
  storage.watch(STORAGE_KEY_AUTO_SKIP, (newVal) => {
    if (typeof newVal === 'boolean') setAutoSkip(newVal);
  });

  return (
    <>
      <div class="header">
        <h2>YTM No Slop <span class="version-tag">v{packageJson.version}</span></h2>
        <div class="auto-skip-wrapper">
          <span class="auto-skip-label">auto-skip</span>
          <label class="switch">
            <input type="checkbox" checked={autoSkip()} onChange={toggleAutoSkip} />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <Tabs currentTab={currentTab()} onTabChange={setCurrentTab} />

      <div class="content-wrapper">
        {currentTab() !== TAB_AI_DB && (
          <ControlPanel currentTab={currentTab()} onAdd={handleAdd} />
        )}

        <BlockList 
          items={store[currentTab()]} 
          currentTab={currentTab()} 
          onDelete={handleDelete}
          isLoading={isLoading()}
          onReloadAI={handleReloadAI}
          isReloadDisabled={hasReloaded()}
        />
      </div>

      <div class="actions">
        <button class="action-btn" onClick={handleExport}><ExportIcon /> Export JSON</button>
        <button class="action-btn" onClick={handleImport}><ImportIcon /> Import JSON</button>
      </div>
    </>
  );
};

export default App;
