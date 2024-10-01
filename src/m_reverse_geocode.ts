import axios from 'axios';
import { setupCache } from 'axios-cache-interceptor';

import { ReverseGeocodeResults } from './types';
import { getMuniMap } from './muni';
import { calculateMeshCode, convertToTokyoCoordinates } from './utils';

const api = setupCache(
  axios.create({
    baseURL: 'https://mreversegeocoder.gsi.go.jp',
    timeout: 500,
  })
);
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
  const response = await api.get('reverse-geocoder/LonLatToAddress', {
    responseType: 'json',
    params: {
      lat,
      lon,
    },
  });

  return response.data;
};

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
    const meshData = require(`./data/mesh_data_${prefix}.json`);

    // Get the data for the specific mesh code
    const meshArray = meshData[meshCode];
    if (!meshArray || meshArray.length === 0) {
      console.error(`Mesh data not found for code ${meshCode}`);
      return null
    }

    // return data same as GSI
    const [meshCodeData] = meshArray;
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

const latLonToAddress = async (
  lat: number,
  lon: number
): Promise<ReverseGeocodeResults | null> => {
  // try to get address from gsi first
  // if there is an error, try to get address from local
  // try {
  //   return await reverseGeocodeByGsi(lat, lon);
  // } catch (e) {
  //   console.log('Error getting address from GSI:', e);
  //   return await reverseGeocodeByLocal(lat, lon);
  // }

  return await reverseGeocodeByLocal(lat, lon);
};

export {
  getMuniMap,
  latLonToAddress,
  reverseGeocodeByLocal,
  reverseGeocodeByGsi,
};
