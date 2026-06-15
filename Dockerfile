FROM node:20-slim

WORKDIR /app

COPY . .

WORKDIR /app/backend
RUN npm install --omit=dev

ENV NODE_ENV=production

EXPOSE 3000

WORKDIR /app
CMD ["node", "backend/app.js"]
