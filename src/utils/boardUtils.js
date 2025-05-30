export const getBoardCategoryName = (board, boardClasses) =>
  board.category || boardClasses[board.board_id]?.name || "Nothing";

export const getCategoryStyles = (board, boardClasses) => {
  const color = boardClasses[board.board_id]?.color || "#3E435D";
  return { backgroundColor: color, color: "#fff" };
};

// Видаляємо JSX і залишаємо лише логіку
export const getVisibilityIconData = (visibility) => ({
  icon: visibility === "Private" ? "Lock" : "Public",
  color: visibility === "Private" ? "#990000" : "#3E435D",
});