#!/bin/bash
COMPONENT=public/src/components
CHAIN_NAME=`echo $1 | sed 's/_/-/g'`
UPPER_CAMEL_CASE=`echo $1 | sed -r 's/(^|_)(.)/\U\2\E/g'`

mkdir ${COMPONENT}/$1

cat > ${COMPONENT}/$1/index.js << EOS
'use strict';
require('./$1.scss');
module.exports = require('./$1');
EOS

touch ${COMPONENT}/$1/$1.html

cat > ${COMPONENT}/$1/$1.scss << EOS
@charset "UTF-8";
EOS

cat > ${COMPONENT}/$1/$1.js << EOS
'use strict';
const ko = require('knockout');
const EventEmitter2 = require('eventemitter2');

class ${UPPER_CAMEL_CASE} extends EventEmitter2 {
    constructor ({eventEmitterOptions = {}} = {}) {
        super(eventEmitterOptions);
    }

    register () {
        ko.components.register('${CHAIN_NAME}', {
            viewModel: this,
            template: require('html!./$1.html')
        });
    }
}


module.exports = ${UPPER_CAMEL_CASE};
EOS

echo "create component ${COMPONENT}/$1"
