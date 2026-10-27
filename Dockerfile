# Build stage
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:24-alpine
# Pull OS security patches newer than the base image, then drop the bundled npm/yarn
# (only needed at build time) so their transitive deps don't ship in the runtime image.
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
       /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=builder /app/dist ./dist
COPY server/ ./server/
EXPOSE 8080
CMD ["node", "server/index.js"]
