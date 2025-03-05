import React, { useRef } from "react";
import Draggable from "react-draggable";

const DraggableTweet = ({ tweet, onStop, children }) => {
  const nodeRef = useRef(null);
  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: tweet.x, y: tweet.y }}
      onStop={(e, data) => onStop(e, data, tweet)}
    >
      <div
        ref={nodeRef}
        className="draggable-tweet"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </Draggable>
  );
};

export default DraggableTweet;
