#!/bin/bash

rm -rf ./dist
mkdir dist
node prep.js > dist/bookmarklet.js
md5sum dist/bookmarklet.js | cut -d ' ' -f1 > dist/bookmarklet.md5
