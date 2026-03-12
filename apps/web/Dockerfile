FROM node:20-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Copier le code et builder
COPY . .
RUN npm run build

# Image de production
FROM node:20-alpine

WORKDIR /app

# Copier le build et les dépendances de production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
