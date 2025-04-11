import React, { useRef, memo, useState, useEffect } from "react";
import Draggable from "react-draggable";
import debounce from "lodash.debounce";

const DraggableTweet = ({ tweet, onStop, children, currentUser }) => {
  const nodeRef = useRef(null);
  const [localPosition, setLocalPosition] = useState({ x: tweet.position.x, y: tweet.position.y });
  const [dragging, setDragging] = useState(false);
  const justDroppedRef = useRef(false);
  const previousPosition = useRef({ x: tweet.position.x, y: tweet.position.y });

  useEffect(() => {
    if (!dragging && !justDroppedRef.current) {
      if (
        localPosition.x !== tweet.position.x ||
        localPosition.y !== tweet.position.y
      ) {
        setLocalPosition({
          x: tweet.position.x || 0,
          y: tweet.position.y || 0,
        });
        previousPosition.current = { x: tweet.position.x || 0, y: tweet.position.y || 0 };
      }
    }
  }, [tweet.position.x, tweet.position.y, dragging]);

  const isDraggable = (tweet?.anonymous_id || tweet.user_id) === currentUser.anonymous_id;

  const debouncedOnStop = useRef(
    debounce((e, data) => {
      if (
        data.x !== previousPosition.current.x ||
        data.y !== previousPosition.current.y
      ) {
        previousPosition.current = { x: data.x, y: data.y };
        onStop && onStop(e, data);
      }
    }, 150)
  ).current;

  return (
    <Draggable
      nodeRef={nodeRef}
      position={localPosition}
      onStart={() => {
        setDragging(true);
        return true;
      }}
      onDrag={(e, data) => {
        setLocalPosition({ x: data.x, y: data.y });
      }}
      onStop={(e, data) => {
        setDragging(false);
        justDroppedRef.current = true;

        if (e.target.closest(".tweet-menu")) return;

        setTimeout(() => (justDroppedRef.current = false), 100);
        debouncedOnStop(e, data);
      }}
      disabled={!isDraggable}
    >
      <div
        ref={nodeRef}
        style={{
          position: "absolute",
          transform: "translate(-50%, -50%)",
          cursor: isDraggable ? "move" : "default",
          opacity: tweet.status === "pending" ? 0.7 : 1,
        }}
      >
        {children}
      </div>
    </Draggable>
  );
};

export default memo(DraggableTweet);