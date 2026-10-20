import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, Subject } from 'rxjs';

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
  postVoiceOut(voiceOut: string, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('voice_out', voiceOut);
    if (file) formData.append('file', file);
  
    return this.http.post(`${this.apiUrl}/postVoiceOut`, formData);
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