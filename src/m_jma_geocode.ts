import { lngLatToGoogle } from 'global-mercator';
import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import { JMAHierarchyEntry, jmaHierarchy } from './data/jma-hierarchy';
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
  const tile = await getTile(x, y, jmaClass20Options, api);
  const result = getTileResult(tile, x, y, [lon, lat], jmaClass20Options);

  const class20Code = result.code;
  if (!class20Code) return null;

  return jmaHierarchy[class20Code] ?? null;
};

export { latLonToJMACode, JMAHierarchyEntry };
