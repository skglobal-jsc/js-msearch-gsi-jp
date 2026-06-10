import { lngLatToGoogle } from 'global-mercator';
import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { JMAHierarchyEntry, jmaHierarchy } from './data/jma-hierarchy';
import { VectorTile } from 'mapbox-vector-tile';
import { getTile, getTileResult } from './utils';
import countryOptions from './countryOptions';

const api = setupCache(
  axios.create({ timeout: 2000 }),
  { ttl: 60 * 60 * 24 * 1000 } // 1 day
);

const jmaClass20Options = countryOptions.JMA_CLASS20;

/**
 * Resolves JMA weather area info for a given latitude and longitude.
 * Queries the class20s PBF tile (1 HTTP request) then derives all parent info
 * from the bundled hierarchy map (built from JMA area.json).
 *
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Full JMAHierarchyEntry with office/class10/class15/class20, or null if outside coverage
 */
const latLonToJMACode = async (
  lat: number,
  lon: number
): Promise<JMAHierarchyEntry | null> => {
  const [x, y] = lngLatToGoogle([lon, lat], jmaClass20Options.zoomBase);
  console.log(`[JMA] zoom=${jmaClass20Options.zoomBase}, tile x=${x}, y=${y}`);

  const tileUrl = jmaClass20Options.tileUrl
    .replace('{z}', String(jmaClass20Options.zoomBase))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
  console.log(`[JMA] Fetching tile: ${tileUrl}`);

  let tile: VectorTile;
  try {
    tile = await getTile(x, y, jmaClass20Options, api);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[JMA] Failed to fetch tile: ${msg}`);
    return null;
  }

  const layers = Object.keys(tile.layers);
  console.log(`[JMA] Tile layers: [${layers.join(', ')}]`);
  console.log(`[JMA] Expected layer: "${jmaClass20Options.layer}"`);

  if (!layers.includes(jmaClass20Options.layer)) {
    console.warn(`[JMA] Layer "${jmaClass20Options.layer}" not found in tile`);
  } else {
    const layer = tile.layers[jmaClass20Options.layer];
    console.log(`[JMA] Layer feature count: ${layer.length}`);
  }

  const result = getTileResult(tile, x, y, [lon, lat], jmaClass20Options);
  console.log(`[JMA] getTileResult =>`, result);

  const class20Code = result.code;
  if (!class20Code) {
    console.warn(`[JMA] class20Code is empty/null — point may not be inside any polygon`);
    return null;
  }

  console.log(`[JMA] class20Code="${class20Code}"`);
  const entry = jmaHierarchy[class20Code];
  if (!entry) {
    console.warn(`[JMA] class20Code "${class20Code}" not found in jmaHierarchy (total keys: ${Object.keys(jmaHierarchy).length})`);
    const sample = Object.keys(jmaHierarchy).slice(0, 5);
    console.warn(`[JMA] Sample hierarchy keys: [${sample.join(', ')}]`);
  }

  return entry ?? null;
};

export { latLonToJMACode, JMAHierarchyEntry };
