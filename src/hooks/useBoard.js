import { useState, useCallback, useEffect, useRef } from "react";
import { throttle } from "lodash";

// Board constants
export const BOARD_SIZE = 10000;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.05;
const ZOOM_SENSITIVITY = 0.001;
const MOVE_STEP = 50;
const ANIMATION_DURATION = 300;

/**
 * Custom hook for handling board interactions (pan, zoom, drag).
 * @param {React.RefObject} boardRef - Reference to the board container element.
 * @returns {Object} Interaction state and handlers.
 */
export const useBoardInteraction = (boardRef) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef(null);
  const touchStart = useRef(null);
  const pinchStartDistance = useRef(null);
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const animationFrame = useRef(null);

  useEffect(() => {
    scaleRef.current = scale;
    offsetRef.current = offset;
  }, [scale, offset]);

  /**
   * Clamps offset to keep the board within the viewport.
   * @param {Object} newOffset - The new offset {x, y}.
   * @returns {Object} Clamped offset.
   */
  const clampOffset = useCallback((newOffset) => {
    const scaledSize = BOARD_SIZE * scaleRef.current;
    const minX = window.innerWidth - scaledSize;
    const minY = window.innerHeight - scaledSize;
    return {
      x: Math.max(minX, Math.min(0, newOffset.x)),
      y: Math.max(minY, Math.min(0, newOffset.y)),
    };
  }, []);

  /**
   * Centers the board in the viewport.
   */
  const centerBoard = useCallback(() => {
    const newOffset = {
      x: window.innerWidth / 2 - (BOARD_SIZE * scaleRef.current) / 2,
      y: window.innerHeight / 2 - (BOARD_SIZE * scaleRef.current) / 2,
    };
    setOffset(clampOffset(newOffset));
  }, [clampOffset]);

  /**
   * Animates zoom and offset to reset (100%).
   */
  const animateReset = useCallback(() => {
    const startScale = scaleRef.current;
    const startOffset = offsetRef.current;
    const targetScale = 1;
    const targetOffset = {
      x: window.innerWidth / 2 - (BOARD_SIZE * targetScale) / 2,
      y: window.innerHeight / 2 - (BOARD_SIZE * targetScale) / 2,
    };
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const newScale = startScale + (targetScale - startScale) * easedProgress;
      const newOffset = {
        x: startOffset.x + (targetOffset.x - startOffset.x) * easedProgress,
        y: startOffset.y + (targetOffset.y - startOffset.y) * easedProgress,
      };

      setScale(newScale);
      setOffset(clampOffset(newOffset));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        animationFrame.current = null;
      }
    };

    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(animate);
  }, [clampOffset]);

  /**
   * Handles zoom changes.
   * @param {number} delta - Zoom delta.
   * @param {number} [mouseX] - Mouse X position for zoom focus.
   * @param {number} [mouseY] - Mouse Y position for zoom focus.
   */
  const handleZoom = useCallback((delta, mouseX, mouseY) => {
    setScale((prevScale) => {
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevScale + delta));
      const currentOffset = offsetRef.current;
      const newOffset = clampOffset({
        x: mouseX !== undefined
          ? mouseX - ((mouseX - currentOffset.x) / prevScale) * newScale
          : window.innerWidth / 2 - (BOARD_SIZE * newScale) / 2,
        y: mouseY !== undefined
          ? mouseY - ((mouseY - currentOffset.y) / prevScale) * newScale
          : window.innerHeight / 2 - (BOARD_SIZE * newScale) / 2,
      });
      setOffset(newOffset);
      return newScale;
    });
  }, [clampOffset]);

  const handleZoomButton = useCallback((direction) => {
    if (direction === "reset") {
      animateReset();
    } else {
      const delta = direction === "in" ? ZOOM_STEP : -ZOOM_STEP;
      handleZoom(delta, window.innerWidth / 2, window.innerHeight / 2);
    }
  }, [handleZoom, animateReset]);

  const handleWheel = useCallback(
    throttle((e) => {
      if (!boardRef.current) return;
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      handleZoom(delta, e.clientX, e.clientY);
    }, 50),
    [handleZoom, boardRef]
  );

  const handleMouseDown = useCallback((e) => {
    if (!boardRef.current || e.target.closest(".tweet-card, .tweet-popup, .MuiIconButton-root")) return;
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
    isDragging.current = false;
  }, [offset]);

  const handleMouseMove = useCallback(
    throttle((e) => {
      if (!dragStart.current || !boardRef.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging.current = true;
      }
      if (isDragging.current) {
        setOffset(clampOffset({ x: dragStart.current.offsetX + dx, y: dragStart.current.offsetY + dy }));
      }
    }, 10),
    [clampOffset]
  );

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

  const handleTouchStart = useCallback((e) => {
    if (!boardRef.current) return;
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, offsetX: offset.x, offsetY: offset.y };
      isDragging.current = false;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, [offset]);

  const handleTouchMove = useCallback(
    throttle((e) => {
      if (!boardRef.current) return;
      if (e.touches.length === 1 && touchStart.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          isDragging.current = true;
        }
        if (isDragging.current) {
          setOffset(clampOffset({ x: touchStart.current.offsetX + dx, y: touchStart.current.offsetY + dy }));
        }
      } else if (e.touches.length === 2 && pinchStartDistance.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const delta = (currentDistance - pinchStartDistance.current) * ZOOM_SENSITIVITY;
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        handleZoom(delta, centerX, centerY);
        pinchStartDistance.current = currentDistance;
      }
    }, 10),
    [clampOffset, handleZoom]
  );

  const handleTouchEnd = useCallback(
    (e, onClick) => {
      if (
        !isDragging.current &&
        touchStart.current &&
        onClick &&
        boardRef.current &&
        e.changedTouches.length === 1
      ) {
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
      pinchStartDistance.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          handleZoom(ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2);
          break;
        case "-":
          e.preventDefault();
          handleZoom(-ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2);
          break;
        case "ArrowUp":
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, y: prev.y + MOVE_STEP }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, y: prev.y - MOVE_STEP }));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, x: prev.x + MOVE_STEP }));
          break;
        case "ArrowRight":
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, x: prev.x - MOVE_STEP }));
          break;
        default:
          break;
      }
    },
    [handleZoom, clampOffset]
  );

  const handleResize = useCallback(() => {
    centerBoard();
  }, [centerBoard]);

  useEffect(() => {
    const boardElement = boardRef.current;
    if (boardElement) {
      boardElement.addEventListener("wheel", handleWheel, { passive: false });
      boardElement.addEventListener("mousedown", handleMouseDown);
      boardElement.addEventListener("touchstart", handleTouchStart, { passive: false });
    }
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

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
      window.removeEventListener("resize", handleResize);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyDown,
    handleResize,
    boardRef,
  ]);

  return {
    scale,
    offset,
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