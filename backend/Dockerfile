# 開発用（backend：API・定期バッチ）
FROM node:22-slim

# Prisma が使う OpenSSL
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]
