FROM node:10-alpine

VOLUME [ "/build" ]

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm run build" ]