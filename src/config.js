const ENV = process.env.APP_ENV || process.env.NODE_ENV;

const config = {
  development: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api-dev.hub.nothingproject.io" || "http://localhost:8081",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://dev-hub.nothingproject.io" || "http://localhost:3001",
  },
  staging: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api-stage.hub.nothingproject.io",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://hub-stage.nothingproject.io",
  },
  production: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api.hub.nothingproject.io",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://hub.nothingproject.io",
  },
};

export default config[ENV] || config.production;