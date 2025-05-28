import React from 'react';
import { Box, Skeleton } from '@mui/material';
import PropTypes from 'prop-types';
import { containerStyles, skeletonStyles, gridStyles } from '../../styles/BaseStyles';

const LoadingSkeleton = ({ count = 6, headerHeight = '150px', filterHeight = '60px', cardHeight = '210px' }) => (
  <Box sx={{ ...containerStyles, maxWidth: '1500px', mx: 'auto' }}>
    <Skeleton variant="rectangular" sx={{ ...skeletonStyles.header, height: headerHeight }} />
    <Skeleton variant="rectangular" sx={{ ...skeletonStyles.filter, height: filterHeight }} />
    <Box sx={{ ...gridStyles.container }}>
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" sx={{ ...skeletonStyles.card, height: cardHeight }} />
      ))}
    </Box>
  </Box>
);

LoadingSkeleton.propTypes = {
  count: PropTypes.number,
  headerHeight: PropTypes.string,
  filterHeight: PropTypes.string,
  cardHeight: PropTypes.string,
};

export default React.memo(LoadingSkeleton);