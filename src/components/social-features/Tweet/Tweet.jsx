import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import debounce from 'lodash/debounce';
import { BOARD_SIZE } from '../../../hooks/useBoard';
import TweetContentStyles from './TweetContentStyles';

const DraggableTweet = ({ tweet, onStop, children, currentUser, userRole, bypassOwnership = false }) => {
  const nodeRef = useRef(null);
  const justDroppedRef = useRef(false);
  const previousPosition = useRef({ x: tweet.position?.x ?? 0, y: tweet.position?.y ?? 0 });
  const [localPosition, setLocalPosition] = useState({
    x: tweet.position?.x ?? 0,
    y: tweet.position?.y ?? 0,
  });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const clampPosition = useCallback((x, y) => ({
    x: Math.max(0, Math.min(x, BOARD_SIZE - 200)),
    y: Math.max(0, Math.min(y, BOARD_SIZE - 100)),
  }), []);

  useEffect(() => {
    if (!dragging && !justDroppedRef.current) {
      const newPos = clampPosition(tweet.position?.x ?? 0, tweet.position?.y ?? 0);
      if (localPosition.x !== newPos.x || localPosition.y !== newPos.y) {
        setLocalPosition(newPos);
        previousPosition.current = newPos;
      }
    }
  }, [tweet.position?.x, tweet.position?.y, dragging, localPosition, clampPosition]);

  // Permission logic for dragging
  const isDraggable = useMemo(() => {
    if (!tweet || tweet.is_pinned) return false;
    if (bypassOwnership || ['admin', 'owner'].includes(userRole)) return true;
    if (userRole === 'viewer') {
      return (
        tweet.anonymous_id === currentUser?.anonymous_id ||
        tweet.user_id === currentUser?.anonymous_id ||
        (tweet.username && currentUser?.username && tweet.username === currentUser.username)
      );
    }
    return false;
  }, [tweet, bypassOwnership, userRole, currentUser?.anonymous_id, currentUser?.username]);

  const debouncedOnStop = useMemo(
    () =>
      debounce((e, data) => {
        const clampedPos = clampPosition(data.x, data.y);
        if (
          clampedPos.x !== previousPosition.current.x ||
          clampedPos.y !== previousPosition.current.y
        ) {
          if (isNaN(clampedPos.x) || isNaN(clampedPos.y)) {
            console.error('Invalid position data:', data);
            return;
          }
          previousPosition.current = clampedPos;
          onStop?.(e, { x: clampedPos.x, y: clampedPos.y, tweetId: tweet.tweet_id });
        }
      }, 150),
    [onStop, tweet.tweet_id, clampPosition]
  );

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

      if (e.target.closest('.tweet-menu, .MuiIconButton-root, .MuiTypography-root, .MuiChip-root')) return;

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
      positionOffset={{ x: '-50%', y: '-50%' }}
      disabled={!isDraggable}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
      cancel=".tweet-menu, .MuiIconButton-root, .MuiTypography-root, .MuiChip-root"
    >
      <div
        ref={nodeRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={TweetContentStyles.draggableContainer(isDraggable, dragging, hovered, tweet.is_pinned)}
        role="region"
        aria-label={`Tweet by ${tweet.username || 'Anonymous'}`}
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