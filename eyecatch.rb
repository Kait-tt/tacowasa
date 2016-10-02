serve 'npm start'
port 3000

service 'mysql'

window_width 1920
start_delay 3
no_cache true

env 'NODE_ENG=test'

before_build {
  run 'ndenv local v6.3.1'
  run 'npm i'
  run 'mysql -uroot -e "create database tacowasa"'
  run 'npm run migrate:test'
  run 'npm run build'
}

task(:anonymous) {
  entry_point '/',
  exclude_paths [/.+/]
}
