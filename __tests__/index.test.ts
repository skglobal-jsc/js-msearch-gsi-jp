import axios from 'axios';
import { latLonToAddress } from '../src/index';
import { ReverseGeocodeResults } from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('latLonToAddress', () => {
  it('should return address data for valid latitude and longitude', async () => {
    const mockResponse = {
      data: {
        results: [
          {
            pref: 'Tokyo',
            city: 'Chiyoda',
            town: 'Kanda',
          },
        ],
      },
    };

    mockedAxios.get.mockResolvedValue(mockResponse);

    const lat = 35.6895;
    const lon = 139.6917;
    const result: ReverseGeocodeResults = await latLonToAddress(lat, lon);

    expect(result).toEqual(mockResponse.data);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress',
      {
        responseType: 'json',
        params: {
          lat,
          lon,
        },
      }
    );
  });

  it('should throw an error if the API call fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API call failed'));

    const lat = 35.6895;
    const lon = 139.6917;

    await expect(latLonToAddress(lat, lon)).rejects.toThrow('API call failed');
  });
});
