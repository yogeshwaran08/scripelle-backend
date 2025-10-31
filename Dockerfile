FROM node:21 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN npx prisma generate


FROM node:21
WORKDIR /app

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
    JWT_SECRET=uoQHtyEfr2FwcW879A8sTFMyztyzqM8L3DoWRm14rWmL0e217tYRdcNBXuZnaqbR \
    JWT_REFRESH_SECRET=uoQHtyEfr2FwcW879A8sTFMyztyzqM8L3DoWRm14rWmL0e217tYRdcNBXuZnaqbR \
    JWT_EXPIRES_IN=15m \
    JWT_REFRESH_EXPIRES_IN=7d \
    DATABASE_URL=postgres://postgres:aU6eYVklDNWLzEPdQnuHSBMgd50uAucHshJHvcBTL8xa2vm2stdp8BzaXIpCeBEH@145.223.19.168:5432/scripelle_db?schema=public \
    GEMINI_API_KEY=AIzaSyCVHCCv2a35-LdeCzulMc4VBw4CsOB36A0 \
    CLIENT_URL=https://early-access.scripelle.com \
    GOOGLE_CLIENT_ID=k0o019cdedlk60u30i845njfv9up6o0c \
    GOOGLE_CLIENT_SECRET=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 \
    SESSION_SECRET=uoQHtyEfr2FwcW879A8sTFMyztyzqM8L3DoWRm14rWmL0e217tYRdcNBXuZnaqbR


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
