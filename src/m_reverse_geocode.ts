import axios from 'axios';

import { ReverseGeocodeResults, MuniMap, MuniRecord } from './types';
import { addressResultsToAddressName, getMuniMap } from './muni';
const BaseURL = 'https://mreversegeocoder.gsi.go.jp';

// cache muni map
var muniMap: MuniMap | null = null;

/**
 * reverse geocoding by latitude and longitude to address
 * It returns town name only
 *
 * @param lat
 * @param lon
 * @returns address
 */
const latLonToAddress = async (
  lat: number,
  lon: number
): Promise<ReverseGeocodeResults> => {
  try {
    const url = `${BaseURL}/reverse-geocoder/LonLatToAddress`;
    const response = await axios.get(url, {
      responseType: 'json',
      params: {
        lat,
        lon,
      },
    });

    // if status is not 200
    if (response.status !== 200) {
      console.log("response");
      const err = new Error('Failed to get address. status is not 200');
      err.name = 'API_ERROR';
      throw err;
    }

    const res = response.data;
    return res;
  } catch (error: any) {
    // if it is axios error
    if (error.response) {
      console.log("error.response");
      const err = new Error('Failed to get address. status is not 200');
      err.name = 'API_ERROR';
      throw err;
    } else {
      console.log("error");
      throw error;
    }
  }
};

/**
 * Get full address name by latitude and longitude
 * @param lat
 * @param lon
 * @returns  prefecture + city + town
 */
const latLonToAddressName = async (
  lat: number,
  lon: number
): Promise<string> => {
  const res = await latLonToAddress(lat, lon);
  const { results } = res;
  if (!results || !results.muniCd) {
    throw new Error('No address found');
  }

  // update muniMap
  if (!muniMap) {
    muniMap = await getMuniMap();
  }

  return addressResultsToAddressName(muniMap, results);
};

const latLonToAddressInfo = async (
  lat: number,
  lon: number
): Promise<MuniRecord> => {
  const res = await latLonToAddress(lat, lon);
  const { results } = res;
  if (!results || !results.muniCd) {
    throw new Error('No address found');
  }

  // update muniMap
  if (!muniMap) {
    console.log('getMuniMap');
    muniMap = await getMuniMap();
  }
  const mc = results.muniCd;
  return muniMap[mc];
};

export {
  latLonToAddressInfo,
  getMuniMap,
  latLonToAddress,
  latLonToAddressName,
};
