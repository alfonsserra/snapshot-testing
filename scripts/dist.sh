#!/bin/bash
rm -rf dist/

npm run tsc
cp util/mask.js dist/util/