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

  /**
   * When true, falls back to the nearest polygon (by boundary distance) if the
   * point doesn't fall inside any polygon in the tile — e.g. coordinates over
   * water between land areas. Default is false (returns an empty result).
   */
  nearestFallback?: boolean
}
