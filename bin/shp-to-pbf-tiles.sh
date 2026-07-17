#!/usr/bin/env bash
#
# Convert a Shapefile into an XYZ directory of gzip-free .pbf vector tiles
# (the format served directly by GitHub Pages, e.g. docs/tiles/jma-class20s/{z}/{x}/{y}.pbf).
#
# Usage: bin/shp-to-pbf-tiles.sh <input.shp> <output_dir> [layer_name] [min_zoom] [max_zoom]

set -euo pipefail

INPUT_SHP="${1:?Usage: $0 <input.shp> <output_dir> [layer_name] [min_zoom] [max_zoom]}"
OUTPUT_DIR="${2:?Usage: $0 <input.shp> <output_dir> [layer_name] [min_zoom] [max_zoom]}"
LAYER_NAME="${3:-$(basename "$INPUT_SHP" .shp)}"
MIN_ZOOM="${4:-10}"
MAX_ZOOM="${5:-10}"

mkdir -p "$OUTPUT_DIR"

ogr2ogr -f GeoJSONSeq /dev/stdout -s_srs EPSG:4326 -t_srs EPSG:4326 "$INPUT_SHP" \
  | tippecanoe \
      --no-tile-compression \
      --no-tile-size-limit \
      --minimum-zoom="$MIN_ZOOM" \
      --maximum-zoom="$MAX_ZOOM" \
      -l "$LAYER_NAME" \
      --output-to-directory="$OUTPUT_DIR" \
      --force
