//src/components/Tweet/Tweet.js
import React, { useRef, memo } from "react";
import Draggable from "react-draggable";

const DraggableTweet = ({ tweet, onStop, children, currentUser }) => {
  const nodeRef = useRef(null);

  // Перетягування доступне тільки для автора твіту
  const isDraggable = tweet.user_id === currentUser?.user_id;

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: tweet.x || 0, y: tweet.y || 0 }}
      onStop={(e, data) => isDraggable && onStop(e, data, tweet)} // Викликаємо onStop тільки для автора
      disabled={!isDraggable} // Вимикаємо перетягування для інших користувачів
    >
      <div ref={nodeRef} className="draggable-tweet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </Draggable>
  );
};

// Оптимізація: уникаємо повторних рендерів, якщо пропси не змінилися
export default memo(DraggableTweet, (prevProps, nextProps) => {
  return (
    prevProps.tweet._id === nextProps.tweet._id &&
    prevProps.tweet.x === nextProps.tweet.x &&
    prevProps.tweet.y === nextProps.tweet.y &&
    prevProps.currentUser?.user_id === nextProps.currentUser?.user_id &&
    prevProps.children === nextProps.children
  );
});
