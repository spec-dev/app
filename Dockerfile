# --- Builder ----------------------------------------

FROM node:16-alpine AS builder
RUN apk add --no-cache --virtual .gyp g++ make py3-pip

RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY package.json ./
COPY src ./src
COPY public ./public

RUN npm install
RUN npm run build

# --- Runner -----------------------------------------

FROM nginx:stable-alpine

COPY --from=builder /usr/app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]