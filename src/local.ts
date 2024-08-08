import { getMuniMap, getMuniMapLocations } from './muni';
import { latLonToAddressInfo, searchAddress, latLonToAddress } from './index';

import * as fs from 'fs';

const run = async () => {
  const muniMap = await getMuniMapLocations();
  // save to file
  fs.writeFileSync('data/jp-locations.json', JSON.stringify(muniMap, null, 2));

  // const latlon = [35.6895, 139.6917];
  // const [lat, lon] = latlon;

  // const result = await latLonToAddress(lat, lon);

  // console.log(result);

  // const q = '北海道';
  // const searchResults = await searchAddress(q);
  // console.log(searchResults);
};

run();
