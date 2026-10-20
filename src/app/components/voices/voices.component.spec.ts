import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { of, Subject } from 'rxjs';
import { DataService } from '../../services/data.service';
import { DialogService } from '../../services/dialog.service';

import { VoicesComponent } from './voices.component';

describe('VoicesComponent', () => {
  let component: VoicesComponent;
  let fixture: ComponentFixture<VoicesComponent>;
  let dataService: { newVoiceOut$: Subject<unknown>; getVoiceOuts: jasmine.Spy };

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
    };

    await TestBed.configureTestingModule({
      imports: [VoicesComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: DialogService, useValue: { openWrite: jasmine.createSpy('openWrite') } },
        { provide: HttpClient, useValue: { head: () => of({ status: 200 }) } },
        { provide: PLATFORM_ID, useValue: 'server' },
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
});
