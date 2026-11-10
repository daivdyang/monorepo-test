# syntax=docker/dockerfile:1
# 同一份 Dockerfile 建置前台或後台：
#   docker build --build-arg APP=web   -t mono-web .
#   docker build --build-arg APP=admin -t mono-admin .
ARG NODE_VERSION=24.17.0

FROM node:${NODE_VERSION}-slim AS base
RUN corepack enable
WORKDIR /repo

# ---------- 1. prune：只取出目標 app 需要的子集合 ----------
FROM base AS pruner
ARG APP
COPY . .
# turbo 版本與 catalog 一致
RUN npx --yes turbo@2.11.10 prune @mono/${APP} --docker

# ---------- 2. install：只依 package.json + lockfile 安裝（可被 Docker layer 快取） ----------
FROM base AS installer
COPY --from=pruner /repo/out/json/ .
# 原始碼尚未複製，postinstall (nuxt prepare) 無意義，先略過；nuxt build 會自行 prepare
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---------- 3. build：複製原始碼並建置 ----------
FROM installer AS builder
ARG APP
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo run build --filter=@mono/${APP}

# ---------- 4. runner：只帶 .output（Nitro 已把依賴打包進去） ----------
FROM node:${NODE_VERSION}-slim AS runner
ARG APP
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NUXT_DB_PATH=/data/mono.db
COPY --from=builder /repo/apps/${APP}/.output ./.output
# 先建立並交給 node 使用者，named volume 首次掛載時會沿用此擁有者，否則非 root 無法寫入 SQLite
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]
EXPOSE 3000
USER node
CMD ["node", ".output/server/index.mjs"]
