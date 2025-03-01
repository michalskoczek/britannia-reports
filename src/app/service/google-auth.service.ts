import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { GoogleDriveService } from './google-drive.service';

declare const google: any;

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  constructor(private googleDriveService: GoogleDriveService) {}

  tokenClient: any;

  public gapiLoaded(): void {
    gapi.load('client', this.initializeGapiClient);
  }

  public async initializeGapiClient(): Promise<void> {
    await gapi.client.init({
      apiKey: environment.API_KEY,
      discoveryDocs: [environment.DISCOVERY_DOC],
    });
  }

  public gisLoaded(): void {
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: environment.web.client_id,
      scope: environment.SCOPES,
      callback: '',
    });
  }

  public handleAuthClick(file: File): void {
    this.tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        throw resp;
      }
      await this.googleDriveService.uploadFileToDrive(file);
    };

    if (gapi.client.getToken() === null) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      this.tokenClient.requestAccessToken({ prompt: '' });
    }
  }
}
