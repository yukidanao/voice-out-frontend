# VoiceOut

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Cloudflare Pages deployment

Use `npm run build` as the build command and `dist/voice_out/browser` as the build output directory. The root URL redirects to the prerendered `/home` page.

## GIPHY GIF picker

The add-note dialog uses GIPHY's client-side Search and Trending endpoints. For Cloudflare Pages deployments, add `GIPHY_API_KEY` under **Settings → Variables and Secrets** for the production environment (and Preview too, if you want GIF search on preview deployments). The Pages Function at `/config.json` reads that runtime variable and supplies it to the browser app; no key needs to be committed or inserted into the Angular build. Locally, `public/config.json` provides an empty key so the app can run without repeatedly requesting a missing Pages Function.

The API key is necessarily visible to visitors because GIPHY requires its Search and Trending requests to come directly from the client. Use a GIPHY key intended for a web client. The picker requests six results at the `g` rating and displays GIPHY attribution. GIF media URLs are loaded directly from GIPHY as required by its [API guidelines](https://developers.giphy.com/docs/api/). GIPHY's guidelines also prohibit caching media URLs without approval; confirm that persisting `gifUrl` in the backend is acceptable for your integration before production.

See GIPHY's [Search endpoint](https://developers.giphy.com/docs/api/endpoint/search/) and [Trending endpoint](https://developers.giphy.com/docs/api/endpoint/trending/) documentation.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
"# voice-out-frontend" 
