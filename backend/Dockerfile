# backend/Dockerfile
FROM node:24-alpine

# Install runtime dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    tini

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install ALL dependencies (not just production, since you might need dev deps)
RUN npm install --legacy-peer-deps && \
    npm cache clean --force

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start with Node directly (simpler and more reliable)
CMD ["node", "server.js"]
