import axios from 'axios';

import { SearchResults } from './types';

// base url for msearch api
const BaseURL = 'https://msearch.gsi.go.jp';

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
