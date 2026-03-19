FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S -g 101 nodejs \
    && adduser -S -D -H -u 100 -G nodejs nodejs

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p cache database && chown -R nodejs:nodejs /app

EXPOSE 3000

USER nodejs

CMD ["node", "bin/www"]
