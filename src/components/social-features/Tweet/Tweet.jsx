import React, { useRef, memo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import debounce from 'lodash.debounce';

const DraggableTweet = ({ tweet, onStop, children, currentUser, bypassOwnership = false }) => {
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

  useEffect(() => {
    if (!dragging && !justDroppedRef.current) {
      if (
        localPosition.x !== (tweet.position?.x || 0) ||
        localPosition.y !== (tweet.position?.y || 0)
      ) {
        setLocalPosition({
          x: tweet.position?.x || 0,
          y: tweet.position?.y || 0,
        });
        previousPosition.current = {
          x: tweet.position?.x || 0,
          y: tweet.position?.y || 0,
        };
      }
    }
  }, [tweet.position?.x, tweet.position?.y, dragging]);

  // Allow dragging if bypassOwnership is true, IDs match, or usernames match (fallback)
  const isDraggable =
    bypassOwnership ||
    (tweet?.anonymous_id || tweet.user_id) === currentUser.anonymous_id ||
    (tweet.username && currentUser.username && tweet.username === currentUser.username);

  // Debug log to check draggability
  useEffect(() => {
    console.log('DraggableTweet Debug:', {
      tweetId: tweet.tweet_id,
      isDraggable,
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
  ]);

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
  bypassOwnership: PropTypes.bool,
};

export default memo(DraggableTweet);