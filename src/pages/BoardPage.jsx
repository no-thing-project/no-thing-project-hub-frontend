// src/pages/BoardPage.jsx
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import Board from "../components/social-features/Board/Board";
import { useBoards } from "../hooks/useBoards";
import ErrorBoundary from "../components/Layout/ErrorBoudary";
const ErrorFallback = ({ error }) => (
  <ErrorMessage message={error.message || "Something went wrong in BoardPage"} />
);

const BoardPage = ({ currentUser, onLogout, token }) => {
  const { board_id } = useParams();
  const navigate = useNavigate();
  const { fetchBoard, board, loading, error } = useBoards(
    token,
    null, // No gate_id for this context
    board_id, // Initial board ID to fetch
    onLogout,
    navigate
  );

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (board_id && token) {
      fetchBoard(board_id, signal);
    }

    return () => controller.abort();
  }, [board_id, token, fetchBoard]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!board) return <ErrorMessage message="Board not found" />;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
        <Board
          token={token}
          currentUser={currentUser}
          onLogout={onLogout}
          boardId={board_id}
          boardTitle={board.name || "Untitled Board"} // Pass the board title
        />
      </AppLayout>
    </ErrorBoundary>
  );
};

export default BoardPage;