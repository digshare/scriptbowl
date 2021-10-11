FROM node:14.8

ENV SCRIPTBOWLDIR=/scriptbowl
ENV FILESDIR=/files

WORKDIR $SCRIPTBOWLDIR

COPY src/ $SCRIPTBOWLDIR/src/
COPY package.json $SCRIPTBOWLDIR/package.json
COPY yarn.lock $SCRIPTBOWLDIR/yarn.lock

RUN yarn && yarn build

CMD node $SCRIPTBOWLDIR/bld/main.js
