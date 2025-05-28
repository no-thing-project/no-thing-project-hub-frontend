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
import Filters from '../components/Filters/Filters';
import Grids from '../components/Grids/Grids';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_BOARD } from '../constants/default';
import { BOARD_FILTER_OPTIONS } from '../constants/filterOptions';

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback((error, errorInfo) => {
    console.error('ErrorBoundary caught:', error, errorInfo);
    setHasError(true);
  }, []);

  if (hasError) {
    return <div>Something went wrong. Please try again later.</div>;
  }

  return children;
};

const BoardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    boards,
    pagination,
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
  } = useBoards(token, handleLogout, navigate, false);
  const { classes, fetchClassesList, loading: classesLoading, error: classesError } = useClasses(
    token,
    handleLogout,
    navigate,
    true
  );
  const { gates, fetchGatesList, loading: gatesLoading, error: gatesError } = useGates(
    token,
    handleLogout,
    navigate,
    true
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

  const observer = useRef();
  const lastBoardElementRef = useCallback(
    (node) => {
      if (boardsLoading || !pagination.hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          const controller = new AbortController();
          fetchBoardsList(
            { visibility: quickFilter === 'all' ? undefined : quickFilter, page: pagination.page + 1 },
            controller.signal,
            true,
            (err) => {
              if (err && err.name !== 'AbortError') {
                showNotification(err.message || 'Failed to load more boards', 'error');
              }
            }
          );
          return () => controller.abort();
        }
      });
      if (node) observer.current.observe(node);
    },
    [boardsLoading, pagination.hasMore, pagination.page, quickFilter, fetchBoardsList, showNotification]
  );

  const stableFetchBoardsList = useMemo(
    () => [
      () =>
        fetchBoardsList({ page: 1, limit: pagination.limit }, null, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch boards', 'error');
          }
        }),
      () =>
        fetchClassesList({ visibility: 'public' }, null, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch classes', 'error');
          }
        }),
      () =>
        fetchGatesList({ visibility: 'public' }, null, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch gates', 'error');
          }
        }),
    ],
    [fetchBoardsList, fetchClassesList, fetchGatesList, pagination.limit, showNotification]
  );

  const { isLoading, actionLoading, setActionLoading } = useEntity(
    stableFetchBoardsList,
    token,
    handleLogout,
    navigate,
    'boards'
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  useEffect(() => {
    if (boardsError && boardsError !== 'canceled') {
      showNotification(boardsError, 'error');
    }
    if (classesError && classesError !== 'canceled') {
      showNotification(classesError, 'error');
    }
    if (gatesError && gatesError !== 'canceled') {
      showNotification(gatesError, 'error');
    }
  }, [boardsError, classesError, gatesError, showNotification]);

  const filteredBoards = useMemo(
    () => filterEntities(boards || [], 'boards', quickFilter, searchQuery, gates || [], classes || []),
    [boards, gates, classes, quickFilter, searchQuery]
  );

  useEffect(() => {
    if (searchQuery || quickFilter !== 'all') {
      const controller = new AbortController();
      Promise.all([
        fetchClassesList({ visibility: 'public' }, controller.signal, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch classes', 'error');
          }
        }),
        fetchGatesList({ visibility: 'public' }, controller.signal, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch gates', 'error');
          }
        }),
      ]).catch((err) => {
        if (err.name !== 'AbortError') {
          showNotification(err.message || 'Failed to fetch related data', 'error');
        }
      });
      return () => controller.abort();
    }
  }, [searchQuery, quickFilter, fetchClassesList, fetchGatesList, showNotification]);

  const handleOpenCreate = useCallback(() => setCreateDialogOpen(true), []);
  const handleCancelCreate = useCallback(() => {
    setCreateDialogOpen(false);
    setPopupBoard(DEFAULT_BOARD);
  }, []);

  const handleCreate = useCallback(
    async (gateId, classId) => {
      if (!popupBoard.name?.trim()) {
        showNotification('Board name is required!', 'error');
        return;
      }
      setActionLoading(true);
      try {
        let createdBoard;
        if (gateId) {
          createdBoard = await createNewBoard({ ...popupBoard, gate_id: gateId });
        } else if (classId) {
          createdBoard = await createNewBoard({ ...popupBoard, class_id: classId });
        } else {
          createdBoard = await createNewBoard(popupBoard);
        }
        setCreateDialogOpen(false);
        setPopupBoard(DEFAULT_BOARD);
        showNotification('Board created successfully!', 'success');
        navigate(`/board/${createdBoard.board_id}`);
      } catch (err) {
        showNotification(err.message || 'Failed to create board', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [popupBoard, createNewBoard, navigate, showNotification, setActionLoading]
  );

  const handleUpdate = useCallback(async () => {
    if (!editingBoard?.name?.trim()) {
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

  const handleCancelMemberDialog = useCallback(() => {
    setMemberDialogOpen(false);
    setSelectedBoardId(null);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
    fetchBoardsList({ page: 1, reset: { visibility: true } }, null, false, (err) => {
      if (err && err.name !== 'AbortError') {
        showNotification(err.message || 'Failed to reset filters', 'error');
      }
    });
  }, [debouncedSetSearchQuery, fetchBoardsList, showNotification]);

  const headerData = useMemo(
    () => ({
      type: 'page',
      title: 'Boards',
      titleAriaLabel: 'Boards page',
      shortDescription: 'Your Spaces for Collaboration',
      tooltipDescription:
        'Boards are interactive spaces for discussions and tasks within classes or gates. Create a board to organize your projects or collaborate with others.',
      actions: isAuthenticated
        ? [
            {
              label: 'Create Board',
              icon: <Add />,
              onClick: handleOpenCreate,
              tooltip: 'Create a new board',
              disabled: actionLoading || boardsLoading || classesLoading || gatesLoading,
              ariaLabel: 'Create a new board',
            },
          ]
        : [],
    }),
    [isAuthenticated, handleOpenCreate, actionLoading, boardsLoading, classesLoading, gatesLoading]
  );

  if (authLoading || isLoading) {
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
    <ErrorBoundary>
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} />
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
          onCreateNew={handleOpenCreate}
          lastItemRef={lastBoardElementRef}
          hasMore={pagination.hasMore}
          loading={boardsLoading}
          disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
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
          onCancelMembers={handleCancelMemberDialog}
          disabled={actionLoading || boardsLoading || classesLoading || gatesLoading}
          loading={actionLoading}
          token={token}
          gates={gates}
          classes={classes}
        />
      </AppLayout>
    </ErrorBoundary>
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