import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Box, Button, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const title = location.state?.title || '404';
  const message = location.state?.message || "Oops! Looks like you're lost in the digital void.";
  const titleRef = useRef(null);

  const handleMouseMove = (e) => {
    if (titleRef.current) {
      const rect = titleRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      titleRef.current.style.setProperty('--x', `${x}px`);
      titleRef.current.style.setProperty('--y', `${y}px`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      navigate('/home');
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
  const titleVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };
  const textVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delay: 0.2, duration: 0.5 } } };

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
        backgroundColor: theme.palette.background.default,
        textAlign: 'center',
      }}
    >
      <motion.div
        ref={titleRef}
        onMouseMove={handleMouseMove}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        variants={titleVariants}
        style={{
          position: 'relative',
          display: 'inline-block',
          '--x': '0px',
          '--y': '0px',
          '--innerRadius': '10%',
          '--outerRadius': '20%',
          cursor: 'pointer',
        }}
        aria-label={`Error ${title}`}
      >
        <Typography
          component={motion.div}
          variant="h1"
          sx={{
            fontSize: 'calc(5rem + 30vw)',
            fontWeight: 700,
            lineHeight: 1,
            color: theme.palette.text.primary,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              opacity: 0,
              transition: 'opacity 0.3s ease',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              mask: 'radial-gradient(circle at var(--x) var(--y), black var(--innerRadius), transparent var(--outerRadius))',
              WebkitMask: 'radial-gradient(circle at var(--x) var(--y), black var(--innerRadius), transparent var(--outerRadius))',
            },
            '&:hover::before': { opacity: 1 },
          }}
        >
          {title}
        </Typography>
      </motion.div>

      <Typography
        component={motion.p}
        variants={textVariants}
        variant="body1"
        sx={{
          m: { xs: 0, md: -5 },
          mb: { xs: 4, md: 5 },
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          maxWidth: '600px',
          color: theme.palette.text.secondary,
        }}
      >
        {message}
      </Typography>

      <Button
        component={motion.button}
        variant="contained"
        onClick={() => navigate('/home')}
        sx={{
          height: '50px',
          borderRadius: 20,
          padding: '0 25px',
          backgroundColor: 'background.button',
          boxShadow: 'none',
          transition: 'all 0.3s ease-in-out',
          px: 6,
          py: 2,
          fontSize: '1.1rem',
          textTransform: 'none',
          [theme.breakpoints.up('md')]: { px: 5, py: 2 },
          '&:hover': { transform: 'translateY(-2px)' },
        }}
        aria-label="Return to home page"
      >
        Return Home
      </Button>
    </Box>
  );
};

NotFoundPage.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      title: PropTypes.string,
      message: PropTypes.string,
    }),
  }),
  navigate: PropTypes.func,
};

export default NotFoundPage;