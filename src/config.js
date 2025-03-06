const ENV = process.env.APP_ENV || process.env.NODE_ENV;

const config = {
  development: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api-dev.hub.nothingproject.io" || "http://localhost:8081",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://dev-hub.nothingproject.io" || "http://localhost:3001",
    REACT_APP_WS_URL: process.env.WS_URL || ""
  },
  staging: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api-stage.hub.nothingproject.io",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://hub-stage.nothingproject.io",
    REACT_APP_WS_URL: process.env.WS_URL || ""
  },
  production: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api.hub.nothingproject.io",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://hub.nothingproject.io",
    REACT_APP_WS_URL: process.env.WS_URL || ""
  },
};

export default config[ENV] || config.production;