### Build stage
FROM node:18-alpine AS build
WORKDIR /usr/src/app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

### Runtime stage
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app

# Install production deps only
COPY package.json package-lock.json* ./
RUN npm ci --production --silent

# Copy built files
COPY --from=build /usr/src/app/dist ./dist
# Copy static public files so express.static('public') can serve the UI
COPY --from=build /usr/src/app/public ./public

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
