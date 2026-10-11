# Multi-stage hardened production Dockerfile for FuturaSculptAI Executive Cockpit
# Conforms to Google Cloud SAIF and CIS Docker Security Benchmarks (Unprivileged NGINX Alpine)

# Stage 1: Compile TypeScript & Vite production bundle
FROM node:22-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve static bundle via unprivileged Alpine NGINX
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Remove default configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom reverse proxy & SPA configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder
COPY --from=builder /build/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:8080/web-health || exit 1

CMD ["nginx", "-g", "daemon off;"]
