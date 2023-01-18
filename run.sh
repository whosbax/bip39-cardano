#!/bin/bash
exist=$( docker ps -a | grep -c "js-cardano-wallet" )
if [ "$exist" -lt 1 ] 
then
        echo "build docker imgage..."
        echo "volume: $PWD:/root/app/"
        docker build --no-cache -t js-cardano-wallet .
        docker run -d -p 80:8000 -v $PWD:/root/app/ --name js-cardano-wallet js-cardano-wallet
fi
running=$( docker ps | grep -c "js-cardano-wallet" )
if [ "$running" -lt 1 ] 
then
    echo "start docker js-cardano-wallet"
    docker start js-cardano-wallet
else
    echo "js-cardano-wallet is running"    
fi

docker exec -ti --user root  js-cardano-wallet /bin/bash
