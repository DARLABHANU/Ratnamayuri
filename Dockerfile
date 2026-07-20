FROM node:18-alpine

WORKDIR /usr/src/app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source files
COPY backend/ .

EXPOSE 8000

CMD ["node", "src/server.js"]
