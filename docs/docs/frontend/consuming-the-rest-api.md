# Consuming the REST API

With our Angular application up and running, let’s now extend the application to consume the REST controller API.^[<https://www.baeldung.com/spring-boot-angular-web>]

## Track model

1. Since our Angular application will fetch `Track` entities, implement a simple domain model with TypeScript.

    ```bash
    ng generate class models/track --type=model
    ```

2. Angular CLI will generate an empty `track.model.ts` and a `track.model.spec.ts`. Add parameters for the `title` , `uri`  and `artists` to the test.

    ```typescript{3}
    describe('Track', () => {
      it('should create an instance', () => {
        expect(new Track('title', 'uri', ['artist'])).toBeTruthy();
      });
    });
    ```

3. Run tests.

    ```bash
    ng test
    ```

4. Populate fields to the `Track` class.

    ```typescript
    export class Track {
      constructor(public title: string,
                  public uri: string,
                  public artists: string[]) {}
    }
    ```

5. Run tests.

    ```bash
    ng test
    ```

## Spotify Service

Implement a service class that performs GET requests to the `/api/playlists/tracks` endpoint.

This will allow us to encapsulate access to the REST controller in a single class, which we can reuse throughout the entire application.

1. Open a console terminal and issue the following command.

    ```bash
    ng generate service services/spotify
    ```

2. Open the `spotify.service.ts` file that Angular CLI just created and add some functionality:

    ```typescript
    import {Injectable} from '@angular/core';
    import {HttpClient} from '@angular/common/http';
    import {Observable} from 'rxjs';
    import {Track} from '../models/track.model';

    @Injectable({
      providedIn: 'root'
    })

    export class SpotifyService {

      private apiUrl: string;

      constructor(private http: HttpClient) {
        this.apiUrl = '/api';
      }

      public getTracksForPlaylist(): Observable<Track[]> {
        return this.http.get<Track[]>(`${this.apiUrl}/playlists/tracks`);
      }
    }
    ```

3. Add the api call to `spotify.service.spec.ts`.

    ```typescript
    import {TestBed} from '@angular/core/testing';
    import {SpotifyService} from './spotify.service';
    import {Track} from '../models/track.model';
    import {defer} from 'rxjs';
    import {HttpClient} from '@angular/common/http';

    describe('SpotifyService', () => {
      let httpClientSpy: { get: jasmine.Spy };
      let spotifyService: SpotifyService;

      beforeEach(() => {
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);
        TestBed.configureTestingModule({
          providers: [
            {provide: HttpClient, httpClientSpy}
          ]
        });
        spotifyService = new SpotifyService(<any>httpClientSpy);
      });

      it('should be created', () => {
        const service: SpotifyService = TestBed.get(SpotifyService);
        expect(service).toBeTruthy();
      });

      it('should return expected tracks (HttpClient called once)', () => {
        const expectedTracks: Track[] =
          [
            new Track("titleA","uriA", ['artistA']),
            new Track("titleB","uriB", ['artistB', 'artistC'])
          ];

        httpClientSpy.get.and.returnValue(asyncData(expectedTracks));

        spotifyService.getTracksForPlaylist().subscribe(
          tracks => expect(tracks).toEqual(expectedTracks, 'expected tracks'),
          fail
        );
        expect(httpClientSpy.get.calls.count()).toBe(1, 'one call');
      });

      function asyncData<T>(data: T) {
        return defer(() => Promise.resolve(data));
      }
    });
    ```

4. Run tests.

    ```bash
    ng test
    ```

## Playlist Component

1. Open a terminal console and generate a playlist component:

    ```bash
    ng generate component playlist
    ```

2. Implement the class so that it can take a `SpotifyService` instance in the constructor and uses the `SpotifyService getTracksForPlaylist()` method to fetch all tracks.

    ```typescript
    import {Component, OnInit} from '@angular/core';
    import {Track} from '../models/track.model';
    import {SpotifyService} from '../services/spotify.service';

    @Component({
      selector: 'app-playlist',
      templateUrl: './playlist.component.html',
      styleUrls: ['./playlist.component.css']
    })
    export class PlaylistComponent implements OnInit {

      tracks: Track[];

      constructor(private spotifyService: SpotifyService) {
      }

      ngOnInit() {
        this.spotifyService.getTracksForPlaylist().subscribe(tracks => {
          this.tracks = tracks;
        });
      }
    }
    ```

3. Additionally, we need to edit the component’s HTML file, `playlist.component.html`, to create the table that displays the list of entities.

    ```html
    <div class="container">
      <h2>Playlist</h2>
      <table class="table">
        <tr *ngFor="let track of tracks">
          <td>{{ track.title }}</td>
          <td>{{ track.artists }}</td>
        </tr>
      </table>
    </div>
    ```

4. Add Tests to `playlist.component.spec.ts`.

    ```typescript
    import {async, ComponentFixture, TestBed} from '@angular/core/testing';

    import {PlaylistComponent} from './playlist.component';
    import {Observable, of} from 'rxjs';
    import {Track} from '../models/track.model';
    import {SpotifyService} from '../services/spotify.service';

    describe('PlaylistComponent', () => {
      let component: PlaylistComponent;
      let fixture: ComponentFixture<PlaylistComponent>;
      let spotifyService: SpotifyService;

      beforeEach(async(() => {
        TestBed.configureTestingModule({
          declarations: [PlaylistComponent],
          providers: [
            PlaylistComponent,
            {provide: SpotifyService, useClass: MockSpotifyService}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlaylistComponent);
        component = TestBed.get(PlaylistComponent);
        spotifyService = TestBed.get(SpotifyService);
      }));

      it('should create', () => {
        expect(component).toBeTruthy();
      });

      it('should not have tracks message after construction', () => {
        expect(component.tracks).toBeUndefined();
      });

      it('should have tracks after Angular calls ngOnInit', () => {
        component.ngOnInit();
        spotifyService.getTracksForPlaylist().subscribe(
          tracks => expect(component.tracks).toEqual(tracks),
          fail
        );
      });

      it('should render title in a h2 tag', () => {
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;
        expect(compiled.querySelector('h2').textContent).toContain('Playlist');
      });

      it('should render title and artist', () => {
        fixture.detectChanges();
        const compiled = fixture.debugElement.nativeElement;

        let trs = compiled.querySelectorAll('tr');
        expect(trs.length).toBe(2);
        expect(trs[0].children[0].textContent).toBe('titleA');
        expect(trs[0].children[1].textContent).toBe('artistA');
        expect(trs[1].children[0].textContent).toBe('titleB');
        expect(trs[1].children[1].textContent).toBe('artistB,artistC');
      });

      class MockSpotifyService {
        public getTracksForPlaylist(): Observable<Track[]> {
          return of([
            new Track('titleA', 'uriA', ['artistA']),
            new Track('titleB', 'uriB', ['artistB', 'artistC'])
          ]);
        }
      }
    });

5. Run tests.

    ```bash
    ng test
    ```

## Application Component HTML

The `app.component.html` file allows us to define the root component’s HTML template.

```html{4}
<div class="container">
  <h1>
    Welcome to {{ title }}!
  </h1>
</div>
<app-playlist></app-playlist>
```

## Application Module

1. Next, we need to edit the `app.module.ts` file, so Angular can import all the required modules, components, and services.

    ```typescript{15}
    import {BrowserModule} from '@angular/platform-browser';
    import {NgModule} from '@angular/core';

    import {AppComponent} from './app.component';
    import {PlaylistComponent} from './playlist/playlist.component';
    import {HttpClientModule} from '@angular/common/http';

    @NgModule({
      declarations: [
        AppComponent,
        PlaylistComponent
      ],
      imports: [
        BrowserModule,
        HttpClientModule
      ],
      providers: [],
      bootstrap: [AppComponent]
    })
    export class AppModule { }
    ```

2. Add PlaylistComponent and HttpClientTestingModule to `app.component.spec.ts`.

    ```typescript{5,7}
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
            AppComponent,
            PlaylistComponent
          ],
          imports: [HttpClientTestingModule]
        }).compileComponents();
      }));
    ```

3. Run tests.

    ```bash
    ng test
    ```

## Proxy Configuration

Using the proxying support in webpack's dev server we can redirect the `/api` calls for local development.

1. We create a file next to our project's `package.json` called `proxy.conf.json` with the content.

    ```json
    {
      "/api/*": {
        "target": "http://localhost:8080",
        "secure": false,
        "logLevel": "debug",
        "changeOrigin": true
      }
    }
    ```

2. We then add the `proxyConfig` option to the serve target in `angular.json`.

    ```json{5}
    "serve": {
      ...
      "options": {
        "browserTarget": "ui:build",
        "proxyConfig": "./proxy.conf.json"
    },
    ```

## Bootstrap CSS

1. Install bootstrap for the project:

    ```bash
    npm install bootstrap-css-only
    ```

2. Add bootstrap to the application settings `angular.json`:

    ```json{4}
    "build": {
      ...
      "styles": [
        "node_modules/bootstrap-css-only/css/bootstrap.min.css",
        "src/styles.css"
      ],
    ```

::: tip EXERCISE

* Push your changes to Heroku and test the application.
* Create new component for header.
* Create new component in order to search tracks and to add them to the playlist.
  * Angular User Inputs: <https://angular.io/guide/user-input>
  * Bootstrap: <https://getbootstrap.com>

:::

::: warning

* In order to login you have to call `/api/login` manually in the browser.

:::