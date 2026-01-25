import { TabType } from './constants';

export interface BlockedItem {
  title: string;
  artist: string;
}

export interface BlockedArtist {
  id?: string;
  name: string;
}

export type BlockList = (string | BlockedItem | BlockedArtist)[];

export enum MessageType {
  CHECK_SONG = 'CHECK_SONG',
  BLOCK_ARTIST = 'BLOCK_ARTIST',
  BLOCK_TRACK = 'BLOCK_TRACK',
  ADD_ITEM = 'ADD_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  REFRESH_AI_DB = 'REFRESH_AI_DB',
}

export interface CheckSongRequest {
  type: MessageType.CHECK_SONG;
  title: string;
  artistName: string;
  artistId: string | null;
}

export interface CheckSongResponse {
  shouldSkip: boolean;
  reason: string;
}

export interface BlockArtistRequest {
  type: MessageType.BLOCK_ARTIST;
  artistId?: string;
  artistName: string;
}

export interface BlockTrackRequest {
  type: MessageType.BLOCK_TRACK;
  title: string;
  artistName: string;
}

export interface AddItemRequest {
  type: MessageType.ADD_ITEM;
  list: TabType;
  payload: string | BlockedItem | BlockedArtist;
}

export interface RemoveItemRequest {
  type: MessageType.REMOVE_ITEM;
  list: TabType;
  payload: string | BlockedItem | BlockedArtist;
}

export interface RefreshAiDbRequest {
  type: MessageType.REFRESH_AI_DB;
}

export type Message = 
  | CheckSongRequest 
  | BlockArtistRequest 
  | BlockTrackRequest
  | AddItemRequest
  | RemoveItemRequest
  | RefreshAiDbRequest;
