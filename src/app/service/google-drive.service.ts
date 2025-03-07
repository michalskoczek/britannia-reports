import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, EMPTY, Observable, take, tap } from 'rxjs';
import { environment } from '../../environment/environment';
import { GoogleDriveFileMetadata } from '../model/google-drive-file-metadata.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleDriveResponseInterface } from '../model/google-drive-response.interface';

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveService {
  constructor(private http: HttpClient, private snackbar: MatSnackBar) {}

  private apiUrl: string = `${environment.googleApiUrl}/upload/drive/v3/files?uploadType=multipart`;

  async uploadFileToDrive(file: File) {
    this.uploadFile(file)
      .pipe(
        take(1),
        tap((response: GoogleDriveResponseInterface) => {
          this.snackbar.open(`Plik ${response.name}.pdf został wysłany`, 'OK');
        }),
        catchError(() => {
          this.snackbar.open('Wystąpił błąd! Spróbuj ponownie.', 'OK');
          return EMPTY;
        })
      )
      .subscribe();
  }

  private uploadFile(file: File): Observable<any> {
    const token = gapi.auth.getToken().access_token;

    if (!token) {
      throw new Error('Użytkownik nie jest zalogowany');
    }

    const metadata: GoogleDriveFileMetadata = {
      name: file.name,
      mimeType: file.type,
      parents: [environment.googleDriveFolderId],
    };

    const formData: FormData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', file);

    const headers: HttpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(this.apiUrl, formData, { headers });
  }
}
