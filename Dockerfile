# syntax=docker/dockerfile:1.4
FROM node:18 as deps

WORKDIR /alice
COPY --link .yarn ./.yarn
COPY --link .yarnrc.yml package.json yarn.lock ./
COPY --link shim ./shim
RUN yarn install

FROM deps as build

COPY --link tsconfig.json ./
COPY --link src ./src
RUN yarn tsc

FROM node:18-slim
WORKDIR /alice
COPY --link .yarn ./.yarn
COPY --link .yarnrc.yml package.json yarn.lock ./
COPY --link tsconfig.json ./
COPY --link README.md ./
COPY --link src ./src
COPY --link shim ./shim
COPY --link resources ./resources
COPY --from=deps --link /alice/node_modules ./node_modules
COPY --from=deps --link /alice/.yarn/install-state.gz .yarn/
COPY --from=build --link /alice/dist /alice/dist

CMD ["bash", "-c", "yarn docker:typeorm migration:run && node dist/backend/both.js"]
