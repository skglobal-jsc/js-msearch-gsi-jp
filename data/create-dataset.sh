#!/usr/bin/env bash

OUTDIR="./code"
if [ ! -e $OUTDIR ] ; then
    echo $OUTDIR does not exist!
fi

CUR_DIR=$(pwd)

set -eu

cd $OUTDIR
../download-cities-mesh-data.sh

cd $CUR_DIR
