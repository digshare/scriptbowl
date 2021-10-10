FROM node:14

WORKDIR /app

COPY src/ /app/src/
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock

RUN yarn && yarn build

ENV NODE_ENV=production

CMD node bld/main.js
