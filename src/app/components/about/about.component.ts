import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TINTS, hashString } from '../../utils/tint';
import { IconComponent } from '../ui/icon/icon.component';

interface StackItem {
  name: string;
  logo: string;
  text: string;
  hue: number;
}

/** Spread the hues evenly around the wheel so the grid looks varied, not duplicated. */
const TINT_START = hashString('voiceout') % TINTS.length;

const STACK: Array<Omit<StackItem, 'hue'>> = [
  {
    name: 'MongoDB',
    logo: 'stack/mongodb.png',
    text: 'A NoSQL document database that stores data in a JSON-like format — built for flexibility and scale.',
  },
  {
    name: 'Express.js',
    logo: 'stack/express.png',
    text: 'A minimal Node.js framework that handles routing and middleware without getting in the way.',
  },
  {
    name: 'Angular',
    logo: 'stack/angular.png',
    text: 'A structured front-end framework with dependency injection, reactive forms and a powerful component model.',
  },
  {
    name: 'Node.js',
    logo: 'stack/node.png',
    text: 'A JavaScript runtime built on Chrome’s V8 engine, running the backend with non-blocking I/O.',
  },
  {
    name: 'WebSocket',
    logo: 'stack/websocket.png',
    text: 'Full-duplex communication over a single connection, so new voices appear on the wall instantly.',
  },
  {
    name: 'TailwindCSS',
    logo: 'stack/tailwind.png',
    text: 'A utility-first CSS framework for building custom interfaces directly in the markup.',
  },
];

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
})
export class AboutComponent {
  readonly stack: StackItem[] = STACK.map((item, index) => ({
    ...item,
    hue: TINTS[(TINT_START + index * 2) % TINTS.length],
  }));
}
