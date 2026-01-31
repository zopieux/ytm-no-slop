import {
  CheckSongResponse,
  CheckSongRequest,
  BlockArtistRequest,
  BlockSongRequest,
  MessageType,
  HistoryItem,
} from '@/utils/types';
import { STORAGE_KEY_AUTO_SKIP, STORAGE_KEY_HISTORY, HISTORY_LIMIT } from '@/utils/constants';

let lastCheckedIdentifier = '';

function simulateClick(element: Element) {
  ['mousedown', 'mouseup', 'click'].forEach((eventType) => {
    element.dispatchEvent(
      new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
  });
}

function getSongInfo(): { title: string; artistName: string; artistId: string | null } | null {
  const titleEl = document.querySelector('ytmusic-player-bar .title');
  const bylineEl = document.querySelector('ytmusic-player-bar .byline');

  if (!titleEl || !bylineEl) return null;

  const title = titleEl.textContent?.trim() || '';
  let artistName = '';
  let artistId: string | null = null;

  const links = bylineEl.querySelectorAll('a[href*="channel/"]');
  if (links.length > 0) {
    // TODO: Handle multiple artists.
    const link = links[0];
    const href = link.getAttribute('href');
    if (href) {
      const match = href.match(/channel\/(UC[\w-]+)/);
      if (match) artistId = match[1];
    }
    artistName = link.textContent?.trim() || '';
  }

  if (!artistName) {
    const rawText = bylineEl.textContent?.trim() || '';
    const parts = rawText.split(' • ');
    if (parts.length > 0) {
      artistName = parts[0].trim();
    } else {
      artistName = rawText;
    }
  }

  return { title, artistName, artistId };
}

function injectToastStyles() {
  if (document.getElementById('ytm-no-slop-toast-styles')) return;
  const style = document.createElement('style');
  style.id = 'ytm-no-slop-toast-styles';
  style.textContent = `
        #ytm-no-slop-toast-container {
            position: fixed;
            bottom: 100px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            pointer-events: none;
        }
        .ytm-no-slop-toast {
            background: #1a1a1a;
            border-left: 4px solid #ff4444;
            color: #fff;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            font-family: 'Roboto', 'Arial', sans-serif;
            font-size: 14px;
            opacity: 0;
            transform: translateX(20px);
            transition: all 0.3s ease;
            max-width: 350px;
            pointer-events: auto;
        }
        .ytm-no-slop-toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        .ytm-no-slop-toast-reason {
            font-size: 12px;
            color: #aaa;
            margin-top: 4px;
        }
    `;
  document.head.appendChild(style);
}

function showToast(message: string, reason?: string) {
  let container = document.getElementById('ytm-no-slop-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'ytm-no-slop-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'ytm-no-slop-toast';

  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  toast.appendChild(messageEl);

  if (reason) {
    const reasonEl = document.createElement('div');
    reasonEl.className = 'ytm-no-slop-toast-reason';
    reasonEl.textContent = reason;
    toast.appendChild(reasonEl);
  }

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
      toast.remove();
    });
  }, 5000);
}

function skipSong(expectedTitle?: string) {
  if (expectedTitle) {
    const info = getSongInfo();
    if (!info || info.title !== expectedTitle) {
      console.log(
        `[YTM No Slop] Aborting skip: title mismatch. Expected "${expectedTitle}", found "${info?.title}"`,
      );
      return;
    }
  }

  const nextBtn = document.querySelector('ytmusic-player-bar .next-button');
  if (nextBtn) simulateClick(nextBtn);

  setTimeout(() => {
    // Double check we're still on the same song before nuclear option (seek to end)
    if (expectedTitle) {
      const info = getSongInfo();
      if (!info || info.title !== expectedTitle) return;
    }

    const video = document.querySelector('video');
    if (video && !video.ended) video.currentTime = video.duration || 99999;
  }, 500);
}

function addToHistory(title: string, artist: string, reason: string) {
  storage.getItem<HistoryItem[]>(STORAGE_KEY_HISTORY).then((history) => {
    const newHistory = history || [];
    newHistory.unshift({
      title,
      artist,
      timestamp: Date.now(),
      reason,
    });

    if (newHistory.length > HISTORY_LIMIT) {
      newHistory.length = HISTORY_LIMIT;
    }

    storage.setItem(STORAGE_KEY_HISTORY, newHistory);
  });
}

function performDownvoteAndSkip(songTitle: string, artistName: string, reason: string) {
  showToast(`Skipped “${songTitle}“`, reason);

  addToHistory(songTitle, artistName, reason);

  const dislikeWrapper =
    document.querySelector('.middle-controls-buttons .dislike') ||
    document.querySelector('ytmusic-player-bar .dislike');

  if (!dislikeWrapper) {
    skipSong(songTitle);
    return;
  }

  const actualBtn = dislikeWrapper.querySelector('button') || dislikeWrapper;
  const isPressed =
    dislikeWrapper.getAttribute('aria-pressed') === 'true' ||
    actualBtn.getAttribute('aria-pressed') === 'true';

  // If already disliked, we just need to skip manually since it's still playing
  if (isPressed) {
    skipSong(songTitle);
    return;
  }

  // Verify song before clicking dislike
  const info = getSongInfo();
  if (!info || info.title !== songTitle) {
    console.log('[YTM No Slop] Aborting dislike: Song changed.');
    return;
  }

  simulateClick(actualBtn);

  let attempts = 0;
  const poll = setInterval(() => {
    attempts++;
    const success =
      dislikeWrapper.getAttribute('aria-pressed') === 'true' ||
      actualBtn.getAttribute('aria-pressed') === 'true';

    if (success || attempts >= 20) {
      clearInterval(poll);
      if (success) {
        // If dislike succeeded, it should natively skip.
        // We wait a bit to see if it actually does.
        // If we are STILL on the same song after a delay, only then do we force skip.
        setTimeout(() => {
          const currentInfo = getSongInfo();
          if (currentInfo && currentInfo.title === songTitle) {
            skipSong(songTitle);
          }
        }, 1000);
      } else {
        // Dislike failed to register, force skip
        skipSong(songTitle);
      }
    }
  }, 100);
}

async function checkAndSkip() {
  const isAutoSkipEnabled = (await storage.getItem<boolean>(STORAGE_KEY_AUTO_SKIP)) ?? true;
  if (!isAutoSkipEnabled) return;

  const song = getSongInfo();
  if (!song) return;

  const identifier = `${song.artistId || song.artistName}|${song.title}`;
  if (identifier === lastCheckedIdentifier) return;
  lastCheckedIdentifier = identifier;

  try {
    const request = {
      type: MessageType.CHECK_SONG,
      title: song.title,
      artistName: song.artistName,
      artistId: song.artistId,
    } as CheckSongRequest;
    const response: CheckSongResponse = await browser.runtime.sendMessage(request);
    if (response.shouldSkip) {
      // If we actually skipped it, we record the title to prevent re-skipping
      // the next one if it has the same title but different metadata (unlikely but safe)
      performDownvoteAndSkip(song.title, song.artistName, response.reason);
    }
  } catch (e) {
    console.error('RPC Failed', e);
    // Reset identifier on failure so we can retry
    lastCheckedIdentifier = '';
  }
}

const BAN_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;

function createButton(text: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.innerHTML = `${BAN_ICON}<span>${text}</span>`;
  btn.style.cssText = `
        background: rgba(255, 68, 68, 0.15); 
        border: 1px solid rgba(255, 68, 68, 0.4); 
        color: #ff4444; 
        border-radius: 6px; 
        margin: 0 4px; 
        padding: 6px 10px; 
        cursor: pointer; 
        font-size: 11px; 
        font-weight: 700; 
        text-transform: uppercase; 
        z-index: 9999;
        display: inline-flex;
        align-items: center;
        transition: all 0.2s ease;
    `;
  btn.onmouseenter = () => {
    btn.style.background = '#ff4444';
    btn.style.color = 'white';
    btn.style.borderColor = '#ff4444';
  };
  btn.onmouseleave = () => {
    btn.style.background = 'rgba(255, 68, 68, 0.15)';
    btn.style.color = '#ff4444';
    btn.style.borderColor = 'rgba(255, 68, 68, 0.4)';
  };
  btn.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return btn;
}

function injectButtons() {
  if (document.getElementById('ytm-no-slop-controls')) return;

  const threeDots =
    document.querySelector('ytmusic-player-bar .middle-controls-buttons ytmusic-menu-renderer') ||
    document.querySelector('ytmusic-player-bar ytmusic-menu-renderer');

  const targetParent = threeDots
    ? threeDots.parentNode
    : document.querySelector('ytmusic-player-bar .middle-controls-buttons');

  if (targetParent) {
    const container = document.createElement('div');
    container.id = 'ytm-no-slop-controls';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.marginLeft = '8px';

    container.appendChild(
      createButton('Artist', async () => {
        const song = getSongInfo();
        if (song && song.artistId) {
          // Cleaner name check
          const bylineEl = document.querySelector('ytmusic-player-bar .byline');
          let cleanName = song.artistName;
          if (bylineEl) {
            const link = bylineEl.querySelector(`a[href*="${song.artistId}"]`);
            if (link && link.textContent) cleanName = link.textContent.trim();
          }

          await browser.runtime.sendMessage({
            type: MessageType.BLOCK_ARTIST,
            artistId: song.artistId,
            artistName: cleanName,
          } as BlockArtistRequest);

          performDownvoteAndSkip(song.title, song.artistName, 'Manual artist block');
        } else {
          console.warn('[YTM No Slop] No Artist ID found to block.');
        }
      }),
    );

    container.appendChild(
      createButton('Song', async () => {
        const song = getSongInfo();
        if (song) {
          await browser.runtime.sendMessage({
            type: MessageType.BLOCK_SONG,
            title: song.title,
            artistName: song.artistName,
          } as BlockSongRequest);

          performDownvoteAndSkip(song.title, song.artistName, 'Manual song block');
        }
      }),
    );

    if (threeDots && threeDots.nextSibling) {
      targetParent.insertBefore(container, threeDots.nextSibling);
    } else {
      targetParent.appendChild(container);
    }
  }
}

function init() {
  injectToastStyles();

  const playerBarObserver = new MutationObserver(() => {
    checkAndSkip();
    injectButtons();
  });

  const waitForPlayer = setInterval(() => {
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar) {
      clearInterval(waitForPlayer);
      injectButtons();
      checkAndSkip();
      playerBarObserver.observe(playerBar, { subtree: true, childList: true, attributes: true });

      const titleNode = document.querySelector('ytmusic-player-bar .title');
      if (titleNode) {
        new MutationObserver(() => checkAndSkip()).observe(titleNode, {
          characterData: true,
          subtree: true,
          childList: true,
        });
      }
    }
  }, 1000);
}

export default defineContentScript({
  matches: ['https://music.youtube.com/*'],
  main() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  },
});
