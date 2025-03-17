import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Snackbar, Alert } from "@mui/material";
import LeftDrawer from "../Drawer/LeftDrawer.jsx";
import Header from "../Header/Header.jsx";
import axios from "axios";
import config from "../../config.js";
import ClassesSection from "./ClassesSection.jsx";
import { useNavigate, useParams } from "react-router-dom";

const ClassesPage = ({ currentUser, onLogout, token }) => {
  const navigate = useNavigate();
  const { gateId } = useParams();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${config.REACT_APP_HUB_API_URL}/api/v1/classes/${gateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data?.content;
        setClasses(data || []);
        setLoading(false);
      })
      .catch((error) => {
        if (error.response?.status === 401) {
          onLogout();
        } else if (error.response?.status === 403) {
          navigate("/home");
        } else {
          setLoading(false);
        }
      });
  }, [gateId, token, onLogout, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#3E435D" }} />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8" }}>
        <LeftDrawer onLogout={onLogout} />
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <Header currentUser={currentUser} token={token} />
          <Box sx={{ flex: 1, p: 3 }}>
            <ClassesSection
              currentUser={currentUser}
              token={token}
              gateId={gateId}
              classes={classes}
            />
          </Box>
        </Box>
      </Box>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert onClose={() => setError("")} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ClassesPage;
