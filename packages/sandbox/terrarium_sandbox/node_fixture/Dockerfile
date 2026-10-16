FROM node:22-alpine

WORKDIR /opt/terrarium

COPY package.json ./
RUN npm install --no-audit --no-fund
RUN mkdir -p /root/.ui5/framework/packages/@openui5 \
    && for pkg in sap.m sap.ui.core sap.ui.layout sap.ui.unified themelib_sap_horizon; do \
         mkdir -p /root/.ui5/framework/packages/@openui5/$pkg \
         && ln -sfn /opt/terrarium/node_modules/@openui5/$pkg \
            /root/.ui5/framework/packages/@openui5/$pkg/1.136.1; \
       done

WORKDIR /app

