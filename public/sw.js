if (!self.define) {
  let e,
    n = {};
  const s = (s, t) => (
    (s = new URL(s + '.js', t).href),
    n[s] ||
      new Promise((n) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = s), (e.onload = n), document.head.appendChild(e));
        } else ((e = s), importScripts(s), n());
      }).then(() => {
        let e = n[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (t, i) => {
    const c = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (n[c]) return;
    let r = {};
    const a = (e) => s(e, c),
      u = { module: { uri: c }, exports: r, require: a };
    n[c] = Promise.all(t.map((e) => u[e] || a(e))).then((e) => (i(...e), r));
  };
}
define(['./workbox-f1770938'], function (e) {
  'use strict';
  (importScripts('/fallback-ce627215c0e4a9af.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/static/ZgAHM-N9YhMVNClqvucYW/_buildManifest.js', revision: 'cb5c5296e7b3323ab39ce19212c483b6' },
        { url: '/_next/static/ZgAHM-N9YhMVNClqvucYW/_ssgManifest.js', revision: 'b6652df95db52feb4daf4eca35380933' },
        { url: '/_next/static/chunks/127-5df40aff96f4f7d7.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/17-e9acdaad6a267e1d.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/198-3a8d9132b43ac929.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/201-e3a415fc9c012829.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/285-72a15c3f94d1f8ae.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/304-e230414dc45bc032.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/368-1177917d0567cef0.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/38-2cad309f263872fd.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/46-32fd6a7645f3ef71.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/4bd1b696-e0d5191ff213b3d5.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/559-0538599067e64c77.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/612-3d5fafa97a3b560f.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/648-8e0a6b3df51a414b.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/649-e58f475ac15d7535.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/721-b225125040b6d47d.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/874-4e78e3f7d367c6c2.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/95-0c13c8f08af1415d.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/96-65a33d88f08b4384.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/app/_not-found/page-46ff384dbe59deca.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/app/error-a2a67e4ac9b99bc8.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/app/layout-777ec27069d2763e.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/app/login/page-65c5b054bc0107ea.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/app/not-found-937f36c338fe36ed.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        {
          url: '/_next/static/chunks/app/p/%5BprojectId%5D/config/page-fa8e782be45e22e8.js',
          revision: 'ZgAHM-N9YhMVNClqvucYW',
        },
        {
          url: '/_next/static/chunks/app/p/%5BprojectId%5D/dashboard/page-365faf5fffe57b03.js',
          revision: 'ZgAHM-N9YhMVNClqvucYW',
        },
        {
          url: '/_next/static/chunks/app/p/%5BprojectId%5D/page-62ad9c65ba63ca7f.js',
          revision: 'ZgAHM-N9YhMVNClqvucYW',
        },
        { url: '/_next/static/chunks/app/page-cf454450a668541e.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/bc9e92e6-6c4d298cb4da6e28.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/ceb9e9aa-96bbb645bc0cbca2.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/framework-75d8b6119e7601c4.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/main-app-96ef1c8aee7da079.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/main-e0a26d51538a5823.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/pages/_app-8e94039938385921.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/pages/_error-7b2d139042a6a5ab.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/chunks/polyfills-42372ed130431b0a.js', revision: '846118c33b2c0e922d7b3a7676f81f6f' },
        { url: '/_next/static/chunks/webpack-ffdea594c4225f25.js', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/_next/static/css/375a8243aa884f0d.css', revision: '375a8243aa884f0d' },
        { url: '/_offline', revision: 'ZgAHM-N9YhMVNClqvucYW' },
        { url: '/fallback-ce627215c0e4a9af.js', revision: 'be3991d7cc5498fe99030b077292877c' },
        { url: '/images/kanban_login_image.webp', revision: '7a8ecec66ba8e7535fd86a102d9ac531' },
        { url: '/images/website_screenshot.webp', revision: 'f7d32859ead8452ff6c920cd99299b4b' },
        { url: '/manifest.json', revision: 'abee09c449945f983fcdedfbeee0f30e' },
      ],
      { ignoreURLParametersMatching: [/^utm_/, /^fbclid$/] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: function (e) {
              return _ref.apply(this, arguments);
            },
          },
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/static.+\.js$/i,
      new e.CacheFirst({
        cacheName: 'next-static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp4|webm)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      function (e) {
        var n = e.sameOrigin,
          s = e.url.pathname;
        return !(!n || s.startsWith('/api/auth/callback') || !s.startsWith('/api/'));
      },
      new e.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      function (e) {
        var n = e.request,
          s = e.url.pathname,
          t = e.sameOrigin;
        return (
          '1' === n.headers.get('RSC') && '1' === n.headers.get('Next-Router-Prefetch') && t && !s.startsWith('/api/')
        );
      },
      new e.NetworkFirst({
        cacheName: 'pages-rsc-prefetch',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      function (e) {
        var n = e.request,
          s = e.url.pathname,
          t = e.sameOrigin;
        return '1' === n.headers.get('RSC') && t && !s.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'pages-rsc',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      function (e) {
        var n = e.url.pathname;
        return e.sameOrigin && !n.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'pages',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      function (e) {
        return !e.sameOrigin;
      },
      new e.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
          {
            handlerDidError: function (e) {
              return _ref.apply(this, arguments);
            },
          },
        ],
      }),
      'GET',
    ));
});
