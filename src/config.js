const ENV = process.env.APP_ENV || process.env.NODE_ENV;

const config = {
  development: {
    REACT_APP_HUB_API_URL: process.env.REACT_APP_HUB_API_URL || "",
    PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:3000",
  },
  staging: {
    REACT_APP_HUB_API_URL: process.env.REACT_APP_HUB_API_URL || "",
    PUBLIC_URL: process.env.PUBLIC_URL || "https://hub.nothingproject.io",
  },
  production: {
    REACT_APP_HUB_API_URL: process.env.REACT_APP_HUB_API_URL || "",
    PUBLIC_URL: process.env.PUBLIC_URL || "https://hub.nothingproject.io",

  },
};

export default config[ENV] || config.production;