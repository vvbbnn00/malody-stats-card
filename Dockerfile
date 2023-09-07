FROM node:18-alpine AS base

FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN adduser -S nodejs
RUN addgroup --system --gid 1001 nodejs

COPY . .
RUN chown -R nodejs:nodejs /app
RUN npm install

USER nodejs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "bin/www"]