import { getMuniMap, getMuniMapLocations } from './muni';
import { latLonToAddressInfo, searchAddress, latLonToAddress } from './index';

import * as fs from 'fs';

const run = async () => {
  // const muniMap = await getMuniMapLocations();

  // const wards = Object.keys(muniMap)
  //   .map((key) => {
  //     const pref = muniMap[key];
  //     const { cities = {} } = pref;
  //     const wardsOfCity = Object.keys(cities).map((cityKey) => {
  //       const city = cities[cityKey];
  //       const { wards = {} } = city;
  //       return Object.keys(wards).map((wardKey) => {
  //         const ward = wards[wardKey];
  //         return {
  //           bigCityCode: city.cityCode,
  //           bigCityFlag: '1',
  //           bigCityName: city.cityName,
  //           cityCode: ward.cityCode,
  //           cityName: ward.cityName,
  //           prefCode: key,
  //         };
  //       });
  //     });

  //     return wardsOfCity;
  //   })
  //   .flat(2).reduce((acc, cur) => {
  //     acc[cur.cityCode] = cur;
  //     return acc;
  //   }, {});
  // // save to file
  // fs.writeFileSync('data/ward-in-bigcity.json', JSON.stringify(wards, null, 2));

  try {
    const latlon = [35.6895, 139.6917];
    const [lat, lon] = latlon;

    const result = await latLonToAddress(lat, lon);

    console.log(result);
  } catch (error: any) {
    console.log(error.name);
  }
  // const q = '北海道';
  // const searchResults = await searchAddress(q);
  // console.log(searchResults);
};

run();
