import { lngLatToGoogle } from 'global-mercator';
import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import {
  ReverseGeocodingOptions,
  ReverseGeocodingResult,
  ReverseGeocodingResultJP,
} from './interfaces';
import countryOptions from './countryOptions';
import { getTile, getTileResult } from './utils';

type LngLat = [number, number];

const api = setupCache(
  axios.create({
    timeout: 2000,
  }),
  {
    ttl: 60 * 60 * 24 * 1000, // 1 day
  }
);

api.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL}${config.url}?${new URLSearchParams(
    config.params
  ).toString()}`;
  console.log('Full URL:', fullUrl);
  return config;
});

const defaultOptions = countryOptions.DEFAULT;

/**
 * Performs reverse geocoding to obtain location information based on longitude and latitude.
 *
 * @param lnglat - The longitude and latitude coordinates.
 * @param options - Optional parameters for reverse geocoding.
 * @returns A promise that resolves to the reverse geocoding result.
 */
const openReverseGeocoder = async (
  lnglat: LngLat,
  options?: ReverseGeocodingOptions
): Promise<ReverseGeocodingResultJP> => {
  const opt = { ...defaultOptions, ...options };
  const [x, y] = lngLatToGoogle(lnglat, opt.zoomBase);
  const tile = await getTile(x, y, opt, api);
  const result: any = getTileResult(tile, x, y, lnglat, opt);
  return {
    results: {
      muniCd: result.code,
      lv01Nm: result.city,
    },
    code: result.code,
    prefecture: result.prefecture,
    city: result.city,
  };
};

/**
 * Performs reverse geocoding using the GSI (Geospatial Information Authority of Japan) API.
 * Given latitude and longitude coordinates, it returns the corresponding municipality code and city name.
 *
 * @param {Object} params - The parameters for the reverse geocoding request.
 * @param {number} params.lat - The latitude coordinate.
 * @param {number} params.lon - The longitude coordinate.
 * @returns {Promise<ReverseGeocodingResultJP>} A promise that resolves to an object containing the municipality code and city name.
 *
 * @example
 * const result = await gsiReverseGeocoder({ lat: 35.6895, lon: 139.6917 });
 * console.log(result); // { code: '13101', city: 'Chiyoda-ku' }
 */
const gsiReverseGeocoder = async ({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}): Promise<ReverseGeocodingResultJP> => {
  const response = await api.get(
    'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress',
    {
      responseType: 'json',
      params: {
        lat,
        lon,
      },
    }
  );
  const results = response.data;
  return {
    ...results,
    code: results?.results?.muniCd,
    city: results?.results?.lv01Nm,
  };
};

/**
 * Retrieves the elevation for a given longitude and latitude using the GSI API.
 *
 * @param {Object} coordinates - The coordinates for which to get the elevation.
 * @param {number} coordinates.lon - The longitude of the location.
 * @param {number} coordinates.lat - The latitude of the location.
 * @returns {Promise<{ longitude: number, latitude: number, elevation: number }>}
 * A promise that resolves to an object containing the longitude, latitude, and elevation.
 */
const getElevation = async ({ lon, lat }: { lon: number; lat: number }) => {
  // first, get elevation from GSI
  const response = await api.get(
    'https://mreversegeocoder.gsi.go.jp/general/dem/scripts/getelevation.php',
    {
      responseType: 'json',
      params: {
        lat,
        lon,
      },
    }
  );

  const elevation = parseFloat(response.data.elevation);
  return { longitude: lon, latitude: lat, elevation };
};

/**
 * Reverse geocodes the given longitude and latitude to obtain a city code.
 *
 * @param {Object} params - The parameters for reverse geocoding.
 * @param {number} params.lon - The longitude of the location.
 * @param {number} params.lat - The latitude of the location.
 *
 * @returns {Promise<ReverseGeocodingResult>} A promise that resolves to the reverse geocoding result.
 *
 * @throws Will attempt to use an alternative geocoding service if the primary service fails.
 */
const reverseGeocoder = async ({
  lon,
  lat,
}: {
  lon: number;
  lat: number;
}): Promise<ReverseGeocodingResult> => {
  // first, get city code from open reverse geocoder(local)
  try {
    const result = await openReverseGeocoder([lon, lat]);
    return result;
  } catch (error) {
    // if failed, get city code from GSI
    console.log('Failed to get city code from open reverse geocoder');
    return gsiReverseGeocoder({ lat, lon });
  }
};

export { reverseGeocoder, getElevation, gsiReverseGeocoder };
