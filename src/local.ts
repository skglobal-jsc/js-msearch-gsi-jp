import { getMuniMap } from './muni';
import { latLonToAddressInfo } from './index';

import * as fs from 'fs';

const run = async () => {
  const muniMap = await getMuniMap();
  // save to file
  fs.writeFileSync('data/muni.json', JSON.stringify(muniMap, null, 2));

  //   const lat = 35.6895;
  //   const lon = 139.6917;

  // const result = await latLonToAddressInfo(lat, lon);

  // console.log(result);
};

run();
