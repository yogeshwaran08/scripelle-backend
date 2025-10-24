# ---------- BUILD STAGE ----------
FROM node:21 AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Generate Prisma client (must happen AFTER schema copy)
RUN npx prisma generate


# ---------- PRODUCTION STAGE ----------
FROM node:21
WORKDIR /app

# Environment variables
ENV PGHOST=fo00oogswwco04gsg4ogc84g \
    PGPORT=5432 \
    PGUSER=postgres \
    PGPASSWORD=aU6eYVklDNWLzEPdQnuHSBMgd50uAucHshJHvcBTL8xa2vm2stdp8BzaXIpCeBEH \
    PGDATABASE=scripelle_db \
    PGPOOL_MAX=10 \
    PGPOOL_IDLE_TIMEOUT_MS=30000 \
    PGPOOL_CONNECTION_TIMEOUT_MS=0 \
    PGSSLMODE=disable \
    PGDEBUG=false \
    NODE_ENV=production \
    JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars \
    JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-min-32-chars \
    JWT_EXPIRES_IN=15m \
    JWT_REFRESH_EXPIRES_IN=7d \
    DATABASE_URL=postgres://postgres:aU6eYVklDNWLzEPdQnuHSBMgd50uAucHshJHvcBTL8xa2vm2stdp8BzaXIpCeBEH@145.223.19.168:5432/postgres?schema=public \
    GEMINI_API_KEY=AIzaSyCVHCCv2a35-LdeCzulMc4VBw4CsOB36A0

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built app, prisma schema, and generated client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 5000

# Run migrations and start server
CMD npx prisma migrate deploy && npm start
