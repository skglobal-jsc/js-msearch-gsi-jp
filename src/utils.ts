import pointInPolygon from 'point-in-polygon';
import axios, { AxiosInstance } from 'axios';
import { VectorTile } from 'mapbox-vector-tile';
import { ReverseGeocodingOptions, ReverseGeocodingResult } from './interfaces/index';

/**
 * Get a tile from targeted country's tilesets by using x and y tile index
 * @param x x tile index
 * @param y y tile index
 * @param options ReverseGeocodingOptions
 * @param api Axios object
 * @returns VectorTile object
 */
export const getTile = async (
  x: number,
  y: number,
  options: ReverseGeocodingOptions,
  api: AxiosInstance = axios
): Promise<VectorTile> => {
  const tileUrl = options.tileUrl
    .replace('{z}', String(options.zoomBase))
    .replace('{x}', String(x))
    .replace('{y}', String(y));

  let buffer;

  try {
    const res = await api.get(tileUrl, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res.data, 'binary');
  } catch (error) {
    throw error;
  }

  const tile = new VectorTile(buffer);
  return tile;
};

/**
 * Get a result of reverse geocoding
 * @param tile VectorTile object
 * @param x x tile index
 * @param y y tile index
 * @param lnglat number[] longitude, latitude
 * @param options ReverseGeocodingOptions
 * @returns an object of result of reverse gecoding
 */
export const getTileResult = (
  tile: VectorTile,
  x: number,
  y: number,
  lnglat: [number, number],
  options: ReverseGeocodingOptions
): ReverseGeocodingResult => {
  let layers = Object.keys(tile.layers);

  if (!Array.isArray(layers)) layers = [layers];

  let geocodingResult: ReverseGeocodingResult = {};
  layers.forEach((layerID) => {
    const layer = tile.layers[layerID];
    if (layer && options.layer === layer.name) {
      for (let i = 0; i < layer.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let feature: any;
        try {
          feature = layer.feature(i).toGeoJSON(x, y, options.zoomBase);
        } catch (err) {
          console.warn(`[getTileResult] skipping feature ${i}: toGeoJSON failed —`, (err as Error).message);
          continue;
        }
        if (layers.length > 1) feature.properties.vt_layer = layerID;

        // Check if point is inside polygon
        // feature.geometry.coordinates is the polygon coordinates
        if (feature.geometry && feature.geometry.type === 'Polygon') {
          const coordinates = feature.geometry.coordinates[0]; // First ring (exterior)
          const res = pointInPolygon(lnglat, coordinates);
          if (res) {
            geocodingResult = options.getResult(feature);
          }
        } else if (feature.geometry && feature.geometry.type === 'MultiPolygon') {
          // Handle MultiPolygon: check if point is in any polygon
          const polygons = feature.geometry.coordinates;
          for (const polygon of polygons) {
            const coordinates = polygon[0]; // First ring (exterior)
            const res = pointInPolygon(lnglat, coordinates);
            if (res) {
              geocodingResult = options.getResult(feature);
              break;
            }
          }
        }
      }
    }
  });
  return geocodingResult;
};

