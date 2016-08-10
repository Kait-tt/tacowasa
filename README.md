# tacowasa
Web based digital Kanban tool

# requirements
- node v6
- npm
- scss
- compass
- mysql

# install (development)
```
git clone https://github.com/Kait-tt/tacowasa
mysql -uroot -e "create database tacowasa_development"
$(npm bin)/sequelize db:migrate
```

# scripts
- `npm run test:all`
- `npm run test:cover`