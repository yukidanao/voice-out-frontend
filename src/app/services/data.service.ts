import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'https://voiceout-app.leelenardjose.workers.dev/api';
  private socket: WebSocket | null = null;
  public newVoiceOut$ = new Subject<any>();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initWebSocket();
    }
  }

  // POST request to add a new voice out
  postVoiceOut(voiceOut: string, file?: File, song?: Song): Observable<any> {
    const formData = new FormData();
    formData.append('voice_out', voiceOut);
    if (file) formData.append('file', file);
    if (song) formData.append('song', JSON.stringify(song));
  
    return this.http.post(`${this.apiUrl}/postVoiceOut`, formData);
  }  

  searchSongs(term: string): Observable<Song[]> {
    return this.requestSongs(term);
  }

  getSongSuggestions(): Observable<Song[]> {
    return this.requestSongs('popular songs');
  }

  private requestSongs(term: string): Observable<Song[]> {
    return this.http
      .get<ItunesSearchResponse>('https://itunes.apple.com/search', {
        params: { term, entity: 'song', limit: '8' },
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
    return this.http.get<any>(`${this.apiUrl}/getVoiceOuts`, { params });
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
    if (isPlatformBrowser(this.platformId)) {
      // Check if we're in the browser
      this.socket = new WebSocket('https://voiceout-app.leelenardjose.workers.dev');

      this.socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'voice_out') {
          this.newVoiceOut$.next(message.data);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket connection closed');
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  }
}