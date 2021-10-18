FROM node:14
WORKDIR /app
RUN apt-get update
COPY . .
RUN npm install -g typescript
RUN npm install -g nodemon
RUN npm install
CMD npm run dev
EXPOSE 8080