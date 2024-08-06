import { getMuniMap } from './muni';
import { latLonToAddressInfo, searchAddress, latLonToAddress } from './index';

import * as fs from 'fs';

const run = async () => {
  const muniMap = await getMuniMap();
  // save to file
  fs.writeFileSync('data/muni.json', JSON.stringify(muniMap, null, 2));

  const latlon = [37.304482,137.148414];
  const [lat, lon] = latlon;

  const result = await latLonToAddress(lat, lon);

  console.log(result);

  // const q = '北海道';
  // const searchResults = await searchAddress(q);
  // console.log(searchResults);
};

run();
