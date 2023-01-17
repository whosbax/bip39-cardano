#!/bin/bash
rm -rf ./bip39 ./node_modules
docker build -t tesxtjs  . 
docker run -d -p 80:8000  -v $PWD:/var/www/app/ --name tesxtjs tesxtjs
docker exec -ti --user root  tesxtjs /bin/bash 