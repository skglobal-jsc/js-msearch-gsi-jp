import { japanmesh } from 'japanmesh';

export function convertLatLonToMesh(lat: number, lon: number) {
  return japanmesh.toCode(lat, lon, 1000); // 1000m is 3rd mesh code
}
