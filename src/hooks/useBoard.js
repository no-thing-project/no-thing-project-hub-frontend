import { useState, useCallback, useEffect, useRef } from 'react';
import { throttle } from 'lodash';

export const BOARD_SIZE = 10000;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.05;
const ZOOM_SENSITIVITY = 0.001;
const MOVE_STEP = 50;
const ANIMATION_DURATION = 400;
const PINCH_SENSITIVITY = 0.01;

export const useBoardInteraction = (boardRef) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef(null);
  const touchStart = useRef(null);
  const pinchStart = useRef(null);
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const animationFrame = useRef(null);

  useEffect(() => {
    scaleRef.current = scale;
    offsetRef.current = offset;
  }, [scale, offset]);

  const clampOffset = useCallback((newOffset) => {
    const scaledSize = BOARD_SIZE * scaleRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minX = viewportWidth - scaledSize;
    const minY = viewportHeight - scaledSize;
    return {
      x: Math.max(minX, Math.min(0, newOffset.x)),
      y: Math.max(minY, Math.min(0, newOffset.y)),
    };
  }, []);

  const centerBoard = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const newOffset = {
      x: (viewportWidth - BOARD_SIZE) / 2,
      y: (viewportHeight - BOARD_SIZE) / 2,
    };
    setOffset(clampOffset(newOffset));
    setScale(1);
  }, [clampOffset]);

  const restoreBoardState = useCallback(
    (state) => {
      if (!state) return;
      setScale(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.scale || 1)));
      setOffset(clampOffset(state.offset || { x: 0, y: 0 }));
    },
    [clampOffset]
  );

  const animateReset = useCallback(() => {
    const startScale = scaleRef.current;
    const startOffset = offsetRef.current;
    const targetScale = 1;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetOffset = {
      x: (viewportWidth - BOARD_SIZE) / 2,
      y: (viewportHeight - BOARD_SIZE) / 2,
    };
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setScale(startScale + (targetScale - startScale) * easedProgress);
      setOffset(clampOffset({
        x: startOffset.x + (targetOffset.x - startOffset.x) * easedProgress,
        y: startOffset.y + (targetOffset.y - startOffset.y) * easedProgress,
      }));

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        animationFrame.current = null;
      }
    };

    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = requestAnimationFrame(animate);
  }, [clampOffset]);

  const handleZoom = useCallback((delta, clientX, clientY) => {
    setScale((prevScale) => {
      const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prevScale + delta));
      const focusX = clientX !== undefined ? clientX : window.innerWidth / 2;
      const focusY = clientY !== undefined ? clientY : window.innerHeight / 2;
      const currentOffset = offsetRef.current;
      setOffset(clampOffset({
        x: focusX - ((focusX - currentOffset.x) / prevScale) * newScale,
        y: focusY - ((focusY - currentOffset.y) / prevScale) * newScale,
      }));
      return newScale;
    });
  }, [clampOffset]);

  const handleZoomButton = useCallback((direction) => {
    if (direction === 'reset') {
      animateReset();
    } else {
      handleZoom(
        direction === 'in' ? ZOOM_STEP : -ZOOM_STEP,
        window.innerWidth / 2,
        window.innerHeight / 2
      );
    }
  }, [handleZoom, animateReset]);

  const handleWheel = useCallback(
    throttle((e) => {
      if (!boardRef.current) return;
      e.preventDefault();
      handleZoom(-e.deltaY * ZOOM_SENSITIVITY, e.clientX, e.clientY);
    }, 50),
    [handleZoom, boardRef]
  );

  const handleMouseDown = useCallback((e) => {
    if (!boardRef.current || e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root')) return;
    e.preventDefault();
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
        setOffset(clampOffset({
          x: dragStart.current.offsetX + dx,
          y: dragStart.current.offsetY + dy,
        }));
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
          onClick(tweetX, tweetY, clickX, clickY);
        }
      }
      dragStart.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  const handleTouchStart = useCallback((e) => {
    if (!boardRef.current || e.target.closest('.tweet-card, .tweet-popup, .MuiIconButton-root, .MuiButton-root')) return;
    e.preventDefault();
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

  const handleTouchMove = useCallback(
    throttle((e) => {
      if (!boardRef.current) return;
      e.preventDefault();
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
    }, 10),
    [clampOffset]
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
          onClick(tweetX, tweetY, clickX, clickY);
        }
      }
      touchStart.current = null;
      pinchStart.current = null;
      isDragging.current = false;
    },
    [boardRef, offset, scale]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoom(ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2);
          break;
        case '-':
          e.preventDefault();
          handleZoom(-ZOOM_STEP, window.innerWidth / 2, window.innerHeight / 2);
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
      boardElement.addEventListener('wheel', handleWheel, { passive: false });
      boardElement.addEventListener('mousedown', handleMouseDown);
      boardElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

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
      window.removeEventListener('resize', handleResize);
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
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    restoreBoardState,
  };
};