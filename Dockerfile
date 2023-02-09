# syntax=docker/dockerfile:1.4
FROM node:18 as deps

WORKDIR /alice
COPY --link .yarn ./.yarn
COPY --link .yarnrc.yml package.json yarn.lock ./
RUN yarn install

FROM deps as build

COPY --link tsconfig.json ./
COPY --link src ./src
RUN yarn tsc

FROM node:18-slim
COPY --link .yarn ./.yarn
COPY --link .yarnrc.yml package.json yarn.lock ./
COPY --link tsconfig.json ./
COPY --link README.md ./
COPY --link src ./src
COPY --from=deps --link /alice/node_modules ./node_modules
COPY --from=build --link /alice/dist /alice/dist

CMD ["bash", "-c", "yarn typeorm migration:run && node dist/backend/server"]