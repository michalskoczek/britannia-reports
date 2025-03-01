import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, EMPTY, Observable, take } from 'rxjs';
import { environment } from '../../environment/environment';
import { GoogleDriveFileMetadata } from '../model/googleDriveFileMetadata.interface';

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveService {
  constructor(private http: HttpClient) {}

  private apiUrl: string = `${environment.googleApiUrl}/upload/drive/v3/files?uploadType=multipart`;

  async uploadFileToDrive(file: File) {
    this.uploadFile(file)
      .pipe(
        take(1),
        catchError((err: any) => {
          console.error(err);
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

  // createFolder(): void {
  //   let headers = new HttpHeaders();
  //   headers = headers.set(
  //     'Authorization',
  //     `Bearer ${gapi.auth.getToken().access_token}`
  //   );
  //
  //   this.http
  //     .post(
  //       'https://www.googleapis.com/drive/v3/files',
  //       {
  //         name: 'My Folder',
  //         //to create a folder this must be included
  //         mimeType: 'application/vnd.google-apps.folder',
  //         //
  //       },
  //       { headers, observe: 'response' }
  //     )
  //     .subscribe((result) => {
  //       console.log(result);
  //     });
  // }

  //  uploadFile(file: File): Observable<any> {
  //   const token = gapi.auth.getToken().access_token;
  //   console.log(token);
  //   if (!token) {
  //     throw new Error('Użytkownik nie jest zalogowany');
  //   }
  //
  //   // Przygotowanie metadanych pliku
  //   const metadata = {
  //     name: file.name,
  //     mimeType: file.type,
  //     parents: ['1s_lfXWRAkmnZBkeSQwXHDwE_fmWAqCmn'],
  //   };
  //   console.log(metadata);
  //   // Tworzymy form data z metadanymi i plikiem
  //   const formData = new FormData();
  //   formData.append(
  //     'metadata',
  //     new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  //   );
  //   formData.append('file', file);
  //
  //   // Nagłówki żądania
  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //   });
  //   console.log(formData);
  //   console.log(headers);
  //
  //   // Wykonujemy żądanie POST do Google Drive API
  //   return this.http.post(
  //     `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
  //     formData,
  //     { headers }
  //   );
  // }

  // getFolders(): Observable<any> {
  //   const token = gapi.auth.getToken().access_token;
  //   const headers = new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //   });
  //
  //   // const files = gapi.client.drive.files.list({
  //   //   access_token: token,
  //   //   pageSize: 10,
  //   //   fields: 'files(id, name)',
  //   // });
  //   //
  //   // console.log(files);
  //
  //   return this.http.get(
  //     `https://www.googleapis.com/drive/v3//files?q=mimeType='application/vnd.google-apps.folder'`,
  //     {
  //       headers,
  //     }
  //   );
  // }

  // listFiles(): void {
  // let response;
  // try {
  //   response = await gapi.client.drive.files.list({
  //     pageSize: 30,
  //     fields: 'files(id, name)',
  //   });
  // } catch (err) {
  //   console.log(err);
  //   return;
  // }
  // const files: any = response.result.files;
  // if (!files || files.length == 0) {
  //   console.log('no files found');
  //   return;
  // }
  // // Flatten to string to display
  // const output = files.reduce(
  //   (str: any, file: any) => `${str}${file.name} (${file.id})\n`,
  //   'Files:\n'
  // );
  // console.log(output);
  // }
}
