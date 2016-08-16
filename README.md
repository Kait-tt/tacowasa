# tacowasa
Web based digital Kanban tool

[![Build Status](https://travis-ci.org/Kait-tt/tacowasa.svg?branch=master)](https://travis-ci.org/Kait-tt/tacowasa)
[![Coverage Status](https://coveralls.io/repos/github/Kait-tt/tacowasa/badge.svg?branch=master)](https://coveralls.io/github/Kait-tt/tacowasa?branch=master)

# requirements
- node v6
- npm
- scss
- compass
- mysql

# install
## development
```
mysql -uroot -p -e "create database tacowasa_development"
git clone https://github.com/Kait-tt/tacowasa
cd tacowasa
npm install
npm run migrate
```

## production
```
mysql -uroot -p -e "create database tacowasa"
git clone https://github.com/Kait-tt/tacowasa
cd tacowasa
npm install --production
$(npm bin)/cross-env NODE_ENV=production npm run migrate
```

# test
require: install.development
```
mysql -u root -p -e "create database tacowasa_test"
npm run migrate:test
npm run test:cover
```

# scripts
- `npm run migrate`: migration database
- `npm run migrate:test` migration test database
- `npm run test` : test specified files (e.g., `npm run test spec/schemes/project._spec.js`
- `npm run test:all` : test all spec files
- `npm run test:cover` : test all spec files and calc coverage
