import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * pnpm monorepos: Expo static web emits a .pnpm bundle URL that Metro does not serve.
 * Patch script src assignment before the deferred entry bundle is requested.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#2d4a3e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/assets/favicon.png" type="image/png" sizes="32x32" />
        <title>Odyssey — Order</title>
        <ScrollViewStyleReset />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  function rewriteBundleSrc(value) {
    if (typeof value !== 'string') return value;
    if (!value.includes('.pnpm/') || !value.includes('entry.bundle')) return value;
    var qs = value.indexOf('?') >= 0 ? value.slice(value.indexOf('?')) : '';
    return '/node_modules/expo-router/entry.bundle' + qs;
  }
  var proto = HTMLScriptElement.prototype;
  var desc = Object.getOwnPropertyDescriptor(proto, 'src');
  if (desc && desc.set) {
    Object.defineProperty(proto, 'src', {
      get: desc.get,
      set: function (v) { desc.set.call(this, rewriteBundleSrc(v)); },
      configurable: true,
    });
  }
  var rawSetAttribute = proto.setAttribute;
  proto.setAttribute = function (name, value) {
    if (name === 'src') value = rewriteBundleSrc(value);
    return rawSetAttribute.call(this, name, value);
  };
})();
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
