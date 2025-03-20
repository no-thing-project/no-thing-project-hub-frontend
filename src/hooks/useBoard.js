// hooks/useBoard.js
import { useState, useCallback, useRef } from "react";

export const BOARD_SIZE = 10000;
const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const ZOOM_SENSITIVITY = 0.001;

export const useBoardInteraction = (boardRef) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const isDragging = useRef(false);

  const centerBoard = useCallback(() => {
    if (boardRef.current) {
      const { clientWidth, clientHeight } = boardRef.current;
      setOffset({
        x: clientWidth / 2 - (BOARD_SIZE * scale) / 2,
        y: clientHeight / 2 - (BOARD_SIZE * scale) / 2,
      });
    }
  }, [boardRef, scale]);

  // Adjust the offset when zooming to keep the cursor position fixed
  const adjustOffsetForZoom = useCallback(
    (cursorX, cursorY, oldScale, newScale) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const relativeX = cursorX - rect.left;
      const relativeY = cursorY - rect.top;
      const boardX = (relativeX - offset.x) / oldScale;
      const boardY = (relativeY - offset.y) / oldScale;
      setOffset({
        x: relativeX - boardX * newScale,
        y: relativeY - boardY * newScale,
      });
    },
    [offset, boardRef]
  );

  // Handle zooming in or out
  const handleZoom = useCallback(
    (cursorX, cursorY, delta) => {
      setScale((prev) => {
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta));
        adjustOffsetForZoom(cursorX, cursorY, prev, newScale);
        return newScale;
      });
    },
    [adjustOffsetForZoom]
  );

  // Handle zoom buttons (in/out)
  const handleZoomButton = useCallback(
    (direction) => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      handleZoom(centerX, centerY, direction === "in" ? ZOOM_STEP : -ZOOM_STEP);
    },
    [boardRef, handleZoom]
  );

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      if (!boardRef.current) return;
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      handleZoom(e.clientX, e.clientY, delta);
    },
    [boardRef, handleZoom]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (
        e.target.closest(
          ".tweet-card, .tweet-popup, .return-button, .zoom-controls, .board-top-controls"
        )
      )
        return;
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      isDragging.current = false;
      setDragging(false);
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragStart.current) return;
      const dx = (e.clientX - dragStart.current.x) / scale;
      const dy = (e.clientY - dragStart.current.y) / scale;
      if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging.current = true;
        setDragging(true);
      }
      if (isDragging.current) {
        setOffset({
          x: dragStart.current.offsetX + dx * scale,
          y: dragStart.current.offsetY + dy * scale,
        });
      }
    },
    [scale]
  );

  const handleMouseUp = useCallback(
    (e, onClick) => {
      if (!isDragging.current && dragStart.current && onClick && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const clickX = e.clientX - boardRect.left;
        const clickY = e.clientY - boardRect.top;
        const tweetX = (clickX - offset.x) / scale;
        const tweetY = (clickY - offset.y) / scale;

        // Ensure the tweet is within the board boundaries
        if (
          tweetX >= 0 &&
          tweetX <= BOARD_SIZE &&
          tweetY >= 0 &&
          tweetY <= BOARD_SIZE
        ) {
          onClick(tweetX, tweetY);
        }
      }
      dragStart.current = null;
      isDragging.current = false;
      setDragging(false);
    },
    [boardRef, offset, scale]
  );

  return {
    scale,
    offset,
    setOffset,
    dragging,
    centerBoard,
    handleZoomButton,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};