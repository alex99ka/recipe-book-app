// Everything here is public by design and ships in the app: the Firebase web
// config identifies the project, and the API checks every request's ID token
// and allowlist itself. Never put a key or secret in this file.
export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyANlSA4Gsum9NHYrf6JoQ33OETsGERulG4',
    authDomain: 'alex-todo-shopping.firebaseapp.com',
    projectId: 'alex-todo-shopping',
    storageBucket: 'alex-todo-shopping.firebasestorage.app',
    messagingSenderId: '835092070723',
    appId: '1:835092070723:web:6f5112d1cdda788fad6ff6',
  },
  /** The recipe server's JSON API, published through Tailscale Funnel. */
  apiUrl: 'https://pi5-home-server-ts.tail4f470e.ts.net/api/v1',
  /** The web build, also where invite links will point. */
  appUrl: 'https://alex-recipe-book.web.app',
  /** Releases here carry the signed APK and the web bundle for in-app updates. */
  githubRepo: 'alex99ka/recipe-book-app',
};
