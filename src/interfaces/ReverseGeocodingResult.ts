/**
 * Base interface of reverse geocoding result
 */
export interface ReverseGeocodingResult {
  code?: string
}

/**
 * Interface of country polygons by world bank
 */
export interface ReverseGeocodingResultCountry extends ReverseGeocodingResult {
  name: string
}

/**
 * Interface of reverse geocoding result for Japan
 */
export interface ReverseGeocodingResultJP extends ReverseGeocodingResult {
  results?: {
    muniCd?: string
    lv01Nm?: string
  },
  prefecture?: string
  city?: string
}

