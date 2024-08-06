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
  const response = await axios.get(MuniURL, {
    responseType: 'text',
  });

  const muniMap = response.data;
  return parseMuniMap(muniMap);
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

export { getMuniMap, muniCodeToAddressName, addressResultsToAddressName };
