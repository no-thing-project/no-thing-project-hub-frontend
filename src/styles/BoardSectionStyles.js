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

export const cardGridStyles = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
};

export const cardStyles = {
  cursor: "pointer",
  borderRadius: 2,
  p: 2,
  transition: "all 0.3s ease-in-out",
  backgroundColor: "background.paper",
  boxShadow: "none",
  ":hover": {
    backgroundColor: "background.hover",
    transform: "translateY(-2px)",
    transition: "all 0.3s ease-in-out",
    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
  },
};