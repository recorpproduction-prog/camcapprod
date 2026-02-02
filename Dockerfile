# Build from repo root – uses existing sop-shared-backend folder only
FROM node:18-slim

WORKDIR /app

COPY sop-shared-backend/package.json ./
RUN npm install --production

COPY sop-shared-backend/index.js ./

EXPOSE 8080
CMD ["node", "index.js"]
