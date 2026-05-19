FROM node:20-alpine

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all other project files (including .env.local now because it's removed from .dockerignore)
COPY . .

# Set environment variable for Next.js to bind to all network interfaces
ENV HOSTNAME="0.0.0.0"

# Build the Next.js app
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
