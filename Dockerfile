FROM node:lts-alpine AS node

ENV GITP_PORT=80
ENV GITP_PASS=Welkom123

WORKDIR /usr/src/www
# Copy the server code
COPY /libs ./libs

# Yeah.. only the chart is used.. but it's cheap (lol) storage).
COPY /node_modules ./node_modules

# Copy the site
COPY /www ./www

COPY gitp.js ./gitp.js

EXPOSE $GITP_PORT

CMD ["node", "./gitp.js"]