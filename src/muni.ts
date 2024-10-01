// Muni file url
const MuniURL = 'https://maps.gsi.go.jp/js/muni.js';
const MuniRegex = /GSI\.MUNI_ARRAY\["\d+"\]\s*=\s*'(.*?)';/g;

import axios from 'axios';
import { AddressResults, MuniMap } from './types';

/**
 * parse muni.js
 * @param muniMap
 */
const parseMuniMap = (muniMap: string) => {
  const muniMapObj: MuniMap = {};
  const lines = muniMap.split('\n');
  lines.forEach((line) => {
    if (MuniRegex.test(line)) {
      const muniRecord = parseMuniRecord(line);
      muniMapObj[muniRecord.cityCode] = muniRecord;
    }
  });
  return muniMapObj;
};

/**
 * parse muni record
 * @param line
 */
const parseMuniRecord = (line: string) => {
  const muniRecord = line.replace(MuniRegex, '$1');

  const muniRecordArray = muniRecord.split(',');

  // validate muni record
  if (muniRecordArray.length !== 4) {
    throw new Error(`invalid muni record: ${muniRecord}`);
  }

  let [prefCode, prefName, cityCode, cityName] = muniRecordArray;

  // if cityCode is not 5 digits, add 0 to the beginning
  cityCode = cityCode.padStart(5, '0');

  // if prefCode is not 2 digits, add 0 to the beginning
  prefCode = prefCode.padStart(2, '0');

  return {
    prefCode: prefCode,
    prefName: prefName,
    cityCode: cityCode,
    cityName: cityName,
  };
};

/**
 * Get muni map (city or ward map by city code) from GSI
 */
const getMuniMap = async () => {
  try {
    const response = await axios.get(MuniURL, {
      responseType: 'text',
      timeout: 500,
    });

    const muniMap = response.data;
    return parseMuniMap(muniMap);
  } catch (error) {
    console.log(`Failed to get muni map: ${error}`);
    return {};
  }
};

/**
 * converts muni code to address name.
 *
 * @param muniMap
 * @param muniCode
 */
const muniCodeToAddressName = (muniMap: MuniMap, muniCode: string) => {
  const muniRecord = muniMap[muniCode];
  if (!muniRecord) {
    throw new Error(`muni code ${muniCode} not found`);
  }

  const add = `${muniRecord.prefName}${muniRecord.cityName}`;
  return add.replace(/　/g, '');
};

/**
 * converts address result to address name.
 * @param muniMap
 * @param addressResults
 */
const addressResultsToAddressName = (
  muniMap: MuniMap,
  addressResults: AddressResults
) => {
  const mc = addressResults.muniCd;
  const muniName = muniCodeToAddressName(muniMap, mc);
  const addrName = `${muniName}${addressResults.lv01Nm}`;
  return addrName;
};

const getMuniMapLocations = async () => {
  const muniMap = await getMuniMap();
  // muniMap is a map of all cities and wards in Japan
  // key: city code, value: { prefCode, prefName, cityCode, cityName }
  // we need to convert this to a map of all locations in Japan
  // key: prefCode , value: { prefName, cities: { key: cityCode, value: { cityCode, cityName, wards: { key: wardCode, value: { wardCode, wardName } } } } }

  const muniMapLocations = {};
  Object.keys(muniMap).forEach((cityCode) => {
    const muniRecord = muniMap[cityCode];
    const { prefCode, prefName, cityName } = muniRecord;
    if (!muniMapLocations[prefCode]) {
      muniMapLocations[prefCode] = { prefName, cities: {} };
    }

    // if cityName contains '　', it is a ward
    // otherwise, it is a city
    if (cityName.includes('　')) {
      // ward name is after '　'
      const [name, wardName] = cityName.split('　');
      // find city has the same name
      const city: any = Object.values(muniMap).find(
        (c: any) => c.cityName === name
      );
      if (!city) {
        console.log(`City ${name} not found in prefCode ${prefCode}`);
      } else {
        // add ward to city
        muniMapLocations[prefCode].cities[city.cityCode].wards[cityCode] = {
          prefCode,
          cityCode: cityCode,
          cityName: `${name}${wardName}`,
          bigCityFlag: '1',
          bigCityCode: city.cityCode,
        };
      }
    } else {
      muniMapLocations[prefCode].cities[cityCode] = {
        prefCode,
        cityCode,
        cityName,
        wards: {},
      };
    }
  });

  // assign bigCityFlag to each city
  Object.keys(muniMapLocations).forEach((prefCode) => {
    const pref = muniMapLocations[prefCode];
    Object.keys(pref.cities).forEach((cityCode) => {
      const city = pref.cities[cityCode];
      const isBigCity = Object.values(city.wards).length > 0;
      if (isBigCity) {
        city.bigCityFlag = '2';
      } else {
        // delete wards
        delete city.wards;
        // if city is tokyo then bigCityFlag is 3, otherwise 0
        if (city.prefCode === '13') {
          city.bigCityFlag = '3';
        } else {
          city.bigCityFlag = '0';
        }
      }
    });
  });

  return muniMapLocations;
};

export {
  getMuniMap,
  getMuniMapLocations,
  muniCodeToAddressName,
  addressResultsToAddressName,
};
