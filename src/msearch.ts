import axios from 'axios';

// base url for msearch api
const BaseURL = 'https://msearch.gsi.go.jp';

type Geometry = {
  coordinates: number[];
  type: string;
};

type Properties = {
  addressCode: string;
  title: string;
  dataSource: string;
};
interface SearchResults {
  geometry: Geometry;
  type: string;
  properties: Properties;
}

/**
 * search address by query
 */
const searchAddress = async (q: string): Promise<SearchResults> => {
  const url = `${BaseURL}/address-search/AddressSearch`;
  const response = await axios.get(url, {
    responseType: 'json',
    params: {
      q,
    },
  });

  const res = response.data;
  return res;
};

export { searchAddress };
