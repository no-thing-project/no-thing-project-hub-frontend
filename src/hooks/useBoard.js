import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { throttle } from 'lodash';
import { animate } from 'framer-motion';

export const BOARD_SIZE = 10000;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;
const ZOOM_SENSITIVITY = 0.0005;
const MOVE_STEP = 50;
const PINCH_SENSITIVITY = 0.005;
const ANIMATION_DURATION = 400;


export const useBoardInteraction = (boardRef) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef(null);
  const touchStart = useRef(null);
  const pinchStart = useRef(null);
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const viewportSize = useRef({ width: window.innerWidth, height: window.innerHeight });
  const history = useRef([]);
  const historyIndex = useRef(-1);

  // Update refs
  useEffect(() => {
    scaleRef.current = scale;
    offsetRef.current = offset;
  }, [scale, offset]);

  // Update viewport size on resize
  useEffect(() => {
    const updateViewport = () => {
      viewportSize.current = { width: window.innerWidth, height: window.innerHeight };
    };
    window.addEventListener('resize', updateViewport);
    updateViewport();
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Clamp offset to keep board within viewport
  const clampOffset = useCallback((newOffset) => {
    const scaledSize = BOARD_SIZE * scaleRef.current;
    const { width, height } = viewportSize.current;
    const minX = width - scaledSize;
    const minY = height - scaledSize;
    return {
      x: Math.max(minX, Math.min(0, newOffset.x)),
      y: Math.max(minY, Math.min(0, newOffset.y)),
    };
  }, []);

  // Center board in viewport
  const centerBoard = useCallback(() => {
    const { width, height } = viewportSize.current;
    const newOffset = {
      x: width / 2 - (BOARD_SIZE * scaleRef.current) / 2,
      y: height / 2 - (BOARD_SIZE * scaleRef.current) / 2,
    };
    setOffset(clampOffset(newOffset));
  }, [clampOffset]);

  // Restore board state
  const restoreBoardState = useCallback((state) => {
    if (!state) return;
    setScale(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.scale || 1)));
    setOffset(clampOffset(state.offset || { x: 0, y: 0 }));
  }, [clampOffset]);

  // Export board state
  const exportBoardState = useCallback(() => {
    return { scale, offset, timestamp: new Date().toISOString() };
  }, [scale, offset]);

  // Animate reset to default view
  const animateReset = useCallback(() => {
    const startScale = scaleRef.current;
    const startOffset = offsetRef.current;
    const targetScale = 1;
    const { width, height } = viewportSize.current;
    const targetOffset = {
      x: width / 2 - (BOARD_SIZE * targetScale) / 2,
      y: height / 2 - (BOARD_SIZE * targetScale) / 2,
    };

    animate(0, 1, {
      duration: ANIMATION_DURATION / 1000,
      ease: 'easeInOut',
      onUpdate: (progress) => {
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setScale(startScale + (targetScale - startScale) * easedProgress);
        setOffset(clampOffset({
          x: startOffset.x + (targetOffset.x - startOffset.x) * easedProgress,
          y: startOffset.y + (targetOffset.y - startOffset.y) * easedProgress,
        }));
      },
    });
  }, [clampOffset]);

  // Handle zoom with focus point
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

  // Handle zoom buttons
  const handleZoomButton = useCallback((direction) => {
    if (direction === 'reset') {
      animateReset();
    } else {
      handleZoom(
        direction === 'in' ? ZOOM_STEP : -ZOOM_STEP,
        viewportSize.current.width / 2,
        viewportSize.current.height / 2
      );
    }
  }, [handleZoom, animateReset]);

  // Handle wheel zoom
  const handleWheel = useCallback(
    throttle((e) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      handleZoom(delta, e.clientX, e.clientY);
    }, 16),
    [handleZoom]
  );

  // Handle mouse drag start
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.tweet-card, .tweet-popup, .return-button, .user_points, .zoom-controls, .board-top-controls, .MuiIconButton-root, .MuiButton-root')) return;
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
    isDragging.current = false;
  }, [offset]);

  // Handle mouse drag move
  const handleMouseMove = useCallback(
    throttle((e) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging.current = true;
      }
      if (isDragging.current) {
        setOffset(clampOffset({
          x: dragStart.current.offsetX + dx,
          y: dragStart.current.offsetY + dy,
        }));
      }
    }, 16),
    [clampOffset]
  );

  // Handle mouse drag end
  const handleMouseUp = useCallback(
    (e, onClick) => {
      if (!isDragging.current && dragStart.current && onClick && boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const clickX = e.clientX - boardRect.left;
        const clickY = e.clientY - boardRect.top;
        const tweetX = (clickX - offset.x) / scale;
        const tweetY = (clickY - offset.y) / scale;
        if (tweetX >= 0 && tweetX <= BOARD_SIZE && tweetY >= 0 && tweetY <= BOARD_SIZE) {
          onClick(tweetX, tweetY, e.clientX, e.clientY);
        }
      }
      dragStart.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root')) return;
    if (e.touches.length === 1) {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      isDragging.current = false;
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      pinchStart.current = {
        distance: Math.sqrt(dx * dx + dy * dy),
        centerX: (touch1.clientX + touch2.clientX) / 2,
        centerY: (touch1.clientY + touch2.clientY) / 2,
        scale: scaleRef.current,
      };
    }
  }, [offset]);

  // Handle touch move
  const handleTouchMove = useCallback(
    throttle((e) => {
      if (!touchStart.current && !pinchStart.current) return;
      if (e.touches.length === 1 && touchStart.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStart.current.x;
        const dy = touch.clientY - touchStart.current.y;
        if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          isDragging.current = true;
        }
        if (isDragging.current) {
          setOffset(clampOffset({
            x: touchStart.current.offsetX + dx,
            y: touchStart.current.offsetY + dy,
          }));
        }
      } else if (e.touches.length === 2 && pinchStart.current) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        const currentDistance = Math.sqrt(dx * dx + dy * dy);
        const scaleChange = (currentDistance / pinchStart.current.distance) * pinchStart.current.scale;
        const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scaleChange));
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        setScale(newScale);
        setOffset(clampOffset({
          x: centerX - ((centerX - offsetRef.current.x) / scaleRef.current) * newScale,
          y: centerY - ((centerY - offsetRef.current.y) / scaleRef.current) * newScale,
        }));
      }
    }, 16),
    [clampOffset]
  );

  // Handle touch end
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
          onClick(tweetX, tweetY, touch.clientX, touch.clientY);
        }
      }
      touchStart.current = null;
      pinchStart.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoom(ZOOM_STEP, viewportSize.current.width / 2, viewportSize.current.height / 2);
          break;
        case '-':
          e.preventDefault();
          handleZoom(-ZOOM_STEP, viewportSize.current.width / 2, viewportSize.current.height / 2);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, y: prev.y + MOVE_STEP }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, y: prev.y - MOVE_STEP }));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, x: prev.x + MOVE_STEP }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setOffset((prev) => clampOffset({ ...prev, x: prev.x - MOVE_STEP }));
          break;
        case 'z':
          if (e.ctrlKey && historyIndex.current > 0) {
            e.preventDefault();
            historyIndex.current -= 1;
            const state = history.current[historyIndex.current];
            setScale(state.scale);
            setOffset(state.offset);
          }
          break;
        case 'y':
          if (e.ctrlKey && historyIndex.current < history.current.length - 1) {
            e.preventDefault();
            historyIndex.current += 1;
            const state = history.current[historyIndex.current];
            setScale(state.scale);
            setOffset(state.offset);
          }
          break;
        default:
          break;
      }
    },
    [handleZoom, clampOffset]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (e, onContextMenu) => {
      if (e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root')) return;
      e.preventDefault();
      const boardRect = boardRef.current.getBoundingClientRect();
      const clickX = e.clientX - boardRect.left;
      const clickY = e.clientY - boardRect.top;
      const tweetX = (clickX - offset.x) / scale;
      const tweetY = (clickY - offset.y) / scale;
      if (tweetX >= 0 && tweetX <= BOARD_SIZE && tweetY >= 0 && tweetY <= BOARD_SIZE) {
        onContextMenu(tweetX, tweetY, e.clientX, e.clientY);
      }
    },
    [boardRef, offset, scale]
  );

  // Event listeners
  useEffect(() => {
    const boardElement = boardRef.current;
    if (boardElement) {
      boardElement.addEventListener('wheel', handleWheel, { passive: false });
      boardElement.addEventListener('mousedown', handleMouseDown);
      boardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (boardElement) {
        boardElement.removeEventListener('wheel', handleWheel);
        boardElement.removeEventListener('mousedown', handleMouseDown);
        boardElement.removeEventListener('touchstart', handleTouchStart);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
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
    boardRef,
  ]);

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
    handleContextMenu,
    restoreBoardState,
    exportBoardState,
  };
};