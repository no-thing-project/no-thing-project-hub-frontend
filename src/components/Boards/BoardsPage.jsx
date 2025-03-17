import React, { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import LeftDrawer from "../Drawer/LeftDrawer";
import Header from "../Header/Header.jsx";
import BoardsSection from "./BoardsSection.jsx";
import axios from "axios";
import config from "../../config";

const BoardsPage = ({ currentUser, boards, onLogout, token }) => {
  // Переконуємось, що boards – масив
  const boardsList = Array.isArray(boards) ? boards : [];
  // Зберігаємо дані класів для кожного борду
  const [boardClasses, setBoardClasses] = useState({});

  useEffect(() => {
    // Для кожного борду з gate_id та class_id, який ще не завантажено – отримуємо дані з API
    boardsList.forEach((board) => {
      if (board.gate_id && board.class_id && !boardClasses[board.board_id]) {
        axios
          .get(
            `${config.REACT_APP_HUB_API_URL}/api/v1/classes/${board.gate_id}/${board.class_id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
          .then((res) => {
            const classData = res.data?.content;
            if (classData) {
              setBoardClasses((prev) => ({
                ...prev,
                [board.board_id]: classData,
              }));
            }
          })
          .catch((error) => {
            console.error(
              "Помилка при отриманні класу для борду",
              board.board_id,
              error
            );
          });
      }
    });
  }, [boardsList, token]);

  // Визначаємо, чи завантажено всі дані класів
  const isLoading = boardsList.some(
    (board) => board.gate_id && board.class_id && !boardClasses[board.board_id]
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} sx={{ color: "#3E435D" }}/>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F8F8" }}>
      <LeftDrawer onLogout={onLogout} />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header currentUser={currentUser} token={token} />
        <Box sx={{ flex: 1, p: 3 }}>
          <BoardsSection
            currentUser={currentUser}
            boards={boards}
            boardClasses={boardClasses}
            token={token}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default BoardsPage;
