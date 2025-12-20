FROM oven/bun:1.3-debian

RUN apt-get update && apt-get install -y \
    fontconfig \
    fonts-dejavu-core \
    fonts-noto \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN bun i --production
COPY . .

CMD ["bun", "main.ts"]