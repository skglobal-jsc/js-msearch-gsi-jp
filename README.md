# @sk-global/js-msearch-gsi-jp

## Introduction

`@sk-global/js-msearch-gsi-jp` is a client library for APIs presented by the Geospatial Information Authority of Japan. This library provides functionalities to interact with various geospatial data services.

## Features

- Reverse Geocoding: Convert latitude and longitude to an address.
- Search for a location by address: Search for a location by address.

## Supported APIs

* Geocoding API - `GET https://msearch.gsi.go.jp/address-search/AddressSearch?q=XXXX`
* Reverse Geocoding API - `GET https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=XXXX&lon=XXXX`


## Installation

To install the library, use npm:

```sh
npm install @sk-global/js-msearch-gsi-jp
```

Ensure you have Node.js version 18.0.0 or higher.

## How to use

Import the library in your project and use the provided functions. Here is an example of how to use the latLonToAddress function:

```js
import { latLonToAddress } from '@sk-global/js-msearch-gsi-jp';

const address = await latLonToAddress(35.6895, 139.6917);

// Output:
// { results: { muniCd: '13104', lv01Nm: '西新宿二丁目' } }
```

## Examples

Example 1: Reverse Geocoding

```js
import { latLonToAddress } from '@sk-global/js-msearch-gsi-jp';

async function getAddress() {
  const address = await latLonToAddress(35.6895, 139.6917);

  // Output:
  // { results: { muniCd: '13104', lv01Nm: '西新宿二丁目' } }
}
```

Example 2: Search for a location by address

```js
import { searchResults } from '@sk-global/js-msearch-gsi-jp';
const q = '北海道';
const searchResults = await searchAddress(q);
console.log(searchResults);

// Output:
// [
//   {
//     geometry: { coordinates: [Array], type: 'Point' },
//     type: 'Feature',
//     properties: { addressCode: '', title: '北海道' }
//   },
//   {
//     geometry: { coordinates: [Array], type: 'Point' },
//     type: 'Feature',
//     properties: { addressCode: '', title: '北海道' }
//   },
//   ...
// ]
```

## License

This library is released under the MIT License. For more information, see the [LICENSE](LICENSE) file.
