const ENV = process.env.APP_ENV || process.env.NODE_ENV;

const config = {
  development: {
    API_HUB_URL: process.env.API_HUB_URL || "https://api-dev.hub.nothingproject.io" || "http://localhost:8081",
    PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://dev-hub.nothingproject.io" || "http://localhost:3001",
  },
  staging: {
    API_HUB_URL: process.env.API_HUB_URL || "https://api-stage.hub.nothingproject.io",
    PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://hub-stage.nothingproject.io",
  },
  production: {
    API_HUB_URL: process.env.API_HUB_URL || "https://api.hub.nothingproject.io",
    PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://hub.nothingproject.io",
  },
};

export default config[ENV] || config.production;