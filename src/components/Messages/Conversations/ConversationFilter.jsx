import React from 'react';
import PropTypes from 'prop-types';
import { FormControl, Select, MenuItem, InputLabel } from '@mui/material';

const ConversationFilter = ({ filter, onChangeFilter }) => (
  <FormControl sx={{ minWidth: 120 }} aria-label="Conversation filter">
    <InputLabel id="conversation-filter-label">Filter</InputLabel>
    <Select
      labelId="conversation-filter-label"
      value={filter}
      label="Filter"
      onChange={(e) => onChangeFilter(e.target.value)}
    >
      <MenuItem value="all">All</MenuItem>
      <MenuItem value="active">Active</MenuItem>
      <MenuItem value="archived">Archived</MenuItem>
    </Select>
  </FormControl>
);

ConversationFilter.propTypes = {
  filter: PropTypes.oneOf(['all', 'active', 'archived']).isRequired,
  onChangeFilter: PropTypes.func.isRequired,
};

export default React.memo(ConversationFilter);