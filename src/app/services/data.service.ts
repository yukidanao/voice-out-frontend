import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject, of, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

export interface Song {
  source: string;
  trackId: string;
  title: string;
  artist: string;
  album?: string;
  artworkUrl?: string;
  previewUrl?: string;
  trackUrl?: string;
}

export interface GiphyGif {
  id: string;
  title: string;
  previewUrl: string;
  gifUrl: string;
}

interface ItunesSearchResponse {
  results: Array<{
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName?: string;
    artworkUrl100?: string;
    previewUrl?: string;
    trackViewUrl?: string;
  }>;
}

interface GiphyResponse {
  data: Array<{
    id: string;
    title: string;
    images: {
      original: { url: string };
      fixed_width_small?: { url: string };
    };
  }>;
}

interface GiphyRuntimeConfig {
  apiKey?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'https://voiceout-app.leelenardjose.workers.dev/api';
  private socket: WebSocket | null = null;
  private giphyApiKey: string | null | undefined;
  private giphyConfigRequest?: Observable<boolean>;
  public newVoiceOut$ = new Subject<any>();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // POST request to add a new voice out
  postVoiceOut(voiceOut: string, file?: File, song?: Song, gifUrl?: string): Observable<any> {
    const formData = new FormData();
    formData.append('voice_out', voiceOut);
    if (file) formData.append('file', file);
    if (song) formData.append('song', JSON.stringify(song));
    if (gifUrl) formData.append('gifUrl', gifUrl);
  
    return this.http.post(`${this.apiUrl}/postVoiceOut`, formData);
  }  

  hasGiphyApiKey(): boolean {
    return !!this.giphyApiKey;
  }

  loadGiphyConfig(): Observable<boolean> {
    if (this.giphyApiKey !== undefined) return of(this.hasGiphyApiKey());
    if (!isPlatformBrowser(this.platformId)) return of(false);
    if (this.giphyConfigRequest) return this.giphyConfigRequest;

    this.giphyConfigRequest = this.http.get<GiphyRuntimeConfig>('/config.json').pipe(
      map((config) => {
        this.giphyApiKey = config.apiKey?.trim() || null;
        this.giphyConfigRequest = undefined;
        return this.hasGiphyApiKey();
      }),
      catchError((error: unknown) => {
        this.giphyApiKey = null;
        this.giphyConfigRequest = undefined;
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    return this.giphyConfigRequest;
  }

  searchGifs(term: string, offset = 0, limit = 6): Observable<GiphyGif[]> {
    return this.requestGifs('search', { q: term, offset, limit });
  }

  getGifSuggestions(offset = 0, limit = 6): Observable<GiphyGif[]> {
    return this.requestGifs('trending', { offset, limit });
  }

  private requestGifs(
    endpoint: 'search' | 'trending',
    query: { q?: string; offset?: number; limit?: number } = {},
  ): Observable<GiphyGif[]> {
    const apiKey = this.giphyApiKey;
    if (!apiKey) {
      return throwError(() => new Error('GIPHY API key is not configured'));
    }

    return this.http
      .get<GiphyResponse>(`https://api.giphy.com/v1/gifs/${endpoint}`, {
        params: {
          api_key: apiKey,
          limit: String(query.limit ?? 6),
          offset: String(query.offset ?? 0),
          rating: 'g',
          ...(query.q ? { q: query.q } : {}),
        },
      })
      .pipe(
        map((response) =>
          response.data.map((gif) => ({
            id: gif.id,
            title: gif.title || 'GIPHY GIF',
            previewUrl: gif.images.fixed_width_small?.url || gif.images.original.url,
            gifUrl: gif.images.original.url,
          })),
        ),
      );
  }

  searchSongs(term: string, limit = 200): Observable<Song[]> {
    return this.requestSongs(term, limit);
  }

  getSongSuggestions(limit = 200): Observable<Song[]> {
    return this.requestSongs('popular songs', limit);
  }

  private requestSongs(term: string, limit: number): Observable<Song[]> {
    return this.http
      .get<ItunesSearchResponse>('https://itunes.apple.com/search', {
        params: { term, entity: 'song', limit: String(limit) },
      })
      .pipe(
        map((response) =>
          response.results.map((track) => ({
            source: 'itunes',
            trackId: String(track.trackId),
            title: track.trackName,
            artist: track.artistName,
            album: track.collectionName,
            artworkUrl: track.artworkUrl100?.replace('100x100', '300x300'),
            previewUrl: track.previewUrl,
            trackUrl: track.trackViewUrl,
          })),
        ),
      );
  }

  // GET request to fetch voice outs with pagination
  getVoiceOuts(page: number = 1, pageSize: number = 20): Observable<any> {
    const params = { page: page.toString(), pageSize: pageSize.toString() };
    return this.http.get<any>(`${this.apiUrl}/getVoiceOuts`, {
      params,
      transferCache: false,
    });
  }

  // DELETE request to delete a voice out by ID
  deleteVoiceOut(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteVoiceOut/${id}`);
  }

  // POST request to add feedback
  postInquiries(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/createFeedback`, data);
  }

  // Initialize WebSocket connection
  initWebSocket(): void {
    if (isPlatformBrowser(this.platformId) && !this.socket) {
      const socket = new WebSocket('wss://voiceout-app.leelenardjose.workers.dev');
      this.socket = socket;

      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'voice_out') {
          this.newVoiceOut$.next(message.data);
        }
      };

      socket.onclose = () => {
        if (this.socket === socket) this.socket = null;
        console.log('WebSocket connection closed');
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  }

  closeWebSocket(): void {
    this.socket?.close();
    this.socket = null;
  }
}