import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { DataService, PublicMessage } from '../../services/data.service';
import { DialogService } from '../../services/dialog.service';

import { VoicesComponent } from './voices.component';

describe('VoicesComponent', () => {
  let component: VoicesComponent;
  let fixture: ComponentFixture<VoicesComponent>;
  let dataService: {
    newVoiceOut$: Subject<unknown>;
    getVoiceOuts: jasmine.Spy;
    getPublicMessages: jasmine.Spy;
    findSongPreview: jasmine.Spy;
    initWebSocket: jasmine.Spy;
    closeWebSocket: jasmine.Spy;
  };

  beforeEach(async () => {
    const pages = [
      { voice_outs: [{ _id: '1', voice_out: 'A note' }], totalPages: 3 },
      { voice_outs: [{ _id: '2', file: 'voice.mp3' }], totalPages: 3 },
      { voice_outs: [{ _id: '3', file: 'photo.jpg' }], totalPages: 3 },
    ];
    dataService = {
      newVoiceOut$: new Subject(),
      getVoiceOuts: jasmine.createSpy('getVoiceOuts').and.callFake((page: number) =>
        of(pages[page - 1]),
      ),
      getPublicMessages: jasmine.createSpy('getPublicMessages').and.returnValue(of([])),
      findSongPreview: jasmine.createSpy('findSongPreview').and.returnValue(of(undefined)),
      initWebSocket: jasmine.createSpy('initWebSocket'),
      closeWebSocket: jasmine.createSpy('closeWebSocket'),
    };

    await TestBed.configureTestingModule({
      imports: [VoicesComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: DialogService, useValue: { openWrite: jasmine.createSpy('openWrite') } },
        { provide: HttpClient, useValue: { head: () => of({ status: 200 }) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters loaded notes without automatically fetching every page', () => {
    component.setFilter('image');

    expect(dataService.getVoiceOuts).toHaveBeenCalledTimes(1);
    expect(component.filteredVoices).toEqual([]);
    expect(component.reachedEnd).toBeFalse();

    component.getVoices();

    expect(dataService.getVoiceOuts).toHaveBeenCalledWith(2, 20);
    expect(component.filteredVoices).toEqual([]);
  });

  it('mixes public dedications into the anonymous voice cards with a Spotify player URL', () => {
    const messages: PublicMessage[] = [
      {
        id: 'public-1',
        createdAt: '2026-11-06T06:21:55.246636+00:00',
        message: 'A song for you',
        song: {
          trackId: '5nU5Kwc8usRVobfvYwDq8i',
          title: 'Offer My Love',
          artist: 'Frost Children',
          albumArtUrl: 'https://i.scdn.co/image/art',
          spotifyUrl: 'https://open.spotify.com/track/5nU5Kwc8usRVobfvYwDq8i',
        },
      },
    ];
    dataService.getPublicMessages.and.returnValue(of(messages));
    dataService.findSongPreview.and.returnValue(of('https://audio.example/preview.mp3'));

    component.loadPublicMessages();

    const messageVoice = component.voices.find((voice) => voice.source === 'messages');
    expect(messageVoice?.voice_out).toBe('A song for you');
    expect(messageVoice?.song?.title).toBe('Offer My Love');
    expect(messageVoice?.song?.previewUrl).toBe('https://audio.example/preview.mp3');
    expect(messageVoice?.spotifyEmbedUrl).toBeTruthy();
    expect(messageVoice?._id).toBe('messages:public-1');
    expect(dataService.findSongPreview).toHaveBeenCalledWith('Offer My Love', 'Frost Children');
  });

  it('keeps the existing wall usable when the public messages endpoint fails', () => {
    dataService.getPublicMessages.and.returnValue(throwError(() => new Error('offline')));

    component.loadPublicMessages();

    expect(component.messagesLoadError).toBeTrue();
    expect(component.voices.some((voice) => voice.voice_out === 'A note')).toBeTrue();
  });
});
