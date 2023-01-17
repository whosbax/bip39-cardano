FROM ubuntu:latest
WORKDIR /var/www/app
COPY . .
RUN mkdir -p /var/www/app/
RUN apt update && apt-get -y install npm python3 procps git curl less nano
EXPOSE 8000
RUN npm install -g uglifyjs browserify
RUN npm install bip39
RUN browserify -r bip39 -s bip39 > bip39.browser.js
RUN chmod -R 777 /var/www
CMD ["python3", "-m", "http.server"]
