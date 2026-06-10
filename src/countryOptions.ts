import {
  ReverseGeocodingOptions,
  ReverseGeocodingResultJP,
} from './interfaces/index';

/**
 * vector tiles settings for each country
 */
const countryOptions: { [s: string]: ReverseGeocodingOptions } = {
  JP: {
    zoomBase: 10,
    // tileUrl: `http://127.0.0.1:5500/docs/tiles/{z}/{x}/{y}.pbf`,
    tileUrl: 'https://skglobal-jsc.github.io/js-msearch-gsi-jp/tiles/{z}/{x}/{y}.pbf',
    layer: 'japanese-admins',
    getResult: function (feature: GeoJSON.Feature) {
      const res: ReverseGeocodingResultJP = {
        code:
          5 === String(feature.id).length
            ? String(feature.id)
            : `0${String(feature.id)}`,
        prefecture: feature.properties?.prefecture,
        city: feature.properties?.city,
      };
      return res;
    },
  },
  // JMA class20s tile — update tileUrl and getResult.code property name after generating tiles
  JMA_CLASS20: {
    zoomBase: 10,
    tileUrl: 'https://skglobal-jsc.github.io/js-msearch-gsi-jp/tiles/jma-class20s/{z}/{x}/{y}.pbf',
    layer: '市町村等（気象警報等）',
    getResult: function (feature: GeoJSON.Feature) {
      const code = feature.properties?.regioncode ?? String(feature.id);
      return { code: String(code) };
    },
  },
};

// default country options
countryOptions.DEFAULT = countryOptions.JP;

export default countryOptions;
