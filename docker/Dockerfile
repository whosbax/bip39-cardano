FROM debian:latest

WORKDIR /root/app
EXPOSE 8000
COPY . .
RUN mkdir /var/www/

RUN ln -s /root/app/index.html /var/www/index.html
RUN ln -s /root/app/bootstrap.css /var/www/bootstrap.css
RUN ln -s /root/app/qrcode.min.js /var/www/qrcode.min.js

RUN apt-get update
RUN apt-get install -y python3 procps git curl less nano
RUN apt-get update && apt-get install -y  python3 procps git curl less nano gcc g++ make unzip

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt update && apt-get -y install nodejs

RUN curl -fsSL https://deno.land/x/install/install.sh | sh
RUN cd /var/www && rm -rf ./lucid && git clone https://github.com/spacebudz/lucid.git && cd lucid && /root/.deno/bin/deno task build

RUN npm install -g browserify
RUN cd /var/www/ && npm install bip39
RUN cd /var/www/ && browserify -r bip39 -s bip39 -o bip39.browser.js

CMD ["python3", "-m", "http.server", "--directory", "/var/www"]
