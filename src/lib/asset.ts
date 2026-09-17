/* ------------------------------------------------------------------ *
 * Public-folder assets, resolved against wherever the site is served
 * from.
 *
 * The photographs and card artwork are written as root-absolute paths
 * in the data, which is right when the site owns its domain and wrong
 * on GitHub Pages, where it lives under /<repo>/. Vite hands the deploy
 * base to the bundle as BASE_URL, so every such path is put through
 * here rather than the data being rewritten for one host.
 * ------------------------------------------------------------------ */

export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
