import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  IconButton,
  Link,
  CircularProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import axios from 'axios';
import ReactPlayer from 'react-player';
import URLParse from 'url-parse';
import { LazyLoadComponent } from 'react-lazy-load-image-component';
import { motion } from 'framer-motion';

const LinkPreviewStyles = {
  previewCard: {
    display: 'flex',
    flexDirection: 'row',
    maxWidth: '100%',
    marginTop: 1,
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    backgroundColor: 'background.paper',
  },
  previewImage: {
    width: '120px',
    height: '80px',
    objectFit: 'cover',
    flexShrink: 0,
  },
  previewContent: {
    flex: 1,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
  },
  previewTitle: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'text.primary',
    textDecoration: 'none',
    '& a': {
      color: 'primary.main',
      textDecoration: 'none',
      '&:hover': { textDecoration: 'underline' },
    },
  },
  previewDescription: {
    fontSize: '0.75rem',
    color: 'text.secondary',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  previewPlayButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
  },
  previewPlayer: {
    marginTop: 1,
    borderRadius: '8px',
    overflow: 'hidden',
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
  },
};

const LinkPreview = ({ content, onTextTransform, onPlayClick }) => {
  const [previews, setPreviews] = useState([]);
  const [playingMedia, setPlayingMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const deferredContent = useDeferredValue(content);
  const previewCache = useMemo(() => new Map(), []);

  const extractYouTubeId = useCallback((url) => {
    const parsed = new URLParse(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1);
    }
    return parsed.query.split('v=')[1]?.split('&')[0];
  }, []);

  const extractTwitchId = useCallback((url) => {
    const parsed = new URLParse(url);
    if (parsed.pathname.includes('/videos/')) {
      return { type: 'video', id: parsed.pathname.split('/videos/')[1] };
    } else if (parsed.pathname.includes('/clip/')) {
      return { type: 'clip', id: parsed.pathname.split('/clip/')[1] };
    } else {
      return { type: 'channel', id: parsed.pathname.slice(1) };
    }
  }, []);

  const isYouTubeMusic = useCallback((url) => {
    return url.includes('music.youtube.com');
  }, []);

  useEffect(() => {
    const fetchPreviews = async () => {
      if (!deferredContent) {
        setPreviews([]);
        onTextTransform?.(deferredContent);
        return;
      }

      setLoading(true);
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = deferredContent.match(urlRegex) || [];
      const uniqueUrls = [...new Set(urls)];
      const newPreviews = [];

      let transformedText = deferredContent;
      uniqueUrls.forEach((url) => {
        const truncated = url.length > 15 ? `${url.slice(0, 15)}...` : url;
        transformedText = transformedText.replace(url, truncated);
      });
      onTextTransform?.(transformedText);

      for (const url of uniqueUrls) {
        if (previewCache.has(url)) {
          newPreviews.push(previewCache.get(url));
          continue;
        }

        try {
          let previewData = { url, type: 'generic' };

          if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = extractYouTubeId(url);
            const isMusic = isYouTubeMusic(url);
            const response = await axios.get(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
              { timeout: 5000 }
            );
            previewData = {
              url,
              type: isMusic ? 'youtube_music' : 'youtube',
              title: response.data.title,
              description: response.data.author_name,
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              embedUrl: isMusic
                ? `https://www.youtube.com/embed/${videoId}?autoplay=0`
                : `https://www.youtube.com/embed/${videoId}`,
            };
          } else if (url.includes('spotify.com')) {
            const response = await axios.get(
              `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
              { timeout: 5000 }
            );
            previewData = {
              url,
              type: 'spotify',
              title: response.data.title,
              description: response.data.provider_name,
              thumbnail: response.data.thumbnail_url,
              embedUrl: response.data.html.match(/src="([^"]+)"/)?.[1],
            };
          } else if (url.includes('soundcloud.com')) {
            const response = await axios.get(
              `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`,
              { timeout: 5000 }
            );
            previewData = {
              url,
              type: 'soundcloud',
              title: response.data.title,
              description: response.data.author_name,
              thumbnail: response.data.thumbnail_url,
              embedUrl: response.data.html.match(/src="([^"]+)"/)?.[1],
            };
          } else if (url.includes('twitch.tv')) {
            const twitchInfo = extractTwitchId(url);
            let embedUrl;
            if (twitchInfo.type === 'channel') {
              embedUrl = `https://player.twitch.tv/?channel=${twitchInfo.id}&parent=${window.location.hostname}`;
            } else if (twitchInfo.type === 'video') {
              embedUrl = `https://player.twitch.tv/?video=${twitchInfo.id}&parent=${window.location.hostname}`;
            } else if (twitchInfo.type === 'clip') {
              embedUrl = `https://clips.twitch.tv/embed?clip=${twitchInfo.id}&parent=${window.location.hostname}`;
            }
            const response = await axios.get(
              `https://api.microlink.io?url=${encodeURIComponent(url)}`,
              { timeout: 5000 }
            );
            previewData = {
              url,
              type: 'twitch',
              title: response.data.data.title,
              description: response.data.data.description || 'Twitch Stream/Clip',
              thumbnail: response.data.data.image?.url,
              embedUrl,
              twitchType: twitchInfo.type,
            };
          } else {
            const response = await axios.get(
              `https://api.microlink.io?url=${encodeURIComponent(url)}`,
              { timeout: 5000 }
            );
            previewData = {
              url,
              type: 'generic',
              title: response.data.data.title,
              description: response.data.data.description,
              thumbnail: response.data.data.image?.url,
            };
          }

          if (previewData.title || previewData.thumbnail) {
            previewCache.set(url, previewData);
            newPreviews.push(previewData);
          }
        } catch (error) {
          console.error(`Failed to fetch preview for ${url}:`, error);
          // Silently skip failed previews
        }
      }

      setPreviews(newPreviews);
      setLoading(false);
    };

    const debounce = setTimeout(fetchPreviews, 500);
    return () => clearTimeout(debounce);
  }, [deferredContent, extractYouTubeId, extractTwitchId, isYouTubeMusic, previewCache, onTextTransform]);

  const handleTogglePlay = useCallback((preview) => {
    if (['spotify', 'soundcloud'].includes(preview.type) && !preview.embedUrl) {
      onPlayClick?.(preview, preview.type);
      return;
    }
    setPlayingMedia(playingMedia === preview.url ? null : preview.url);
  }, [playingMedia, onPlayClick]);

  const renderPreview = useCallback((preview) => {
    const isPlayable = ['youtube', 'youtube_music', 'spotify', 'soundcloud', 'twitch'].includes(preview.type) && preview.embedUrl;
    const isAudio = ['youtube_music', 'spotify', 'soundcloud'].includes(preview.type);
    const playerHeight = isAudio ? '100px' : '200px';

    return (
      <motion.div key={preview.url} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card sx={LinkPreviewStyles.previewCard}>
          {preview.thumbnail && (
            <CardMedia
              component="img"
              image={preview.thumbnail}
              alt={preview.title || 'Preview'}
              sx={LinkPreviewStyles.previewImage}
            />
          )}
          <CardContent sx={LinkPreviewStyles.previewContent}>
            <Typography variant="subtitle2" sx={LinkPreviewStyles.previewTitle}>
              <Link href={preview.url} target="_blank" rel="noopener">
                {preview.title || preview.url}
              </Link>
            </Typography>
            {preview.description && (
              <Typography variant="caption" sx={LinkPreviewStyles.previewDescription}>
                {preview.description}
              </Typography>
            )}
            {['youtube', 'youtube_music', 'spotify', 'soundcloud', 'twitch'].includes(preview.type) && (
              <IconButton
                onClick={() => handleTogglePlay(preview)}
                sx={LinkPreviewStyles.previewPlayButton}
                aria-label={playingMedia === preview.url ? `Pause ${preview.type} content` : `Play ${preview.type} content`}
              >
                {playingMedia === preview.url && preview.embedUrl ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
            )}
          </CardContent>
        </Card>
        {playingMedia === preview.url && isPlayable && preview.embedUrl && (
          <Box sx={LinkPreviewStyles.previewPlayer}>
            <LazyLoadComponent>
              <ReactPlayer
                url={preview.embedUrl}
                width="100%"
                height={playerHeight}
                controls
                playing={playingMedia === preview.url}
                config={{
                  youtube: {
                    playerVars: { modestbranding: 1, ...(preview.type === 'youtube_music' ? { playsinline: 1 } : {}) },
                  },
                  soundcloud: { options: { visual: true } },
                  twitch: { options: { autoplay: preview.twitchType !== 'clip' } },
                }}
                onError={() => setPlayingMedia(null)}
              />
            </LazyLoadComponent>
          </Box>
        )}
      </motion.div>
    );
  }, [playingMedia, handleTogglePlay]);

  if (loading) {
    return (
      <Box sx={LinkPreviewStyles.loadingContainer}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!previews.length) {
    return null;
  }

  return <Box>{previews.map(renderPreview)}</Box>;
};

LinkPreview.propTypes = {
  content: PropTypes.string,
  onTextTransform: PropTypes.func,
  onPlayClick: PropTypes.func,
};

LinkPreview.defaultProps = {
  content: '',
  onTextTransform: null,
  onPlayClick: null,
};

export default LinkPreview;