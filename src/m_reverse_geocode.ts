import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';
import * as path from 'path';

import { ReverseGeocodeResults } from './types';
import { getMuniMap } from './muni';
import { calculateMeshCode, convertToTokyoCoordinates } from './utils';

const api = setupCache(
  axios.create({
    baseURL: 'https://mreversegeocoder.gsi.go.jp',
    timeout: 2000,
  }),
  {
    ttl: 1000 * 60 * 60 * 24, // 24 hours
  }
);

api.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL}${config.url}?${new URLSearchParams(
    config.params
  ).toString()}`;
  console.log('Full URL:', fullUrl);
  return config;
});

/**
 * Reverse geocodes a given latitude and longitude using the mreversegeocoder API.
 *
 * @param lat - The latitude coordinate.
 * @param lon - The longitude coordinate.
 * @returns A promise that resolves to the reverse geocode results or null if no results are found.
 */
const reverseGeocodeByGsi = async (
  lat: number,
  lon: number
): Promise<ReverseGeocodeResults | null> => {
  // get address from mreversegeocoder API.
  const params = {
    lat,
    lon,
  };
  const response = await api.get('/reverse-geocoder/LonLatToAddress', {
    responseType: 'json',
    params,
  });
  return response.data;
};

/**
 * Reverse geocodes a given latitude and longitude by converting them to Tokyo coordinates,
 * calculating the corresponding mesh code, and retrieving the mesh data from the local file system.
 *
 * @param lat - The latitude to reverse geocode.
 * @param lon - The longitude to reverse geocode.
 * @returns A promise that resolves to the reverse geocode results or null if the mesh data is not found.
 *
 * @example
 * ```typescript
 * const results = await reverseGeocodeByLocal(35.6895, 139.6917);
 * if (results) {
 *   console.log(results);
 * } else {
 *   console.log('No data found for the given coordinates.');
 * }
 * ```
 */
const reverseGeocodeByLocal = async (
  lat: number,
  lon: number
): Promise<ReverseGeocodeResults | null> => {
  // Convert lat and lon to Tokyo coordinates
  const { Etokyo, Ntokyo } = convertToTokyoCoordinates(lat, lon);

  // Get mesh code based on the Tokyo coordinates
  const { meshCode, meshCode12, meshCode34, prefix } = calculateMeshCode(
    Ntokyo,
    Etokyo
  );

  try {
    // Read the mesh data from the local file system using require
    const meshDataPath = path.join(
      __dirname,
      'data',
      `mesh_data_${prefix}.json`
    );
    const meshData = require(meshDataPath);

    // Get the data for the specific mesh code
    const meshArray = meshData[meshCode];
    if (!meshArray || meshArray.length === 0) {
      console.error(`Mesh data not found for code ${meshCode}`);
      return null;
    }

    // some mesh code has multiple data, so we need to find the correct one
    // const meshCodeData = meshArray.find((data) => {
    //   const [lat1, lon1, lat2, lon2] = data.bbox;
    //   // Check if the Tokyo coordinates are within the bounding box
    //   return Ntokyo >= lat1 && Ntokyo <= lat2 && Etokyo >= lon1 && Etokyo <= lon2;
    // }) || meshArray[0];

    // Acttually, we can use the smallest bbox to get the correct mesh code
    // but we have not bbox data in the mesh data, so we can't use it.
    // So, we just check flag smallest to get the correct mesh code
    // the flag smallest is set to true if the data is the smallest bbox
    // And this flag is set by the data creator.(correct by compare data from GSI)
    const meshCodeData =
      meshArray.find((data: any) => {
        const { smallest } = data;
        return smallest;
      }) || meshArray[0];
    return {
      results: {
        muniCd: meshCodeData?.city_code,
        lv01Nm: meshCodeData?.city_name,
        mesh_code: meshCode,
        notes: meshCodeData?.notes,
      },
    };
  } catch (error) {
    console.error(`Error reading mesh data for prefix ${prefix}:`, error);
    return null;
  }
};

/**
 * Converts latitude and longitude coordinates to an address.
 *
 * @param lat - The latitude coordinate.
 * @param lon - The longitude coordinate.
 * @returns A promise that resolves to the reverse geocode results or null.
 *
 * @remarks
 * This function attempts to get the address from a local reverse geocoding service.
 * The commented-out code shows an alternative approach where it first tries to get the address
 * from a GSI (Geospatial Information) service and falls back to the local service in case of an error.
 */
const latLonToAddress = (
  lat: number,
  lon: number
): Promise<ReverseGeocodeResults | null> => {
  // try to get address from gsi local first
  // if there is an error, try to get address from GSI
  try {
    return reverseGeocodeByLocal(lat, lon);
  } catch (e) {
    console.log('Error getting address from local:', e);
    return reverseGeocodeByGsi(lat, lon);
  }
};

const getElevationFromOpenAPI = async (
  lat: number,
  lon: number
): Promise<{
  elevation: number;
  longitude: number;
  latitude: number;
} | null> => {
  // get elevation from OpenAPI
  // https://api.open-elevation.com/api/v1/lookup?locations=43.061434,141.353649
  const response = await axios.get(
    'https://api.open-elevation.com/api/v1/lookup',
    {
      responseType: 'json',
      timeout: 2000,
      params: {
        locations: `${lat},${lon}`,
      },
    }
  );
  const data = response.data;
  if (!data.results || data.results.length === 0) {
    return null;
  }
  const [elevation] = data.results;
  return {
    ...elevation,
    elevation: parseFloat(elevation.elevation),
  };
};

const getElevationFromGSI = async (
  lat: number,
  lon: number
): Promise<{
  elevation: number;
  longitude: number;
  latitude: number;
}> => {
  // get elevation from GSI API
  // https://mreversegeocoder.gsi.go.jp/general/dem/scripts/getelevation.php?lon=141.3536498&lat=43.061434
  const response = await api.get('/general/dem/scripts/getelevation.php', {
    responseType: 'json',
    params: {
      lat,
      lon,
    },
  });

  const elevation = parseFloat(response.data.elevation);
  return { longitude: lon, latitude: lat, elevation };
};

/**
 * Retrieves the elevation for a given latitude and longitude.
 *
 * This function first attempts to get the elevation data from the GSI (Geospatial Information Authority of Japan).
 * If there is an error during this process, it falls back to retrieving the elevation data from an OpenAPI.
 *
 * @param lat - The latitude coordinate.
 * @param lon - The longitude coordinate.
 * @returns A promise that resolves to the elevation data.
 * @throws Will log an error message if both GSI and OpenAPI requests fail.
 */
const getElevation = async (lat: number, lon: number) => {
  // try to get elevation from GSI first
  // if there is an error, try to get elevation from OpenAPI
  try {
    return await getElevationFromGSI(lat, lon);
  } catch (e) {
    console.log('Error getting elevation from GSI:', e);
    return await getElevationFromOpenAPI(lat, lon);
  }
};

export {
  getMuniMap,
  latLonToAddress,
  reverseGeocodeByLocal,
  reverseGeocodeByGsi,
  getElevationFromOpenAPI,
  getElevationFromGSI,
  getElevation,
};
