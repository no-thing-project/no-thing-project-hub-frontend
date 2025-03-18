import React, { useEffect, useState } from "react";
import AppLayout from "../components/Layout/AppLayout";
import BoardsSection from "../sections/BoardsSection/BoardsSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import { fetchBoardClasses } from "../utils/apiPages";

const BoardsPage = ({ currentUser, boards, onLogout, token }) => {
  const boardsList = Array.isArray(boards) ? boards : [];
  const [boardClasses, setBoardClasses] = useState({});

  useEffect(() => {
    boardsList.forEach((board) => {
      if (board.gate_id && board.class_id && !boardClasses[board.board_id]) {
        fetchBoardClasses(board.gate_id, board.class_id, token)
          .then((classData) => {
            if (classData) {
              setBoardClasses((prev) => ({ ...prev, [board.board_id]: classData }));
            }
          })
          .catch((error) => {
            console.error("Помилка при отриманні класу для борду", board.board_id, error);
          });
      }
    });
  }, [boardsList, token]);

  const isLoading = boardsList.some(
    (board) => board.gate_id && board.class_id && !boardClasses[board.board_id]
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <BoardsSection
        currentUser={currentUser}
        boards={boards}
        boardClasses={boardClasses}
        token={token}
      />
    </AppLayout>
  );
};

export default BoardsPage;