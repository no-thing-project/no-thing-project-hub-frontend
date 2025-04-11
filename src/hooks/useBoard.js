import { useState, useCallback, useEffect, useRef } from "react";

export const BOARD_SIZE = 10000;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const ZOOM_SENSITIVITY = 0.001;
const MOVE_STEP = 50;

export const useBoardInteraction = (boardRef) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef(null);
  const touchStart = useRef(null);

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const clampOffset = useCallback((newOffset) => {
    const scaledSize = BOARD_SIZE * scaleRef.current;
    const minX = window.innerWidth - scaledSize;
    const minY = window.innerHeight - scaledSize;
    return {
      x: Math.max(minX, Math.min(0, newOffset.x)),
      y: Math.max(minY, Math.min(0, newOffset.y)),
    };
  }, []);

  const centerBoard = useCallback(() => {
    const newOffset = {
      x: window.innerWidth / 2 - (BOARD_SIZE * scaleRef.current) / 2,
      y: window.innerHeight / 2 - (BOARD_SIZE * scaleRef.current) / 2,
    };
    setOffset(clampOffset(newOffset));
  }, [clampOffset]);

  const handleZoom = useCallback((delta, mouseX, mouseY) => {
    setScale((prevScale) => {
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevScale + delta));
      const currentOffset = offsetRef.current;
      let newOffset;
      if (mouseX !== undefined && mouseY !== undefined) {
        const boardX = (mouseX - currentOffset.x) / prevScale;
        const boardY = (mouseY - currentOffset.y) / prevScale;
        newOffset = clampOffset({
          x: mouseX - boardX * newScale,
          y: mouseY - boardY * newScale,
        });
      } else {
        newOffset = clampOffset({
          x: window.innerWidth / 2 - (BOARD_SIZE * newScale) / 2,
          y: window.innerHeight / 2 - (BOARD_SIZE * newScale) / 2,
        });
      }
      setOffset(newOffset);
      return newScale;
    });
  }, [clampOffset]);

  const handleZoomButton = useCallback(
    (direction) => {
      if (direction === "reset") {
        setScale(1);
        centerBoard();
      } else {
        const delta = direction === "in" ? ZOOM_STEP : -ZOOM_STEP;
        handleZoom(delta, window.innerWidth / 2, window.innerHeight / 2);
      }
    },
    [handleZoom, centerBoard]
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      handleZoom(delta, e.clientX, e.clientY);
    },
    [handleZoom]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.target.closest(".tweet-card, .tweet-popup, .return-button, .user_points, .zoom-controls, .board-top-controls")) return;
      dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
      isDragging.current = false;
    },
    [offset]
  );

  const handleMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      setOffset(clampOffset({ x: dragStart.current.offsetX + dx, y: dragStart.current.offsetY + dy }));
    }
  }, [clampOffset]);

  const handleMouseUp = useCallback(
    (e, onClick) => {
      if (!isDragging.current && dragStart.current && onClick && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const clickX = e.clientX - boardRect.left;
        const clickY = e.clientY - boardRect.top;
        const tweetX = (clickX - offset.x) / scale;
        const tweetY = (clickY - offset.y) / scale;
        if (tweetX >= 0 && tweetX <= BOARD_SIZE && tweetY >= 0 && tweetY <= BOARD_SIZE) {
          onClick(tweetX, tweetY);
        }
      }
      dragStart.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  const handleTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY, offsetX: offset.x, offsetY: offset.y };
        isDragging.current = false;
      }
    },
    [offset]
  );

  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging.current = true;
    }
    if (isDragging.current) {
      setOffset(clampOffset({ x: touchStart.current.offsetX + dx, y: touchStart.current.offsetY + dy }));
    }
  }, [clampOffset]);

  const handleTouchEnd = useCallback(
    (e, onClick) => {
      if (!isDragging.current && touchStart.current && onClick && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const touch = e.changedTouches[0];
        const clickX = touch.clientX - boardRect.left;
        const clickY = touch.clientY - boardRect.top;
        const tweetX = (clickX - offset.x) / scale;
        const tweetY = (clickY - offset.y) / scale;
        if (tweetX >= 0 && tweetX <= BOARD_SIZE && tweetY >= 0 && tweetY <= BOARD_SIZE) {
          onClick(tweetX, tweetY);
        }
      }
      touchStart.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  const handleKeyDown = useCallback(
    (e) => {
      switch (e.key) {
        case '+':
        case '=':
          handleZoom(ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2);
          break;
        case '-':
          handleZoom(-ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2);
          break;
        case 'ArrowUp':
          setOffset((prev) => clampOffset({ ...prev, y: prev.y + MOVE_STEP }));
          break;
        case 'ArrowDown':
          setOffset((prev) => clampOffset({ ...prev, y: prev.y - MOVE_STEP }));
          break;
        case 'ArrowLeft':
          setOffset((prev) => clampOffset({ ...prev, x: prev.x + MOVE_STEP }));
          break;
        case 'ArrowRight':
          setOffset((prev) => clampOffset({ ...prev, x: prev.x - MOVE_STEP }));
          break;
        default:
          break;
      }
    },
    [handleZoom, clampOffset]
  );

  useEffect(() => {
    const boardElement = boardRef.current;
    if (boardElement) {
      boardElement.addEventListener("wheel", handleWheel, { passive: false });
      boardElement.addEventListener("mousedown", handleMouseDown);
      boardElement.addEventListener("touchstart", handleTouchStart, { passive: true });
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (boardElement) {
        boardElement.removeEventListener("wheel", handleWheel);
        boardElement.removeEventListener("mousedown", handleMouseDown);
        boardElement.removeEventListener("touchstart", handleTouchStart);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd, handleKeyDown, boardRef]);

  return {
    scale,
    offset,
    setOffset,
    dragging: isDragging.current,
    centerBoard,
    handleZoomButton,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};