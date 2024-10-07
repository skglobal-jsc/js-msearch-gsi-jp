// Sử dụng cú pháp ES module, nhớ thêm "type": "module" trong package.json
import fs from 'fs';
import Pbf from 'pbf';
import { VectorTile } from '@mapbox/vector-tile';

// Đọc file PBF
const pbfData = fs.readFileSync('docs/tiles/10/861/440.pbf');

// Giải mã file PBF
const tile = new VectorTile(new Pbf(pbfData));

// Tạo cấu trúc GeoJSON
const geojson = {
  type: 'FeatureCollection',
  features: []
};

// Duyệt qua các lớp trong file PBF và chuyển đổi sang GeoJSON
for (const layerName in tile.layers) {
  const layer = tile.layers[layerName];

  for (let i = 0; i < layer.length; i++) {
    const feature = layer.feature(i).toGeoJSON(0, 0, 0); // Cần điều chỉnh z/x/y nếu cần thiết
    geojson.features.push(feature);
  }
}

// Lưu GeoJSON vào file
fs.writeFileSync('output.geojson', JSON.stringify(geojson, null, 2));

console.log('Chuyển đổi hoàn tất. GeoJSON đã được lưu tại output.geojson');

