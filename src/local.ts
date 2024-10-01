import { getMuniMap, getMuniMapLocations } from './muni';
import { searchAddress, latLonToAddress, reverseGeocodeByLocal, reverseGeocodeByGsi } from './index';

import * as fs from 'fs';

const run = async () => {
  const muniMap = await getMuniMapLocations();

  fs.writeFileSync('data/jp-locations.json', JSON.stringify(muniMap, null, 2));

  const wards = Object.keys(muniMap)
    .map((key) => {
      const pref = muniMap[key];
      const { cities = {} } = pref;
      const wardsOfCity = Object.keys(cities).map((cityKey) => {
        const city = cities[cityKey];
        const { wards = {} } = city;
        return Object.keys(wards).map((wardKey) => {
          const ward = wards[wardKey];
          return {
            bigCityCode: city.cityCode,
            bigCityFlag: '1',
            bigCityName: city.cityName,
            cityCode: ward.cityCode,
            cityName: ward.cityName,
            prefCode: key,
          };
        });
      });

      return wardsOfCity;
    })
    .flat(2)
    .reduce((acc, cur) => {
      acc[cur.cityCode] = cur;
      return acc;
    }, {});
  // save to file
  fs.writeFileSync('data/ward-in-bigcity.json', JSON.stringify(wards, null, 2));

  //  create all-cites-wards.json, every city has wards
  // {
  //   "cityName": "士別市",
  //   "isWard": false,
  //   "prefectureName": "北海道",
  //   "tagData": {
  //     "city": "01220",
  //     "prefecture": "01",
  //     "ward": "01220"
  //   },
  //   "wardName": ""
  // },
  const wardsTagData = Object.keys(muniMap)
    .map((key) => {
      const pref = muniMap[key];
      const { cities = {} } = pref;
      return Object.keys(cities).map((cityKey) => {
        const city = cities[cityKey];
        const { wards = {} } = city;
        if (Object.keys(wards).length === 0) {
          return {
            cityName: city.cityName,
            isWard: false,
            prefectureName: pref.prefName,
            tagData: {
              city: city.cityCode,
              prefecture: key,
              ward: city.cityCode,
            },
            wardName: '',
          };
        }
        return Object.keys(wards).map((wardKey) => {
          const ward = wards[wardKey];
          return {
            cityName: city.cityName,
            isWard: true,
            prefectureName: pref.prefName,
            tagData: {
              city: ward.bigCityCode,
              prefecture: key,
              ward: ward.cityCode,
            },
            wardName: ward.cityName,
          };
        });
        // .concat({
        //   cityName: city.cityName,
        //   isWard: false,
        //   prefectureName: pref.prefName,
        //   tagData: {
        //     city: city.cityCode,
        //     prefecture: key,
        //     ward: city.cityCode,
        //   },
        //   wardName: '',
        // });
      });
    })
    .flat(2);

  fs.writeFileSync(
    'data/all-cites-wards.json',
    JSON.stringify(wardsTagData, null, 2)
  );

  // const q = '北海道';
  // const searchResults = await searchAddress(q);
  // console.log(searchResults);
};

const test = async () => {
  const lat = 43.332951;
  const lon = 141.853986;
  console.time("searchAddress");
  const results = await reverseGeocodeByLocal(lat, lon);
  console.log("results", results);
  console.timeEnd("searchAddress");

  console.time("searchAddress111");
  const results111 = await reverseGeocodeByLocal(lat, lon);
  console.log("results111", results111);
  console.timeEnd("searchAddress111");

  // === reverseGeocodeByGsi
  console.time("reverseGeocodeByGsi");
  const resultsGsi = await reverseGeocodeByGsi(lat, lon);
  console.log("resultsGsi", resultsGsi);
  console.timeEnd("reverseGeocodeByGsi");
};

// run();
test();
