/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)"],
    // https://kulshekhar.github.io/ts-jest/docs/guides/esm-support/
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
        "^@/(.*)\\.js$": "<rootDir>/src/$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
}
