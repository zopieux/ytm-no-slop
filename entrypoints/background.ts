import { BlockedItem as BlockedTrack, BlockedArtist, Message, CheckSongResponse, MessageType, BlockList } from '@/utils/types';
import { STORAGE_KEY_AUTO_SKIP, STORAGE_KEY_AI_DB, STORAGE_KEY_AI_DB_TIMESTAMP, CACHE_DURATION_MS, TAB_KEYWORDS, TAB_SONGS, STORAGE_KEY_KEYWORDS, STORAGE_KEY_SONGS, STORAGE_KEY_ARTISTS } from '@/utils/constants';

const GITHUB_URL = 'https://raw.githubusercontent.com/xoundbyte/soul-over-ai/refs/heads/main/dist/artists.json';

export default defineBackground(() => {
    let blockedKeywords: string[] = [];
    let blockedTracks: BlockedTrack[] = [];
    let blockedArtistIds: Set<string> = new Set();
    let blockedArtistNames: Set<string> = new Set();
    let isAutoSkipEnabled = true;

    async function updateBlockList() {
        console.log("Updating Block List in Background");
        blockedKeywords = await storage.getItem<string[]>(STORAGE_KEY_KEYWORDS) || [];
        blockedTracks = await storage.getItem<BlockedTrack[]>(STORAGE_KEY_SONGS) || [];
        const localArtists = await storage.getItem<BlockedArtist[]>(STORAGE_KEY_ARTISTS) || [];

        const cached = await storage.getItem<BlockedArtist[]>(STORAGE_KEY_AI_DB);
        const timestamp = await storage.getItem<number>(STORAGE_KEY_AI_DB_TIMESTAMP);
        const now = Date.now();

        let remoteIds = new Set<string>();
        if (cached && timestamp && Array.isArray(cached) && (now - timestamp < CACHE_DURATION_MS)) {
            remoteIds = new Set(cached.map(item => item.id).filter((id): id is string => id !== null));
        } else {
            remoteIds = await fetchAndCacheRemote();
        }

        blockedArtistIds = new Set([
            ...localArtists.filter(a => a.id).map(a => a.id as string),
            ...remoteIds
        ]);

        blockedArtistNames = new Set(
            localArtists.filter(a => !a.id).map(a => normalize(a.name))
        );
    }

    function getIconSet(name: string) {
        return {
            "16": `/${name}-16.png`,
            "32": `/${name}-32.png`,
            "48": `/${name}-48.png`,
            "96": `/${name}-96.png`,
            "128": `/${name}-128.png`
        };
    }

    async function updateIcon() {
        const setIcon = browser.action?.setIcon || browser.browserAction?.setIcon;
        if (setIcon) {
            await setIcon({
                path: isAutoSkipEnabled ? getIconSet("icon") : getIconSet("icon-gray")
            });
        }
    }

    async function blinkIcon() {
        if (!isAutoSkipEnabled) return;
        
        const setIcon = browser.action?.setIcon || browser.browserAction?.setIcon;
        if (!setIcon) return;

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
        const sequence = ["icon-empty", "icon", "icon-empty", "icon"];

        for (const name of sequence) {
            await setIcon({ path: getIconSet(name) });
            await delay(200);
        }
        
        await updateIcon();
    }

    async function fetchAndCacheRemote(): Promise<Set<string>> {
        const remoteIdsSet = new Set<string>();
        try {
            console.log("Fetching remote AI DB...");
            const response = await fetch(GITHUB_URL + `?t=${Date.now()}`); // busting cache
            if (response.ok) {
                const data = await response.json();
                const toCache: BlockedArtist[] = [];

                if (Array.isArray(data)) {
                    data.forEach((item: { youtube?: string, name?: string }) => {
                        if (item.youtube) {
                            remoteIdsSet.add(item.youtube);
                            toCache.push({ id: item.youtube, name: item.name || "Unknown artist name (AI DB)" });
                        }
                    });
                }

                await storage.setItem(STORAGE_KEY_AI_DB, toCache);
                await storage.setItem(STORAGE_KEY_AI_DB_TIMESTAMP, Date.now());
                console.log(`Fetched and cached ${toCache.length} artists from AI DB`);
                updateBlockList();
            } else {
                throw new Error("fetch() returned non-OK response");
            }
        } catch (e) {
            console.error("Failed to fetch remote list", e);
        }
        return remoteIdsSet;
    }

    function normalize(name: string): string {
        return name.trim().toLowerCase();
    }

    function checkSong(title: string, artistName: string, artistId: string | null): CheckSongResponse {
        if (!isAutoSkipEnabled) {
            return { shouldSkip: false, reason: "" };
        }

        if (artistId && blockedArtistIds.has(artistId)) {
            blinkIcon();
            return { shouldSkip: true, reason: `matched artist “${artistName}”` };
        }

        const checkString = normalize(artistName + " " + title);
        const matchedKeyword = blockedKeywords.find(term => checkString.includes(normalize(term)));
        if (matchedKeyword) {
            blinkIcon();
            return { shouldSkip: true, reason: `matched keyword “${matchedKeyword}”` };
        }

        const matchedTrack = blockedTracks.find(t =>
            normalize(t.title) === normalize(title) &&
            (t.artist === "" || normalize(artistName).includes(normalize(t.artist)))
        );
        if (matchedTrack) {
            blinkIcon();
            return { shouldSkip: true, reason: `matched track “${matchedTrack.title}”` };
        }

        if (blockedArtistNames.has(normalize(artistName))) {
            blinkIcon();
            return { shouldSkip: true, reason: `matched artist name “${artistName}”` };
        }

        return { shouldSkip: false, reason: "" };
    }

    const getDisplayText = (item: string | BlockedTrack | BlockedArtist) => {
        if (typeof item === 'string') return item;
        if ('title' in item) return `${item.artist || 'Unknown'} - ${item.title}`;
        if ('name' in item) return item.name;
        return JSON.stringify(item);
    };

    browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
        // We use an async wrapper to handle the message and return true to indicate we'll reply asynchronously.
        const handle = async () => {
            const msg = message as Message;
            switch (msg.type) {
                case MessageType.CHECK_SONG:
                    return checkSong(msg.title, msg.artistName, msg.artistId);

                case MessageType.REFRESH_AI_DB:
                    await fetchAndCacheRemote();
                    await updateBlockList();
                    return { success: true };

                case MessageType.ADD_ITEM: {
                    let key: `local:${string}`;
                    if (msg.list === TAB_KEYWORDS) key = STORAGE_KEY_KEYWORDS;
                    else if (msg.list === TAB_SONGS) key = STORAGE_KEY_SONGS;
                    else key = STORAGE_KEY_ARTISTS;

                    const current = await storage.getItem<BlockList>(key) || [];
                    const exists = current.some((i) => getDisplayText(i) === getDisplayText(msg.payload));
                    if (!exists) {
                        await storage.setItem(key, [...current, msg.payload]);
                    }
                    return { success: true };
                }

                case MessageType.REMOVE_ITEM: {
                    let key: `local:${string}`;
                    if (msg.list === TAB_KEYWORDS) key = STORAGE_KEY_KEYWORDS;
                    else if (msg.list === TAB_SONGS) key = STORAGE_KEY_SONGS;
                    else key = STORAGE_KEY_ARTISTS;

                    const current = await storage.getItem<BlockList>(key) || [];
                    const filtered = current.filter((i) => getDisplayText(i) !== getDisplayText(msg.payload));
                    await storage.setItem(key, filtered);
                    return { success: true };
                }

                case MessageType.BLOCK_ARTIST: {
                    const currentData = await storage.getItem<BlockedArtist[]>(STORAGE_KEY_ARTISTS) || [];
                    if (!currentData.some(a => a.id === msg.artistId)) {
                        await storage.setItem(STORAGE_KEY_ARTISTS, [...currentData, {
                            id: msg.artistId,
                            name: msg.artistName
                        }]);
                    }
                    return { success: true };
                }

                case MessageType.BLOCK_TRACK: {
                    const currentData = await storage.getItem<BlockedTrack[]>(STORAGE_KEY_SONGS) || [];
                    if (!currentData.some(t => t.title === msg.title)) {
                        await storage.setItem(STORAGE_KEY_SONGS, [...currentData, {
                            title: msg.title,
                            artist: msg.artistName
                        }]);
                    }
                    return { success: true };
                }
            }
        };

        handle().then(sendResponse);
        return true; // Keep channel open
    });

    (async () => {
        isAutoSkipEnabled = await storage.getItem<boolean>(STORAGE_KEY_AUTO_SKIP) ?? true;
        await updateBlockList();
        await updateIcon();

        const alarm = await browser.alarms.get('update-ai-db');
        if (!alarm) {
            await browser.alarms.create('update-ai-db', { periodInMinutes: 60 });
        }
    })();

    storage.watch(STORAGE_KEY_KEYWORDS, updateBlockList);
    storage.watch(STORAGE_KEY_ARTISTS, updateBlockList);
    storage.watch(STORAGE_KEY_SONGS, updateBlockList);
    storage.watch(STORAGE_KEY_AI_DB, updateBlockList);
    storage.watch(STORAGE_KEY_AUTO_SKIP, (newVal) => {
        isAutoSkipEnabled = typeof newVal === 'boolean' ? newVal : true;
        updateIcon();
    });

    browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name === 'update-ai-db') {
            console.log("Alarm triggered, checking ai db...");
            updateBlockList();
        }
    });
});
