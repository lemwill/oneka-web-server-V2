FROM node:14-alpine

USER node
EXPOSE 1337

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

WORKDIR /home/node

COPY --chown=node:node package*.json ./

RUN npm install

ADD --chown=node:node src ./

CMD [ "node", "app.js"]