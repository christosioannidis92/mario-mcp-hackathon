import type { TileType, EnemyType } from "./types";

// Engine consumes pre-loaded images. Caller (demo/) owns paths and loading.
// All fields optional → engine renders colored-rect fallbacks before sprites land.
export interface AssetBundle {
  tiles?: Partial<Record<TileType, HTMLImageElement>>;
  enemies?: Partial<Record<EnemyType, HTMLImageElement>>;
  player?: HTMLImageElement | null;
  playerJump?: HTMLImageElement | null;  // shown when !onGround; falls back to player
  background?: HTMLImageElement | null;
}

// Optional helper. Returns a bundle with whatever loaded; missing keys stay undefined.
export async function preloadAssets(manifest: {
  tiles?: Partial<Record<TileType, string>>;
  enemies?: Partial<Record<EnemyType, string>>;
  player?: string;
  playerJump?: string;
  background?: string;
}): Promise<AssetBundle> {
  const loadImage = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const loadRecord = async <K extends string>(
    rec: Partial<Record<K, string>> | undefined,
  ): Promise<Partial<Record<K, HTMLImageElement>>> => {
    const out: Partial<Record<K, HTMLImageElement>> = {};
    if (!rec) return out;
    await Promise.all(
      (Object.entries(rec) as [K, string][]).map(async ([k, src]) => {
        const img = await loadImage(src);
        if (img) out[k] = img;
      }),
    );
    return out;
  };

  const [tiles, enemies, player, playerJump, background] = await Promise.all([
    loadRecord(manifest.tiles),
    loadRecord(manifest.enemies),
    manifest.player ? loadImage(manifest.player) : Promise.resolve(null),
    manifest.playerJump ? loadImage(manifest.playerJump) : Promise.resolve(null),
    manifest.background ? loadImage(manifest.background) : Promise.resolve(null),
  ]);

  return { tiles, enemies, player, playerJump, background };
}
