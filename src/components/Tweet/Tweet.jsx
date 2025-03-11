// src/components/Tweet/Tweet.js
import React, { useRef, memo, useState, useEffect } from "react";
import Draggable from "react-draggable";

const DraggableTweet = ({ tweet, onStop, children, currentUser }) => {
  const nodeRef = useRef(null);
  const [localPosition, setLocalPosition] = useState({
    x: tweet.x || 0,
    y: tweet.y || 0,
  });
  const [dragging, setDragging] = useState(false);
  const justDroppedRef = useRef(false);

  useEffect(() => {
    if (!dragging && !justDroppedRef.current) {
      setLocalPosition({ x: tweet.x || 0, y: tweet.y || 0 });
    }
  }, [tweet.x, tweet.y, dragging]);

  const isDraggable = (tweet?.user?._id || tweet.user_id) === currentUser.id;

  return (
    <Draggable
      nodeRef={nodeRef}
      position={localPosition}
      onStart={(e, data) => {
        setDragging(true);
        return true;
      }}
      onDrag={(e, data) => {
        setLocalPosition({ x: data.x, y: data.y });
      }}
      onStop={(e, data) => {
        setDragging(false);
        setLocalPosition({ x: data.x, y: data.y });
        justDroppedRef.current = true;
        setTimeout(() => {
          justDroppedRef.current = false;
        }, 500);
        if (isDraggable && onStop) onStop(e, data, tweet);
      }}
      disabled={!isDraggable}
    >
      <div
        ref={nodeRef}
        className="draggable-tweet"
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: dragging ? "none" : "transform 500ms ease-out",
        }}
      >
        {children}
      </div>
    </Draggable>
  );
};

export default memo(
  DraggableTweet,
  (prevProps, nextProps) =>
    prevProps.tweet.tweet_id === nextProps.tweet.tweet_id &&
    prevProps.tweet.x === nextProps.tweet.x &&
    prevProps.tweet.y === nextProps.tweet.y &&
    prevProps.currentUser.id === nextProps.currentUser.id &&
    prevProps.children === nextProps.children
);
