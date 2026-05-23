export function assetUrl(relativePath: string): string {
  const normalized = relativePath.replace(/^\//, '');
  const base = import.meta.env.BASE_URL;
  return `${base}${normalized}`;
}
