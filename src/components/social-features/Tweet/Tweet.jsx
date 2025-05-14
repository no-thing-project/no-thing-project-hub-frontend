import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import debounce from 'lodash.debounce';

const DraggableTweet = ({ tweet, onStop, children, currentUser, userRole, bypassOwnership = false }) => {
  const nodeRef = useRef(null);
  const [localPosition, setLocalPosition] = useState({
    x: tweet.position?.x || 0,
    y: tweet.position?.y || 0,
  });
  const [dragging, setDragging] = useState(false);
  const justDroppedRef = useRef(false);
  const previousPosition = useRef({
    x: tweet.position?.x || 0,
    y: tweet.position?.y || 0,
  });

  // Update position only when tweet.position changes and not dragging
  useEffect(() => {
    if (!dragging && !justDroppedRef.current) {
      const newX = tweet.position?.x || 0;
      const newY = tweet.position?.y || 0;
      if (localPosition.x !== newX || localPosition.y !== newY) {
        setLocalPosition({ x: newX, y: newY });
        previousPosition.current = { x: newX, y: newY };
      }
    }
  }, [tweet.position?.x, tweet.position?.y, dragging]);

  // Allow dragging if user is moderator, administrator, tweet owner, or bypassOwnership is true
  const isDraggable = bypassOwnership || (
    ['moderator', 'administrator'].includes(userRole) ||
    (tweet?.anonymous_id || tweet.user_id) === currentUser.anonymous_id ||
    (tweet.username && currentUser.username && tweet.username === currentUser.username)
  );

  // Debug log for draggability
  useEffect(() => {
    console.log('DraggableTweet Debug:', {
      tweetId: tweet.tweet_id,
      isDraggable,
      userRole,
      tweetAnonymousId: tweet.anonymous_id,
      tweetUserId: tweet.user_id,
      tweetUsername: tweet.username,
      currentUserAnonymousId: currentUser.anonymous_id,
      currentUserUsername: currentUser.username,
      bypassOwnership,
    });
    if (!tweet.position) {
      console.warn(`Tweet ${tweet.tweet_id} is missing position data`);
    }
  }, [
    tweet.tweet_id,
    tweet.anonymous_id,
    tweet.user_id,
    tweet.username,
    currentUser.anonymous_id,
    currentUser.username,
    isDraggable,
    bypassOwnership,
    tweet.position,
    userRole,
  ]);

  // Debounced onStop handler
  const debouncedOnStop = useCallback(
    debounce((e, data) => {
      if (
        data.x !== previousPosition.current.x ||
        data.y !== previousPosition.current.y
      ) {
        previousPosition.current = { x: data.x, y: data.y };
        onStop && onStop(e, data);
      }
    }, 150),
    [onStop]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedOnStop.cancel();
    };
  }, [debouncedOnStop]);

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

        if (e.target.closest('.tweet-menu')) {
          console.log('Menu click detected, skipping drag stop');
          return;
        }

        setTimeout(() => (justDroppedRef.current = false), 100);
        debouncedOnStop(e, data);
      }}
      disabled={!isDraggable}
    >
      <div
        ref={nodeRef}
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          cursor: isDraggable ? 'move' : 'default',
          opacity: tweet.status === 'pending' ? 0.7 : 1,
        }}
        role="region"
        aria-label={`Tweet by ${tweet.username || 'Someone'}`}
        aria-disabled={!isDraggable}
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

export default React.memo(DraggableTweet);