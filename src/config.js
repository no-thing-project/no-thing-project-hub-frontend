const ENV = process.env.APP_ENV || process.env.NODE_ENV;

const config = {
  local: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "http://localhost:8081",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "http://localhost:3000",
    REACT_APP_WS_URL: process.env.WS_URL || "http://localhost:8081"
  },
  development: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "http://localhost:8081",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "http://localhost:3000",
    REACT_APP_WS_URL: process.env.WS_URL || "http://localhost:8081"
  },
  staging: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api-stage.hub.nothingproject.io",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://gate-stage.nothingproject.io",
    REACT_APP_WS_URL: process.env.WS_URL || "https://api.hub.nothingproject.io"
  },
  production: {
    REACT_APP_HUB_API_URL: process.env.API_HUB_URL || "https://api.hub.nothingproject.io",
    REACT_APP_PUBLIC_HUB_URL: process.env.PUBLIC_HUB_URL || "https://gate.nothingproject.io",
    REACT_APP_WS_URL: process.env.WS_URL || "https://api.hub.nothingproject.io"
  },
};

export default config[ENV] || config.production;