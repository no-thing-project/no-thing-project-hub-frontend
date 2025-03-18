export const containerStyles = {
    maxWidth: 1500,
    margin: "0 auto",
    p: 2,
  };
  
  export const buttonStyles = {
    textTransform: "none",
    fontWeight: 500,
    borderRadius: 0.8,
    boxShadow: "none",
    padding: "10px 20px",
    transition: "all 0.5s ease",
    backgroundColor: "background.button",
    color: "background.paper",
    ":hover": {
      boxShadow: "none",
      backgroundColor: "background.default",
      color: "text.primary",
      transition: "all 0.5s ease",
    },
  };
  
  export const filtersStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    p: 3,
    backgroundColor: "background.paper",
    borderRadius: 1.5,
    mb: 3,
  };
  
  export const cardGridStyles = {
    display: "grid",
    gap: 3,
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  };
  
  export const cardStyles = {
    borderRadius: 1.5,
    cursor: "pointer",
    boxShadow: "none",
    transition: "all 0.3s ease-in-out",
    backgroundColor: "background.paper",
    ":hover": {
      backgroundColor: "background.hover",
      transform: "translateY(-2px)",
      transition: "all 0.3s ease-in-out",
      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    },
  };
  
  export const cardActionAreaStyles = {
    p: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 200,
  };
  
  export const chipStyles = (backgroundColor) => ({
    borderRadius: 1,
    fontSize: 12,
    height: 24,
    backgroundColor,
    color: "#fff",
  });