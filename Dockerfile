FROM node:20-slim AS base
WORKDIR /app
COPY . .

FROM base AS development
RUN cd backend && npm install
ENV NODE_ENV=development
WORKDIR /app/backend
EXPOSE 3000
CMD ["npx", "nodemon", "app.js"]

FROM node:20-slim AS production
WORKDIR /app
COPY . .
WORKDIR /app/backend
RUN npm install --omit=dev
ENV NODE_ENV=production
WORKDIR /app
EXPOSE 3000
CMD ["node", "backend/app.js"]
