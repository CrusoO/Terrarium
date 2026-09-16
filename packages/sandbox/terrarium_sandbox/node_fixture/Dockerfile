FROM node:22-alpine

WORKDIR /opt/terrarium

COPY package.json ./
RUN npm install --no-audit --no-fund

WORKDIR /app

