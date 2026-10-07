FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs
COPY package*.json ./
RUN npm install

# Build client
COPY client/package*.json ./client/
RUN npm install --prefix client

COPY client/ ./client/
RUN npm run build --prefix client

# Prepare server
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

COPY server/ ./server/

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000
CMD ["node", "server/src/index.js"]
