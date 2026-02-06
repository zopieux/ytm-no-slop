import { TabType } from './constants';

export interface BlockedSong {
  title: string;
  artist: string;
}

export interface BlockedArtist {
  id?: string;
  name: string;
}

export interface TabsProps {
  currentTab: TabType;
  onTabChange: (_tab: TabType) => void;
}

export interface HistoryItem {
  title: string;
  artist: string;
  timestamp: number;
  reason: SkipReason;
}

export type BlockList = (string | BlockedSong | BlockedArtist | HistoryItem)[];

export enum MessageType {
  CHECK_SONG = 'CHECK_SONG',
  BLOCK_ARTIST = 'BLOCK_ARTIST',
  BLOCK_SONG = 'BLOCK_SONG',
  ADD_ITEM = 'ADD_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  REFRESH_AI_DB = 'REFRESH_AI_DB',
}

export interface CheckSongRequest {
  type: MessageType.CHECK_SONG;
  title: string;
  artistName: string;
  artistId: string | null;
  canonicalArtistId: string | null;
}

export enum SkipSource {
  BLOCKLIST = 'blocklist',
  MANUAL = 'manual',
}

export interface MatchedKeyword {
  type: 'matched_keyword';
  keyword: string;
  source: SkipSource.BLOCKLIST; // Can't be manual.
}

export interface MatchedArtist {
  type: 'matched_artist';
  artistName: string;
  artistId?: string;
  canonicalArtistId?: string;
  source: SkipSource;
}

export interface MatchedSong {
  type: 'matched_song';
  title: string;
  artistName: string;
  source: SkipSource;
}

export type SkipReason = MatchedKeyword | MatchedArtist | MatchedSong;

export interface CheckSongResponse {
  reason?: SkipReason;
}

export interface BlockArtistRequest {
  type: MessageType.BLOCK_ARTIST;
  artistId?: string;
  artistName: string;
}

export interface BlockSongRequest {
  type: MessageType.BLOCK_SONG;
  title: string;
  artistName: string;
}

export interface AddItemRequest {
  type: MessageType.ADD_ITEM;
  list: TabType;
  payload: string | BlockedSong | BlockedArtist;
}

export interface RemoveItemRequest {
  type: MessageType.REMOVE_ITEM;
  list: TabType;
  payload: string | BlockedSong | BlockedArtist;
}

export interface RefreshAiDbRequest {
  type: MessageType.REFRESH_AI_DB;
}

export type Message =
  | CheckSongRequest
  | BlockArtistRequest
  | BlockSongRequest
  | AddItemRequest
  | RemoveItemRequest
  | RefreshAiDbRequest;
