import axios from 'axios';
import { latLonToAddressInfo } from '../src/index';
import { MuniRecord, ReverseGeocodeResults } from '../src/types';

// Integration test
describe('Integration test for latLonToAddressInfo', () => {
  it('should return real address data for valid latitude and longitude', async () => {
    const lat = 35.6895;
    const lon = 139.6917;

    const expectedResponse = {
      cityCode: '13104',
      cityName: '新宿区',
      prefCode: '1310413',
      prefName: '東京都',
    };

    const result: MuniRecord = await latLonToAddressInfo(lat, lon);
    expect(result).toEqual(expectedResponse);
  });

  it('should throw an error if the API call fails', async () => {
    const lat = 10.80443324769394;
    const lon = 106.66840624632418;
    await expect(latLonToAddressInfo(lat, lon)).rejects.toThrow(
      'No address found'
    );
  });
});
