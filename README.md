# tacowasa
Web based digital Kanban tool

[![Build Status](https://travis-ci.org/Kait-tt/tacowasa.svg?branch=master)](https://travis-ci.org/Kait-tt/tacowasa)
[![Coverage Status](https://coveralls.io/repos/github/Kait-tt/tacowasa/badge.svg?branch=master)](https://coveralls.io/github/Kait-tt/tacowasa?branch=master)

# requirements
- node v6
- npm
- mysql

# install
## development
```
mysql -uroot -p -e "create database tacowasa_development"
git clone https://github.com/Kait-tt/tacowasa
cd tacowasa
cp config/default.json config/development.json
# edit config/development.json
npm install
npm run migrate
npm run build
npm run start
```

## production
```
mysql -uroot -p -e "create database tacowasa"
git clone https://github.com/Kait-tt/tacowasa
cd tacowasa
cp config/default.json config/production.json
# edit config/production.json
npm install --production
$(npm bin)/cross-env NODE_ENV=production npm run migrate
$(npm bin)/cross-env NODE_ENV=production npm run build
npm run start
```

# test
require: install.development
```
mysql -u root -p -e "create database tacowasa_test"
cp config/default.json config/test.json
# edit config/test.json
npm run migrate:test
npm run test:cover
```

# scripts
see `package.json`

- `npm run start` : run web server
- `npm run build` : build public files with webpack
- `npm run watch` : watch to build public files
- `npm run lint:all` : run eslint for all js files
- `npm run migrate` : migration database
- `npm run migrate:test` : migration test database
- `npm run test:all` : test all spec files
- `npm run test:cover` : test all spec files and calc coverage
