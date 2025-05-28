import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Add } from '@mui/icons-material';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import useAuth from '../hooks/useAuth';
import { useBoards } from '../hooks/useBoards';
import { useClasses } from '../hooks/useClasses';
import { useGates } from '../hooks/useGates';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
import CardMain from '../components/Cards/CardMain';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_BOARD } from '../constants/default';
import { BOARD_FILTER_OPTIONS } from '../constants/filterOptions';
import { actionButtonStyles } from '../styles/BaseStyles';
import { Button, Typography, Box } from '@mui/material';
import Filters from '../components/Filters/Filters';
import Grids from '../components/Grids/Grids';

const BoardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    boards,
    fetchBoardsList,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole,
    toggleFavoriteBoard,
    loading: boardsLoading,
    error: boardsError,
    pagination,
  } = useBoards(token, handleLogout, navigate);
  const { classes, fetchClassesList, loading: classesLoading, error: classesError } = useClasses(
    token,
    handleLogout,
    navigate
  );
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(
    token,
    handleLogout,
    navigate
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [popupBoard, setPopupBoard] = useState(DEFAULT_BOARD);
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Track last shown error
  const lastErrorRef = useRef(null);

  const fetchFunctions = useMemo(
    () => [
      () => fetchBoardsList({ page: 1, limit: pagination.limit }),
      () => fetchClassesList({ visibility: 'public' }),
      () => fetchGatesList({ visibility: 'public' }),
    ],
    [fetchBoardsList, fetchClassesList, fetchGatesList, pagination.limit]
  );

  const { isLoading, actionLoading, setActionLoading } = useEntity(
    fetchFunctions,
    token,
    handleLogout,
    navigate,
    'boards'
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  // Global permission: authenticated users can create boards
  const canCreateBoard = isAuthenticated;

  useEffect(() => {
    // Deduplicate error notifications
    const errors = [boardsError, classesError, gatesError].filter(Boolean);
    const errorMessage = errors[0];
    if (errorMessage && errorMessage !== lastErrorRef.current && errorMessage !== 'canceled') {
      console.error('Data fetching errors:', { boardsError, classesError, gatesError });
      showNotification(errorMessage, 'error');
      lastErrorRef.current = errorMessage;
    }
  }, [boardsError, classesError, gatesError, showNotification]);

  // Close edit dialog if no editing board
  useEffect(() => {
    if (!editingBoard && editDialogOpen) {
      setEditDialogOpen(false);
    }
  }, [editingBoard, editDialogOpen]);

  const filteredBoards = useMemo(
    () => filterEntities(boards || [], 'boards', quickFilter, searchQuery, gates || [], classes || []),
    [boards, gates, classes, quickFilter, searchQuery]
  );

  const handleOpenCreateBoard = useCallback(() => setCreateDialogOpen(true), []);
  const handleCancelCreate = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupBoard(DEFAULT_BOARD);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!popupBoard.name?.trim()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdBoard = await createNewBoard(popupBoard);
      setCreateDialogOpen(false);
      setPopupBoard(DEFAULT_BOARD);
      showNotification('Board created successfully!', 'success');
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupBoard, createNewBoard, navigate, showNotification, setActionLoading]);

  const handleUpdate = useCallback(async () => {
    if (!editingBoard?.name?.()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
      setEditDialogOpen(false);
      setEditingBoard(null);
      showNotification('Board updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingBoard, updateExistingBoard, showNotification, setActionLoading]);

  const handleDelete = useCallback(async () => {
    if (!boardToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingBoard(boardToDelete);
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      showNotification('Board deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [boardToDelete, deleteExistingBoard, showNotification, setActionLoading]);

  const handleAddMember = useCallback(
    async (boardId, memberData) => {
      setActionLoading(true);
      try {
        const board = boards.find((b) => b.board_id === boardId);
        if (board?.members?.length >= board?.settings?.max_members) {
          showNotification('Maximum member limit reached!', 'error');
          return;
        }
        await addMemberToBoard(boardId, memberData);
        showNotification('Member added successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to add member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToBoard, boards, showNotification, setActionLoading]
  );

  const handleRemoveMember = useCallback(
    async (boardId, username) => {
      setActionLoading(true);
      try {
        await removeMemberFromBoard(boardId, username);
        showNotification('Member removed successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to remove member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromBoard, showNotification, setActionLoading]
  );

  const handleUpdateMemberRole = useCallback(
    async (boardId, username, newRole) => {
      setActionLoading(true);
      try {
        await updateMemberRole(boardId, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateMemberRole, showNotification, setActionLoading]
  );

  const handleOpenMemberDialog = useCallback((boardId) => {
    setSelectedBoardId(boardId);
    setMemberDialogOpen(true);
  }, []);

  const handleSaveMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedBoardId(null);
    showNotification('Members updated successfully!', 'success');
  }, [showNotification]);

  const handleCancelMembers = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedBoardId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  // Load more boards for infinite scroll
  const handleLoadMore = useCallback(async () => {
    if (boardsLoading || !pagination.hasMore) return;
    const nextPage = pagination.page + 1;
    await fetchBoardsList({ page: nextPage, limit: pagination.limit }, null, true);
  }, [fetchBoardsList, boardsLoading, pagination]);

  const headerData = useMemo(
    () => ({
      type: 'page',
      title: 'Boards',
      titleAriaLabel: 'Boards page',
      shortDescription: 'Your Spaces for Collaboration',
      tooltipDescription:
        'Boards are interactive spaces for discussions and tasks within classes. Create a board to organize your projects.',
      actions: canCreateBoard
        ? [
            {
              label: 'Create Board',
              icon: <Add />,
              onClick: handleOpenCreateBoard,
              tooltipAriaLabel: 'Create a new board',
              disabled: actionLoading || boardsLoading || classesLoading || gatesLoading,
              isMenuItem: false,
            },
          ]
        : [],
    }),
    [canCreateBoard, handleOpenCreateBoard, actionLoading, boardsLoading, classesLoading, gatesLoading]
  );

  if (authLoading || isLoading || boardsLoading || classesLoading || gatesLoading) {
    return (
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <LoadingSkeleton />
      </AppLayout>
    );
  }
  if (!isAuthenticated) {
    navigate('/login', { state: { from: location.pathname } });
    return null;
  }

  return (
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ProfileHeader 
        user={authData} 
        isOwnProfile={true} 
        headerData={headerData}
      >
      </ProfileHeader>
      <Filters 
        type="boards"
        quickFilter={quickFilter}
        setQuickFilter={setQuickFilter}
        searchQuery={searchQuery}
        setSearchQuery={debouncedSetSearchQuery}
        filterOptions={BOARD_FILTER_OPTIONS}
        onReset={handleResetFilters}
      />
      <Grids
        items={filteredBoards}
        cardComponent={CardMain}
        itemKey="board_id"
        gridType="boards"
        handleFavorite={toggleFavoriteBoard}
        setEditingItem={(board) => {
          setEditingBoard(board);
          setEditDialogOpen(true);
        }}
        setItemToDelete={setBoardToDelete}
        setDeleteDialogOpen={setDeleteDialogOpen}
        handleManageMembers={handleOpenMemberDialog}
        navigate={navigate}
        currentUser={authData}
        token={token}
        onCreateNew={handleOpenCreateBoard}
        loadMore={handleLoadMore}
        hasMore={pagination.hasMore}
        loading={boardsLoading}
      />
      <EntityDialogs
        type="boards"
        createOpen={createDialogOpen}
        editOpen={editDialogOpen}
        deleteOpen={deleteDialogOpen}
        memberOpen={memberDialogOpen}
        item={popupBoard}
        setItem={setPopupBoard}
        editingItem={editingBoard}
        setEditingItem={setEditingBoard}
        itemToDelete={boardToDelete}
        setItemToDelete={setBoardToDelete}
        onSaveCreate={handleCreate}
        onSaveEdit={handleUpdate}
        onCancelCreate={handleCancelCreate}
        onCancelEdit={() => {
          setEditDialogOpen(false);
          setEditingBoard(null);
        }}
        onConfirmDelete={handleDelete}
        onCloseDelete={() => {
          setDeleteDialogOpen(false);
          setBoardToDelete(null);
        }}
        selectedId={selectedBoardId}
        members={boards.find((b) => b.board_id === selectedBoardId)?.members || []}
        addMember={handleAddMember}
        removeMember={handleRemoveMember}
        updateMemberRole={handleUpdateMemberRole}
        onSaveMembers={handleSaveMembers}
        onCancelMembers={handleCancelMembers}
        disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
        loading={actionLoading}
        token={token}
        gates={gates}
        classes={classes}
      />
    </AppLayout>
  );
};

BoardsPage.propTypes = {
  token: PropTypes.string,
  authData: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    avatar: PropTypes.string,
    anonymous_id: PropTypes.string,
  }),
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(BoardsPage);