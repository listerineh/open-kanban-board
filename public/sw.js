if (!self.define) {
  let e,
    n = {};
  const i = (i, s) => (
    (i = new URL(i + '.js', s).href),
    n[i] ||
      new Promise((n) => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = i), (e.onload = n), document.head.appendChild(e));
        } else ((e = i), importScripts(i), n());
      }).then(() => {
        let e = n[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (s, r) => {
    const t = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (n[t]) return;
    let a = {};
    const c = (e) => i(e, t),
      u = { module: { uri: t }, exports: a, require: c };
    n[t] = Promise.all(s.map((e) => u[e] || c(e))).then((e) => (r(...e), a));
  };
}
define(['./workbox-f1770938'], function (e) {
  'use strict';
  (importScripts('/fallback-ce627215c0e4a9af.js'),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/static/chunks/17-48973cb53566a8f9.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/198-b05a45d643fde3e1.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/201-41ebc0a60198e2a0.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/23-b831dec6cd9d18af.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/285-499565cc06ca08b2.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/304-3b4f728b45fbf431.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/368-a73f69afda767129.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/405-daa5e6ed1a8f05ce.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/46-ba7658b10a458a95.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/4bd1b696-ed3e0210ad26854b.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/559-e5eff1c16b7176af.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/612-f14111ef5f6c78ab.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/648-344e7dac7ad56de1.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/721-17ae5a66b7635bb3.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/754-d5230683af7a1559.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/82-5342efdd6444351e.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/874-e487a1fef1ea83d6.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/95-0c13c8f08af1415d.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/app/_not-found/page-46ff384dbe59deca.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/app/error-c158bc0b904dc808.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/app/layout-0bdbb9e47f1624e6.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/app/login/page-f06a8095918ee375.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/app/not-found-2b7e10fc41687336.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        {
          url: '/_next/static/chunks/app/p/%5BprojectId%5D/config/page-b7e2abc06fdc7265.js',
          revision: 'iDAVSLnQRbhqWnAruS6xR',
        },
        {
          url: '/_next/static/chunks/app/p/%5BprojectId%5D/dashboard/page-891c0d490f30b731.js',
          revision: 'iDAVSLnQRbhqWnAruS6xR',
        },
        {
          url: '/_next/static/chunks/app/p/%5BprojectId%5D/page-9b06eb349edd8754.js',
          revision: 'iDAVSLnQRbhqWnAruS6xR',
        },
        { url: '/_next/static/chunks/app/page-a287e785bb97ed3a.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/bc9e92e6-fe6dbe8eb67f242f.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/ceb9e9aa-96bbb645bc0cbca2.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/framework-75d8b6119e7601c4.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/main-app-96ef1c8aee7da079.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/main-e0a26d51538a5823.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/pages/_app-8e94039938385921.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/pages/_error-7b2d139042a6a5ab.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/chunks/polyfills-42372ed130431b0a.js', revision: '846118c33b2c0e922d7b3a7676f81f6f' },
        { url: '/_next/static/chunks/webpack-ffdea594c4225f25.js', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/_next/static/css/eb715707169f50c3.css', revision: 'eb715707169f50c3' },
        { url: '/_next/static/iDAVSLnQRbhqWnAruS6xR/_buildManifest.js', revision: 'cb5c5296e7b3323ab39ce19212c483b6' },
        { url: '/_next/static/iDAVSLnQRbhqWnAruS6xR/_ssgManifest.js', revision: 'b6652df95db52feb4daf4eca35380933' },
        { url: '/_offline', revision: 'iDAVSLnQRbhqWnAruS6xR' },
        { url: '/fallback-ce627215c0e4a9af.js', revision: 'be3991d7cc5498fe99030b077292877c' },
        { url: '/icons/blue.svg', revision: '19737d4a8ecc9cf78969e3ef19a042f3' },
        { url: '/icons/default.svg', revision: 'dec4044564668f9d3413fe4763f4ab91' },
        { url: '/icons/orange.svg', revision: 'eb7ee50fd6f56d1de21108034824e0fd' },
        { url: '/icons/purple.svg', revision: 'ada705274d2b406fec01d367929f2492' },
        { url: '/icons/rose.svg', revision: 'b43f71f3d4b78fba91c325d2414ba49f' },
        { url: '/icons/zinc.svg', revision: '1af924af12dbe24f104e8a6b19f1b6f0' },
        { url: '/images/kanban_login_image.webp', revision: '7a8ecec66ba8e7535fd86a102d9ac531' },
        { url: '/images/website_screenshot.webp', revision: 'f7d32859ead8452ff6c920cd99299b4b' },
        { url: '/manifest.json', revision: 'efab1a3cc7e09c0247281999c53c2a4f' },
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
          i = e.url.pathname;
        return !(!n || i.startsWith('/api/auth/callback') || !i.startsWith('/api/'));
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
          i = e.url.pathname,
          s = e.sameOrigin;
        return (
          '1' === n.headers.get('RSC') && '1' === n.headers.get('Next-Router-Prefetch') && s && !i.startsWith('/api/')
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
          i = e.url.pathname,
          s = e.sameOrigin;
        return '1' === n.headers.get('RSC') && s && !i.startsWith('/api/');
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
