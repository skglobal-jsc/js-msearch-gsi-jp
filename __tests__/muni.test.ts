import axios from 'axios';
import { getMuniMap } from '../src/muni';
import { MuniMap } from '../src/types';

// import json from './data/cities.json';
import muni from '../data/muni';

const expectedMuniMap: MuniMap = muni;

describe('getMuniMap', () => {
  it('should fetch and parse muni map correctly', async () => {
    const result = await getMuniMap();
    expect(result).toEqual(expectedMuniMap);
  });
});
