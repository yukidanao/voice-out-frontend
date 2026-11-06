import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { DataService, PublicMessage } from './data.service';

describe('DataService', () => {
  let service: DataService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not use the hydration transfer cache for voice outs', () => {
    service.getVoiceOuts(2, 10).subscribe();

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'https://voiceout-app.leelenardjose.workers.dev/api/getVoiceOuts' &&
        req.params.get('page') === '2' &&
        req.params.get('pageSize') === '10',
    );

    expect(request.request.transferCache).toBe(false);
    request.flush({ voice_outs: [], totalPages: 0 });
  });

  it('should expose only the display fields from public messages', () => {
    let messages: PublicMessage[] = [];
    service.getPublicMessages().subscribe((result) => (messages = result));

    const request = httpTestingController.expectOne(
      'https://voiceout-app.leelenardjose.workers.dev/api/messages',
    );
    request.flush([
      {
        id: 'public-1',
        is_public: true,
        message: 'A dedication',
        song_title: 'Offer My Love',
        song_artist: 'Frost Children',
        song_album_art: 'https://i.scdn.co/image/art',
        spotify_url: 'https://open.spotify.com/track/1',
        recipient: 'not displayed',
        sender_name: 'not displayed',
      },
      {
        id: 'private-1',
        is_public: false,
        message: 'Private',
        song_title: 'Private song',
        song_artist: 'Private artist',
      },
    ]);

    expect(messages).toEqual([
      {
        id: 'public-1',
        message: 'A dedication',
        song: {
          title: 'Offer My Love',
          artist: 'Frost Children',
          albumArtUrl: 'https://i.scdn.co/image/art',
          spotifyUrl: 'https://open.spotify.com/track/1',
        },
      },
    ]);
  });

  it('should request up to the iTunes Search API result limit without an unsupported offset', () => {
    service.searchSongs('test song', 200).subscribe();

    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'https://itunes.apple.com/search' &&
        req.params.get('term') === 'test song' &&
        req.params.get('limit') === '200' &&
        !req.params.has('offset'),
    );
    request.flush({ results: [] });
  });

  it('should request GIF pages using the GIPHY offset', () => {
    service.loadGiphyConfig().subscribe();
    httpTestingController.expectOne('/config.json').flush({ apiKey: 'test-key' });

    service.getGifSuggestions(6, 6).subscribe();
    const request = httpTestingController.expectOne(
      (req) =>
        req.url === 'https://api.giphy.com/v1/gifs/trending' &&
        req.params.get('limit') === '6' &&
        req.params.get('offset') === '6',
    );
    request.flush({ data: [] });
  });

  afterEach(() => {
    httpTestingController.verify();
  });
});
