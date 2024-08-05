// Results of Reverse Geocode

export interface AddressResults {
  muniCd: string;
  lv01Nm: string;
}

export interface ReverseGeocodeResults {
  results: AddressResults;
}

export interface MuniRecord {
  prefCode: string;
  prefName: string;
  cityCode: string;
  cityName: string;
}

export interface MuniMap {
  [key: string]: MuniRecord;
}

type Geometry = {
  coordinates: number[];
  type: string;
};

type Properties = {
  addressCode: string;
  title: string;
  dataSource: string;
};
export interface SearchResults {
  geometry: Geometry;
  type: string;
  properties: Properties;
}
