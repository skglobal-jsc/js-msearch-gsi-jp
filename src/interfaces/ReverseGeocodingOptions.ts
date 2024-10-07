import { ReverseGeocodingResult } from './ReverseGeocodingResult'

export interface ReverseGeocodingOptions {
  /** Zoom level of the map. Default is 10 */
  zoomBase: number

  /** Tile URL of the map */
  tileUrl: string

  /** Layer name of the map */
  layer: string

  /**
   * Get reverse geocoding result from the feature
   */
  getResult: (feature: GeoJSON.Feature) => ReverseGeocodingResult
}
