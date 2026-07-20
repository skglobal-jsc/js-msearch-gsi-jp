/**
 * Finds the closest polygon feature to a point when the point doesn't fall
 * inside any polygon (e.g. coordinates over water between land areas).
 */

type Ring = number[][];

const distanceToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;
  return Math.hypot(px - closestX, py - closestY);
};

// Equirectangular approximation: scale longitude by cos(latitude) so degree
// distances stay comparable in the north-south vs east-west directions.
const distanceToRing = (lon: number, lat: number, ring: Ring, lonScale: number): number => {
  let minDist = Infinity;
  for (let i = 0; i < ring.length - 1; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[i + 1];
    const dist = distanceToSegment(lon * lonScale, lat, ax * lonScale, ay, bx * lonScale, by);
    minDist = Math.min(minDist, dist);
  }
  return minDist;
};

const distanceToPolygonGeometry = (lon: number, lat: number, geometry: GeoJSON.Geometry): number => {
  const lonScale = Math.cos((lat * Math.PI) / 180);
  const rings: Ring[] =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0] as Ring]
      : geometry.type === 'MultiPolygon'
      ? geometry.coordinates.map((polygon) => polygon[0] as Ring)
      : [];

  let minDist = Infinity;
  for (const ring of rings) {
    minDist = Math.min(minDist, distanceToRing(lon, lat, ring, lonScale));
  }
  return minDist;
};

/**
 * Returns the feature with the polygon boundary closest to [lon, lat].
 * @param lnglat point to measure from
 * @param features candidate polygon/multipolygon features
 * @returns the nearest feature, or null if none of the features have polygon geometry
 */
export const findNearestPolygonFeature = (
  lnglat: [number, number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  features: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any | null => {
  const [lon, lat] = lnglat;
  let nearestFeature = null;
  let nearestDistance = Infinity;

  for (const feature of features) {
    if (!feature.geometry) continue;
    if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') continue;

    const dist = distanceToPolygonGeometry(lon, lat, feature.geometry);
    if (dist < nearestDistance) {
      nearestDistance = dist;
      nearestFeature = feature;
    }
  }

  return nearestFeature;
};
