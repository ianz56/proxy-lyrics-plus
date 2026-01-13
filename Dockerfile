FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Default port, can be overridden by environment variable
ENV PORT=5555

EXPOSE 5555

CMD [ "node", "server.js" ]
