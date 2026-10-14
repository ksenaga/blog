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
# Prisma Client（src/generated/prisma）は Git に含めず、compose ではホストのフォルダを重ねるため、
# 起動時（npm run dev の predev）に生成する

EXPOSE 4000
CMD ["npm", "run", "dev"]
