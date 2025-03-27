// src/components/Tweet/Tweet.js
import React, { useRef, memo, useState, useEffect } from "react";
import Draggable from "react-draggable";

const DraggableTweet = ({ tweet, onStop, children, currentUser }) => {
  const nodeRef = useRef(null);
  const [localPosition, setLocalPosition] = useState({ x: tweet.x, y: tweet.y });
  const [dragging, setDragging] = useState(false);
  const justDroppedRef = useRef(false);

  useEffect(() => {
    console.log("Server position:", {
      x: tweet.position.x,
      y: tweet.position.y,
    });
    console.log("Local position:", localPosition);
    if (!dragging && !justDroppedRef.current) {
      if (
        localPosition.x !== tweet.position.x ||
        localPosition.y !== tweet.position.y
      ) {
        setLocalPosition({
          x: tweet.position.x || 0,
          y: tweet.position.y || 0,
        });
      }
    }
  }, [
    tweet.position.x,
    tweet.position.y,
    dragging,
    localPosition.x,
    localPosition.y,
  ]);

  const isDraggable =
    (tweet?.user?.anonymous_id || tweet.user_id) === currentUser.anonymous_id;

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
          setLocalPosition({ x: data.x, y: data.y });
          onStop && onStop(e, data);
        }}
        disabled={!isDraggable}
      >
        <div
          ref={nodeRef}
          style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            cursor: isDraggable ? 'move' : 'default',
          }}
        >
          {children}
        </div>
      </Draggable>
    );
  };
  
  export default memo(DraggableTweet);
