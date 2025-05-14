import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import debounce from 'lodash/debounce';

const DraggableTweet = ({ tweet, onStop, children, currentUser, userRole, bypassOwnership = false }) => {
  const nodeRef = useRef(null);
  const justDroppedRef = useRef(false);
  const previousPosition = useRef({ x: tweet.position?.x ?? 0, y: tweet.position?.y ?? 0 });
  const [localPosition, setLocalPosition] = useState({
    x: tweet.position?.x ?? 0,
    y: tweet.position?.y ?? 0,
  });
  const [dragging, setDragging] = useState(false);

  // Sync local position with tweet.position when not dragging
  useEffect(() => {
    if (!dragging && !justDroppedRef.current) {
      const newX = tweet.position?.x ?? 0;
      const newY = tweet.position?.y ?? 0;
      if (localPosition.x !== newX || localPosition.y !== newY) {
        setLocalPosition({ x: newX, y: newY });
        previousPosition.current = { x: newX, y: newY };
      }
    }
  }, [tweet.position?.x, tweet.position?.y, dragging, localPosition]);

  // Determine if the tweet is draggable
  const isDraggable = useMemo(() => {
    if (!tweet || tweet.is_pinned) return false;
    if (bypassOwnership || ['moderator', 'administrator'].includes(userRole)) return true;
    return (
      tweet.anonymous_id === currentUser?.anonymous_id ||
      tweet.user_id === currentUser?.anonymous_id ||
      (tweet.username && currentUser?.username && tweet.username === currentUser.username)
    );
  }, [
    tweet,
    tweet?.is_pinned,
    tweet?.anonymous_id,
    tweet?.user_id,
    tweet?.username,
    bypassOwnership,
    userRole,
    currentUser?.anonymous_id,
    currentUser?.username,
  ]);

  // Debounced onStop handler
  const debouncedOnStop = useMemo(
    () =>
      debounce((e, data) => {
        if (
          data.x !== previousPosition.current.x ||
          data.y !== previousPosition.current.y
        ) {
          if (isNaN(data.x) || isNaN(data.y)) {
            console.error('Invalid position data:', data);
            return;
          }
          previousPosition.current = { x: data.x, y: data.y };
          onStop?.(e, { x: data.x, y: data.y, tweetId: tweet.tweet_id });
        }
      }, 150),
    [onStop, tweet.tweet_id]
  );

  // Cleanup debounce on unmount
  useEffect(() => () => debouncedOnStop.cancel(), [debouncedOnStop]);

  const handleStart = useCallback(() => {
    if (!isDraggable) return false;
    setDragging(true);
    return true;
  }, [isDraggable]);

  const handleDrag = useCallback((_, data) => {
    setLocalPosition({ x: data.x, y: data.y });
  }, []);

  const handleStop = useCallback(
    (e, data) => {
      if (!isDraggable) return;
      setDragging(false);
      justDroppedRef.current = true;

      // Ignore menu clicks
      if (e.target.closest('.tweet-menu')) return;

      setTimeout(() => (justDroppedRef.current = false), 100);
      debouncedOnStop(e, data);
    },
    [isDraggable, debouncedOnStop]
  );

  if (!tweet || !tweet.tweet_id) {
    console.warn('Invalid tweet in DraggableTweet:', tweet);
    return null;
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      position={localPosition}
      disabled={!isDraggable}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
    >
      <div
        ref={nodeRef}
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          cursor: isDraggable ? (dragging ? 'grabbing' : 'grab') : 'default',
          opacity: tweet.status === 'pending' ? 0.7 : dragging ? 0.9 : 1,
          zIndex: dragging ? 1000 : tweet.is_pinned ? 1100 : 1,
          transition: 'opacity 0.2s ease',
        }}
        role="region"
        aria-label={`Tweet by ${tweet.username || 'Someone'}`}
        aria-disabled={!isDraggable}
        tabIndex={isDraggable ? 0 : -1}
      >
        {children}
      </div>
    </Draggable>
  );
};

DraggableTweet.propTypes = {
  tweet: PropTypes.shape({
    tweet_id: PropTypes.string.isRequired,
    position: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
    anonymous_id: PropTypes.string,
    user_id: PropTypes.string,
    username: PropTypes.string,
    status: PropTypes.string,
    is_pinned: PropTypes.bool,
  }).isRequired,
  onStop: PropTypes.func,
  children: PropTypes.node.isRequired,
  currentUser: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  userRole: PropTypes.string.isRequired,
  bypassOwnership: PropTypes.bool,
};

DraggableTweet.defaultProps = {
  bypassOwnership: false,
  onStop: () => {},
};

export default memo(DraggableTweet);