import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import PropTypes from 'prop-types';
import Filters from '../Filters/Filters';
import Grids from '../Grids/Grids';
import { containerStyles } from '../../styles/BaseStyles';

const EntityGrid = ({
  type,
  items,
  cardComponent: CardComponent,
  itemKey,
  quickFilter,
  setQuickFilter,
  searchQuery,
  setSearchQuery,
  filterOptions,
  onResetFilters,
  handleFavorite,
  setEditingItem,
  setItemToDelete,
  setDeleteDialogOpen,
  handleManageMembers,
  navigate,
  currentUser,
  token,
  onCreateNew,
  disabled,
  profileHeader,
  lastItemRef,
  hasMore,
  loading,
}) => {
  return (
    <Box sx={{ ...containerStyles, maxWidth: '1500px', mx: 'auto' }}>
      {profileHeader}
      <Filters
        type={type}
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterOptions={filterOptions}
        onReset={onResetFilters}
      />
      <Grids
        items={items}
        cardComponent={CardComponent}
        itemKey={itemKey}
        gridType={type}
        handleFavorite={handleFavorite}
        setEditingItem={setEditingItem}
        setItemToDelete={setItemToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleManageMembers={handleManageMembers}
        navigate={navigate}
        currentUser={currentUser}
        token={token}
        onCreateNew={onCreateNew}
        disabled={disabled}
        lastItemRef={lastItemRef}
        hasMore={hasMore}
      />
      {loading && hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress aria-label="Loading more items" />
        </Box>
      )}
    </Box>
  );
};

EntityGrid.propTypes = {
  type: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  cardComponent: PropTypes.elementType.isRequired,
  itemKey: PropTypes.string.isRequired,
  quickFilter: PropTypes.string.isRequired,
  setQuickFilter: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  filterOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ).isRequired,
  onResetFilters: PropTypes.func.isRequired,
  handleFavorite: PropTypes.func,
  setEditingItem: PropTypes.func,
  setItemToDelete: PropTypes.func,
  setDeleteDialogOpen: PropTypes.func,
  handleManageMembers: PropTypes.func,
  navigate: PropTypes.func.isRequired,
  currentUser: PropTypes.object,
  token: PropTypes.string,
  onCreateNew: PropTypes.func,
  disabled: PropTypes.bool,
  profileHeader: PropTypes.node,
  lastItemRef: PropTypes.func,
  hasMore: PropTypes.bool,
  loading: PropTypes.bool,
};

export default React.memo(EntityGrid);