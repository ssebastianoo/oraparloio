FROM oven/bun:1.3

WORKDIR /app
COPY package*.json ./
RUN bun i --production
COPY . .

CMD ["bun", "main.ts"]