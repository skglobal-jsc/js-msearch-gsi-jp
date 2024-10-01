#!/usr/bin/env bash

set -eu
# Download the cities mesh data from https://www.stat.go.jp/data/mesh/m_itiran.html
# There are 47 files, one for each prefecture in Japan.
# The files are in Shift-JIS encoding.
# The files are named like "xx.csv" where xx is a number from 01 to 47.

# Loop through the numbers 1 to 47
for i in $(seq -w 1 47); do
    # Download the file
    printf "Downloading file %s.csv\n" "$i"
    wget -O "jis_$i.csv" "https://www.stat.go.jp/data/mesh/csv/$i.csv"

    # Convert the file from Shift-JIS to UTF-8
    iconv -f SHIFT-JIS -t UTF-8 "jis_$i.csv" > "$i.csv"

    rm "jis_$i.csv"
done
