export const environment = {
  production: false,
  web: {
    client_id:
      '1039458477078-nv1lplc0u854rdujm9dc37jkfkei1k9s.apps.googleusercontent.com',
    project_id: 'britannia-reports',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_secret: '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',
    redirect_uris: [
      'http://localhost:4200',
      'https://britannia-reports.firebaseapp.com/__/auth/handler',
      'http://localhost:4200/callback',
    ],
    javascript_origins: ['http://localhost:4200', 'http://localhost:8000'],
  },
  API_KEY: 'AIzaSyATBmgGpE2CbIabJUJJd2T5-8RyJojWPh4',
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
  SCOPES: 'https://www.googleapis.com/auth/drive.metadata.readonly',
};
