import * as csvParser from 'csv-parser';
import { getMuniMap, getMuniMapLocations } from './muni';
import {
  searchAddress,
  latLonToAddress,
  reverseGeocodeByLocal,
  reverseGeocodeByGsi,
  getElevation,
  getElevationFromGSI,
  getElevationFromOpenAPI,
} from './index';

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
  const lat = 33.602643;
  const lon = 131.175948;
  console.time('searchAddress');
  const results = await reverseGeocodeByLocal(lat, lon);
  console.log('results', results);
  console.timeEnd('searchAddress');

  // === reverseGeocodeByGsi
  console.time('reverseGeocodeByGsi');
  const resultsGsi = await reverseGeocodeByGsi(lat, lon);
  console.log('resultsGsi', resultsGsi);
  console.timeEnd('reverseGeocodeByGsi');

  // // === getElevation
  // console.time('getElevation');
  // const elevation = await getElevation(lat, lon);
  // console.log('elevation', elevation);
  // console.timeEnd('getElevation');

  // // === getElevationFromGSI
  // console.time('getElevationFromGSI');
  // const elevationGsi = await getElevationFromGSI(lat, lon);
  // console.log('elevationGsi', elevationGsi);
  // console.timeEnd('getElevationFromGSI');

  // // === getElevationFromOpenAPI
  // console.time('getElevationFromOpenAPI');
  // const elevationOpenAPI = await getElevationFromOpenAPI(lat, lon);
  // console.log('elevationOpenAPI', elevationOpenAPI);
  // console.timeEnd('getElevationFromOpenAPI');
};

// run all city of Japan for both reverseGeocodeByLocal and reverseGeocodeByGsi
// compare the results and save to file
const testAndCompare = async () => {
  // first, read the cvs file from tmp/cites.csv
  // convert to json
  const convertCSVToJSON = async (filePath: string) => {
    const results: any = {};
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csvParser({
            separator: ',',
            headers: [
              'citycode',
              'prefname',
              'citynNme1',
              'citynNme2',
              'lat',
              'lng',
            ],
            skipLines: 1, // skip the header
          })
        )
        .on('data', (row) => {
          // the header are citycode,prefname,citynNme1,citynNme2, lat,lng
          // first row is header
          const { citycode, prefname, citynNme1, citynNme2, lat, lng } = row;
          results[citycode] = {
            citycode,
            prefname,
            citynNme1,
            citynNme2,
            lat,
            lng,
          };
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  };
  const results: any = await convertCSVToJSON('src/tmp/cities.csv');
  // save to file
  fs.writeFileSync('src/tmp/cities.json', JSON.stringify(results, null, 2));

  // second, run the test
  // every city in Japan call reverseGeocodeByLocal and reverseGeocodeByGsi and compare the results
  // save to file
  const resultsArrayResolved: any[] = [];
  const values: any = Object.values(results).slice(0);
  for (const element of values) {
    console.log('Processing city:', element.citycode);
    const { citycode, lat, lng } = element;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const [resultsLocal, resultsGsi] = await Promise.all([
      reverseGeocodeByLocal(latitude, longitude),
      reverseGeocodeByGsi(latitude, longitude),
    ]);

    // compare the muniCd of both results
    const muniCdLocal = resultsLocal?.results.muniCd;
    const muniCdGsi = resultsGsi?.results.muniCd;
    const isDiff = muniCdLocal !== muniCdGsi;
    resultsArrayResolved.push({
      citycode,
      lat,
      lng,
      resultsLocal,
      resultsGsi,
      isDiff,
    });

    // sleep for 1 second to avoid the rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const diffResults = resultsArrayResolved.filter((result) => result.isDiff);
  console.log('Total diff:', diffResults.length);
  fs.writeFileSync(
    'src/tmp/cities-results.json',
    JSON.stringify(resultsArrayResolved, null, 2)
  );

  await collectDiff();
};

const collectDiff = async () => {
  // read the file 'src/tmp/cities-results.json' and collect the diff
  const data = fs.readFileSync('src/tmp/cities-results.json', 'utf8');
  const results = JSON.parse(data);
  const diffResults = results.filter((result) => result.isDiff);
  console.log('Total diff:', diffResults.length);
  fs.writeFileSync(
    'src/tmp/cities-results-diff.json',
    JSON.stringify(diffResults, null, 2)
  );
};

const correctData = async () => {
  // use result from cities-results-diff.json to correct the data inside src/data/mesh_data_xxxx.json
  // read the file 'src/tmp/cities-results-diff.json'
  const data = fs.readFileSync('src/tmp/cities-results-diff.json', 'utf8');
  const results = JSON.parse(data);
  console.log('Total diff:', results.length);

  // loop through the results and correct the data
  for (const result of results) {
    const { citycode, resultsLocal, resultsGsi } = result;
    const {
      results: { muniCd, mesh_code },
    } = resultsLocal;

    const {
      results: { muniCd: muniCdGsi },
    } = resultsGsi;

    console.log('mesh_code:', mesh_code, 'City Code local:', muniCd, 'City Code GSI:', muniCdGsi);
  }
};

// run();
// test();

testAndCompare();
// collectDiff();
// correctData();
