/** Small helpers so preset files stay readable. */
export const media = (preset: string) =>
  (name: string, alt: string, extra: Record<string, unknown> = {}) => ({
    src: `/media/${preset}/${name}.webp`,
    alt,
    width: 1600,
    height: 1000,
    ...extra,
  });
