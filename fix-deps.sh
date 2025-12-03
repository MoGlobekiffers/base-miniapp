#!/bin/bash

rm -rf node_modules package-lock.json

npm cache clean --force

npm install @coinbase/onchainkit@1.0.7 --save

npm install react@18.3.1 react-dom@18.3.1 next@15.0.5 --save

npm install react-server-dom-webpack@18.3.1 react-server-dom-turbopack@18.3.1 --save

npm install

