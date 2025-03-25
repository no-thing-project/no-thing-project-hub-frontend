import { useState, useCallback, useRef, useEffect } from "react";

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

  // Refs для відстеження поточних значень масштабу та зсуву
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);
  const offsetRef = useRef(offset);

  // Оновлення refs при зміні стану
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // Центрування борди
  const centerBoard = useCallback(() => {
    setOffset({
      x: window.innerWidth / 2 - (BOARD_SIZE * scaleRef.current) / 2,
      y: window.innerHeight / 2 - (BOARD_SIZE * scaleRef.current) / 2,
    });
  }, []);

  // Масштабування відносно позиції курсора
  const handleZoom = useCallback((delta, mouseX, mouseY) => {
    setScale((prevScale) => {
      const currentScale = scaleRef.current;
      const currentOffset = offsetRef.current;
      const newScale = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, currentScale + delta)
      );

      if (mouseX !== undefined && mouseY !== undefined) {
        // Розрахунок нових координат зсуву
        const boardX = (mouseX - currentOffset.x) / currentScale;
        const boardY = (mouseY - currentOffset.y) / currentScale;
        const newOffsetX = mouseX - boardX * newScale;
        const newOffsetY = mouseY - boardY * newScale;
        setOffset({ x: newOffsetX, y: newOffsetY });
      } else {
        // Центрування при відсутності курсора (кнопки)
        setOffset({
          x: window.innerWidth / 2 - (BOARD_SIZE * newScale) / 2,
          y: window.innerHeight / 2 - (BOARD_SIZE * newScale) / 2,
        });
      }

      return newScale;
    });
  }, []);

  // Функція для плавної анімації
  function easeOutCubic(t) {
    return --t * t * t + 1;
  }

  const handleZoomButton = useCallback(
    (direction) => {
      if (direction === "reset") {
        const startScale = scaleRef.current;
        const targetScale = 1;
        const duration = 1000; // Тривалість анімації в мілісекундах
        const startTime = performance.now();

        const animate = (currentTime) => {
          const elapsed = currentTime - startTime;
          if (elapsed >= duration) {
            // Фінальний крок для точного досягнення цільового масштабу
            const delta = targetScale - scaleRef.current;
            handleZoom(delta, window.innerWidth / 2, window.innerHeight / 2);
            return;
          }

          const progress = elapsed / duration;
          const easedProgress = easeOutCubic(progress);
          const newScale =
            startScale + (targetScale - startScale) * easedProgress;
          const currentScale = scaleRef.current;
          const delta = newScale - currentScale;

          handleZoom(delta, window.innerWidth / 2, window.innerHeight / 2);
          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      } else {
        const delta = direction === "in" ? ZOOM_STEP : -ZOOM_STEP;
        handleZoom(delta, window.innerWidth / 2, window.innerHeight / 2);
      }
    },
    [handleZoom]
  );

  // Обробник колеса миші
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      handleZoom(delta, e.clientX, e.clientY);
    },
    [handleZoom]
  );

  // Початок перетягування дошки
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

  // Перетягування дошки
  const handleMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!isDragging.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isDragging.current = true;
      setDragging(true);
    }
    if (isDragging.current) {
      setOffset({
        x: dragStart.current.offsetX + dx,
        y: dragStart.current.offsetY + dy,
      });
    }
  }, []);

  // Завершення перетягування + обробка кліка для створення твіта
  const handleMouseUp = useCallback(
    (e, onClick) => {
      if (
        !isDragging.current &&
        dragStart.current &&
        onClick &&
        boardRef.current
      ) {
        const boardRect = boardRef.current.getBoundingClientRect();
        const clickX = e.clientX - boardRect.left;
        const clickY = e.clientY - boardRect.top;
        const tweetX = (clickX - offset.x) / scale;
        const tweetY = (clickY - offset.y) / scale;

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
    dragging: isDragging.current,
    centerBoard,
    handleZoomButton,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
