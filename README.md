# @sk-global/js-msearch-gsi-jp

## Introduction

This NPM package provides a feature to seach both prefecture name and city name from particular longitude/latitude.

In order to provide reverse-geocoding feature, we are hosting address data in Github pages.

## How it works

1. Get the tile number equivalent to zoom level 10 (about 30 km square) on the client side based on the latitude and longitude specified as arguments of openReverseGeocoder(), and download the vector tiles from the web server with AJAX.
2. Retrieves the polygons with the specified latitude and longitude from the polygons of cities contained in the vector tiles downloaded by AJAX on the client side, and returns the name of the prefecture and the name of the city.

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

## Tileset (docs/tiles)

The tileset is hosted on Github pages. The tileset is generated from the GSI vector tiles.

### How to update the tileset

#### Preparation

Please make sure you have installed following library on your environment in order to make tiles. If it is MacOS, you may use the below commands to install them.

- ogr2ogr
  - `brew install gdal`
- tippercanoe
  - `brew install tippecanoe`

#### Update the tileset

1. Clone the repository
2. Run the following command to generate the tiles
   ```sh
   npm run download
   npm run build
   ```

**What do these commands do?**

1. It downloads the latest administrative boundaries from GSI website. Note. the latest version might change URL anytime.
2. Extract zip file.
3. Convert Shapefile to GeoJSON by using `ogr2ogr`. Note. file name may be changed in the latest version.
4. Modify properties inside vector tiles
5. Create `*.mbtiles` by using `tippecanoe`. We disabled to compress vector tiles.
6. Extract tiles from mbtiles format under specific directory in order to use tiles in static.


**Source**
It uses administrative boundaries polygons from GSI in terms of data for prefectures and cities.

https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2024.html
