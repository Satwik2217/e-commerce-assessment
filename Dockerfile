# Base Image
FROM node:18-alpine

# Set Working Directory
WORKDIR /app

# Install system dependencies needed for Node packages or Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package config files
COPY package*.json ./

# Install clean dependencies
RUN npm ci

# Copy codebase
COPY . .

# Generate Prisma Client code
RUN npx prisma generate

# Build Next.js project
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV production
ENV PORT 3000

# Start server
CMD ["npm", "start"]
