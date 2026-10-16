FROM node:lts-alpine AS node

LABEL version="1.0.1"
LABEL description="Glow in the π"

ENV GITP_PORT=8654
ENV GITP_PASS=Welkom123

WORKDIR /usr/src/www
# Copy the server code
COPY /libs ./libs

# Yeah.. only the chart is used.. but it's cheap (lol) storage).
COPY /node_modules ./node_modules

# Copy the site
COPY /www ./www

COPY gitp.js ./gitp.js

EXPOSE 8654

CMD ["node", "./gitp.js"]