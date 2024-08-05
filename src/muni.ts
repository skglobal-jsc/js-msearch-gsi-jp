// Muni file url
const MuniURL = 'https://maps.gsi.go.jp/js/muni.js';
const MuniRecordPrefix = 'GSI.MUNI_ARRAY[';

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
    if (line.startsWith(MuniRecordPrefix)) {
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
  // every line should start with GSI.MUNI_ARRAY[ and end with ];
  // e.g. GSI.MUNI_ARRAY["47212"] = '47,大分県,47212,佐伯市';
  // we need to extract 47,大分県,47212,佐伯市
  const muniRecord = line
    .replace(MuniRecordPrefix, '')
    .replace("] = ", '')
    .replace(";", '')
    .replace(/'/g, '')
    .replace(/"/g, '');

  const muniRecordArray = muniRecord.split(',');

  // validate muni record
  if (muniRecordArray.length !== 4) {
    throw new Error(`invalid muni record: ${muniRecord}`);
  }

  return {
    prefCode: muniRecordArray[0],
    prefName: muniRecordArray[1],
    cityCode: muniRecordArray[2],
    cityName: muniRecordArray[3],
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

  return `${muniRecord.prefName}${muniRecord.cityName}`;
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
