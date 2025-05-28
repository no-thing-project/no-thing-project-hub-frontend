import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Add, Public, Lock, People, Forum, Star, Home } from '@mui/icons-material';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import EntityGrid from '../components/Common/EntityGrid';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import CardMain from '../components/Cards/CardMain';
import useAuth from '../hooks/useAuth';
import { useClasses } from '../hooks/useClasses';
import { useBoards } from '../hooks/useBoards';
import { useGates } from '../hooks/useGates';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
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

const ClassPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { class_id } = useParams();
  const { showNotification } = useNotification();
  const { token, authData, handleLogout, isAuthenticated, loading: authLoading } = useAuth();
  const {
    classItem: classData,
    members,
    stats,
    classes,
    fetchClass,
    fetchClassMembersList,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    toggleFavoriteClass,
    loading: classesLoading,
    error: classError,
  } = useClasses(token, handleLogout, navigate, true);
  const {
    boards,
    pagination,
    fetchBoardsByClass,
    createNewBoard,
    updateExistingBoard,
    deleteExistingBoard,
    addMemberToBoard,
    removeMemberFromBoard,
    updateMemberRole: updateBoardMemberRole,
    toggleFavoriteBoard,
    loading: boardsLoading,
    error: boardsError,
  } = useBoards(token, handleLogout, navigate, true);
  const {
    gates,
    fetchGatesList,
    loading: gatesLoading,
    error: gatesError,
  } = useGates(token, handleLogout, navigate, true);

  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false);
  const [memberBoardDialogOpen, setMemberBoardDialogOpen] = useState(false);
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [memberClassDialogOpen, setMemberClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [popupBoard, setPopupBoard] = useState({ ...DEFAULT_BOARD, class_id });
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
          fetchBoardsByClass(
            class_id,
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
    [boardsLoading, pagination.hasMore, pagination.page, quickFilter, class_id, fetchBoardsByClass, showNotification]
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  const fetchFunctions = useMemo(
    () => [
      (signal) =>
        fetchClass(class_id, signal, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch class', 'error');
          }
        }),
      (signal) =>
        fetchClassMembersList(class_id, signal, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch class members', 'error');
          }
        }),
      (signal) =>
        fetchBoardsByClass(
          class_id,
          { page: 1, limit: pagination.limit },
          signal,
          false,
          (err) => {
            if (err && err.name !== 'AbortError') {
              showNotification(err.message || 'Failed to fetch boards', 'error');
            }
          }
        ),
      (signal) =>
        fetchGatesList({ visibility: 'public' }, signal, false, (err) => {
          if (err && err.name !== 'AbortError') {
            showNotification(err.message || 'Failed to fetch gates', 'error');
          }
        }),
    ],
    [fetchClass, fetchClassMembersList, fetchBoardsByClass, fetchGatesList, class_id, pagination.limit, showNotification]
  );

  const { isLoading, actionLoading, setActionLoading } = useEntity(fetchFunctions, token, handleLogout, navigate, 'class');

  useEffect(() => {
    if (!class_id?.trim()) {
      showNotification('Invalid class ID', 'error');
      navigate('/classes');
    }
  }, [class_id, navigate, showNotification]);

  useEffect(() => {
    const errors = [classError, boardsError, gatesError].filter(Boolean);
    errors.forEach((error) => {
      if (error && error !== 'canceled') {
        showNotification(error, 'error');
      }
    });
  }, [classError, boardsError, gatesError, showNotification]);

  useEffect(() => {
    if (!editingClass && editClassDialogOpen) {
      setEditClassDialogOpen(false);
    }
    if (!editingBoard && editBoardDialogOpen) {
      setEditBoardDialogOpen(false);
    }
  }, [editingClass, editClassDialogOpen, editingBoard, editBoardDialogOpen]);

  const filteredBoards = useMemo(
    () => filterEntities(boards || [], 'boards', quickFilter, searchQuery, gates || [], classes || [], [{ class_id }]),
    [boards, classes, gates, quickFilter, searchQuery, class_id]
  );

  const userRole = useMemo(
    () => members?.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'none',
    [members, authData]
  );
  const gate = useMemo(() => gates.find((g) => g.gate_id === classData?.gate_id) || null, [gates, classData]);
  const isOwner = classData?.creator_id === authData?.anonymous_id;
  const canEdit = isOwner || userRole === 'admin';
  const canDelete = isOwner;
  const canCreateBoard = classData?.access?.is_public || userRole !== 'viewer';

  const handleOpenCreateBoard = useCallback(() => setCreateBoardDialogOpen(true), []);
  const handleCancelCreateBoard = useCallback(() => {
    setCreateBoardDialogOpen(false);
    setPopupBoard({ ...DEFAULT_BOARD, class_id });
  }, [class_id]);

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name?.trim()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdBoard = await createNewBoard({ ...popupBoard, class_id });
      setCreateBoardDialogOpen(false);
      setPopupBoard({ ...DEFAULT_BOARD, class_id });
      showNotification('Board created successfully!', 'success');
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupBoard, createNewBoard, class_id, navigate, showNotification, setActionLoading]);

  const handleUpdateBoard = useCallback(async () => {
    if (!editingBoard?.name?.trim()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingBoard(editingBoard.board_id, editingBoard);
      setEditBoardDialogOpen(false);
      setEditingBoard(null);
      showNotification('Board updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingBoard, updateExistingBoard, showNotification, setActionLoading]);

  const handleDeleteBoard = useCallback(async () => {
    if (!boardToDelete) return;
    setActionLoading(true);
    try {
      await deleteExistingBoard(boardToDelete);
      setDeleteBoardDialogOpen(false);
      setBoardToDelete(null);
      showNotification('Board deleted successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to delete board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [boardToDelete, deleteExistingBoard, showNotification, setActionLoading]);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass?.name?.trim()) {
      showNotification('Class name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      await updateExistingClass(editingClass.class_id, editingClass);
      setEditClassDialogOpen(false);
      setEditingClass(null);
      showNotification('Class updated successfully!', 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to update class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [editingClass, updateExistingClass, showNotification, setActionLoading]);

  const handleDeleteClass = useCallback(async () => {
    setActionLoading(true);
    try {
      await deleteExistingClass(class_id);
      setDeleteClassDialogOpen(false);
      showNotification('Class deleted successfully!', 'success');
      navigate('/classes');
    } catch (err) {
      showNotification(err.message || 'Failed to delete class', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [class_id, deleteExistingClass, navigate, showNotification, setActionLoading]);

  const handleFavoriteToggle = useCallback(async () => {
    setActionLoading(true);
    try {
      await toggleFavoriteClass(class_id, classData?.is_favorited);
      showNotification(
        classData?.is_favorited ? 'Class removed from favorites!' : 'Class added to favorites!',
        'success'
      );
    } catch (err) {
      showNotification(err.message || 'Failed to toggle favorite', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [class_id, classData, toggleFavoriteClass, showNotification, setActionLoading]);

  const handleAddMember = useCallback(
    async (id, memberData, isBoard = false) => {
      setActionLoading(true);
      try {
        const entity = isBoard
          ? boards.find((b) => b.board_id === id)
          : { members, settings: classData?.settings };
        if (entity?.members?.length >= entity?.settings?.max_members) {
          showNotification('Maximum member limit reached!', 'error');
          return;
        }
        await (isBoard ? addMemberToBoard : addMemberToClass)(id, memberData);
        showNotification('Member added successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to add member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [addMemberToBoard, addMemberToClass, boards, members, classData, showNotification, setActionLoading]
  );

  const handleRemoveMember = useCallback(
    async (id, username, isBoard = false) => {
      setActionLoading(true);
      try {
        await (isBoard ? removeMemberFromBoard : removeMemberFromClass)(id, username);
        showNotification('Member removed successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to remove member', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [removeMemberFromBoard, removeMemberFromClass, showNotification, setActionLoading]
  );

  const handleUpdateMemberRole = useCallback(
    async (id, username, newRole, isBoard = false) => {
      setActionLoading(true);
      try {
        await (isBoard ? updateBoardMemberRole : updateClassMemberRole)(id, username, newRole);
        showNotification('Member role updated successfully!', 'success');
      } catch (err) {
        showNotification(err.message || 'Failed to update member role', 'error');
      } finally {
        setActionLoading(false);
      }
    },
    [updateBoardMemberRole, updateClassMemberRole, showNotification, setActionLoading]
  );

  const handleOpenClassMemberDialog = useCallback(() => {
    setMemberClassDialogOpen(true);
  }, []);

  const handleOpenBoardMemberDialog = useCallback((boardId) => {
    setSelectedBoardId(boardId);
    setMemberBoardDialogOpen(true);
  }, []);

  const handleSaveMembers = useCallback(
    (isBoard = false) => {
      if (isBoard) {
        setMemberBoardDialogOpen(false);
        setSelectedBoardId(null);
      } else {
        setMemberClassDialogOpen(false);
      }
      showNotification('Members updated successfully!', 'success');
    },
    [showNotification]
  );

  const handleCancelBoardMemberDialog = useCallback(() => {
    setMemberBoardDialogOpen(false);
    setSelectedBoardId(null);
  }, []);

  const handleCancelClassMemberDialog = useCallback(() => {
    setMemberClassDialogOpen(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setQuickFilter('all');
    setSearchQuery('');
    debouncedSetSearchQuery.cancel();
    const controller = new AbortController();
    fetchBoardsByClass(class_id, { page: 1, reset: { visibility: true } }, controller.signal, false, (err) => {
      if (err && err.name !== 'AbortError') {
        showNotification(err.message || 'Failed to reset filters', 'error');
      }
    });
    return () => controller.abort();
  }, [debouncedSetSearchQuery, fetchBoardsByClass, class_id, showNotification]);

  const headerData = useMemo(
    () => ({
      type: 'class',
      title: classData?.name || 'Untitled Class',
      titleAriaLabel: `Class name: ${classData?.name || 'Untitled Class'}`,
      description: classData?.description || 'No description provided',
      descriptionAriaLabel: classData?.description ? `Class description: ${classData.description}` : undefined,
      chips: [
        {
          label: gate?.name || 'No Gate',
          icon: <Home />,
          color: 'secondary',
          ariaLabel: `Gate: ${gate?.name || 'No Gate'}`,
          onClick: gate?.gate_id ? () => navigate(`/gate/${gate.gate_id}`) : undefined,
        },
        {
          label: classData?.access?.is_public ? 'Public' : 'Private',
          icon: classData?.access?.is_public ? <Public /> : <Lock />,
          color: classData?.access?.is_public ? 'success' : 'default',
          ariaLabel: classData?.access?.is_public ? 'Public class' : 'Private class',
        },
        {
          label: `Members: ${stats?.member_count || members?.length || 0}`,
          icon: <People />,
          color: 'primary',
          ariaLabel: `Members: ${stats?.member_count || members?.length || 0}`,
        },
        {
          label: `Boards: ${filteredBoards?.length || 0}`,
          icon: <Forum />,
          color: 'info',
          ariaLabel: `Boards: ${filteredBoards?.length || 0}`,
        },
        {
          label: `Favorites: ${stats?.favorite_count || 0}`,
          icon: <Star />,
          color: 'warning',
          ariaLabel: `Favorites: ${stats?.favorite_count || 0}`,
        },
        {
          label: `Owner: ${classData?.creator?.username || 'Unknown'}`,
          ariaLabel: `Owner: ${classData?.creator?.username || 'Unknown'}`,
        },
      ],
      actions: [
        {
          label: 'Create Board',
          icon: <Add />,
          onClick: handleOpenCreateBoard,
          tooltip: 'Create a new board within this class',
          disabled: actionLoading || classesLoading || boardsLoading || !canCreateBoard,
          ariaLabel: 'Create a new board',
        },
        {
          label: 'Edit Class',
          onClick: () => {
            if (!classData) {
              showNotification('Class data is not available', 'error');
              return;
            }
            setEditingClass({
              class_id: classData.class_id,
              name: classData.name || '',
              description: classData.description || '',
              is_public: classData.access?.is_public || false,
              visibility: classData.access?.is_public ? 'public' : 'private',
              gate_id: classData.gate_id || '',
              settings: classData.settings || {
                max_boards: 100,
                max_members: 50,
                board_creation_cost: 50,
                tweet_cost: 1,
                allow_invites: true,
                require_approval: false,
                ai_moderation_enabled: true,
                auto_archive_after: 30,
              },
              tags: classData.tags || [],
            });
            setEditClassDialogOpen(true);
          },
          tooltip: 'Edit class details and settings',
          disabled: actionLoading || !canEdit || isLoading,
          ariaLabel: 'Edit class',
          isMenuItem: true,
        },
        {
          label: 'Manage Members',
          onClick: handleOpenClassMemberDialog,
          tooltip: 'Manage class members',
          disabled: actionLoading || !canEdit,
          ariaLabel: 'Manage class members',
          isMenuItem: true,
        },
        {
          label: 'Delete Class',
          onClick: () => setDeleteClassDialogOpen(true),
          tooltip: 'Permanently delete this class',
          disabled: actionLoading || !canDelete,
          ariaLabel: 'Delete class',
          variant: 'delete',
          isMenuItem: true,
        },
      ].filter((action) => action.label !== 'Create Board' || canCreateBoard),
      isFavorited: classData?.is_favorited || false,
      onFavoriteToggle: handleFavoriteToggle,
      actionLoading,
    }),
    [
      classData,
      stats,
      members,
      filteredBoards,
      gate,
      canEdit,
      canDelete,
      canCreateBoard,
      actionLoading,
      classesLoading,
      boardsLoading,
      isLoading,
      handleOpenCreateBoard,
      handleOpenClassMemberDialog,
      handleFavoriteToggle,
      navigate,
      showNotification,
    ]
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

  if (!classData && classError && classError !== 'canceled') {
    showNotification('Class not found or failed to load', 'error');
    navigate('/classes');
    return null;
  }

  return (
    <ErrorBoundary>
      <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
        <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole} />
        <EntityGrid
          type="boards"
          items={filteredBoards}
          cardComponent={CardMain}
          itemKey="board_id"
          quickFilter={quickFilter}
          setQuickFilter={setQuickFilter}
          searchQuery={searchQuery}
          setSearchQuery={debouncedSetSearchQuery}
          filterOptions={BOARD_FILTER_OPTIONS}
          onResetFilters={handleResetFilters}
          handleFavorite={toggleFavoriteBoard}
          setEditingItem={(board) => {
            setEditingBoard(board);
            setEditBoardDialogOpen(true);
          }}
          setItemToDelete={setBoardToDelete}
          setDeleteDialogOpen={setDeleteBoardDialogOpen}
          handleManageMembers={handleOpenBoardMemberDialog}
          navigate={navigate}
          currentUser={authData}
          token={token}
          onCreateNew={canCreateBoard ? handleOpenCreateBoard : null}
          lastItemRef={lastBoardElementRef}
          hasMore={pagination.hasMore}
          loading={boardsLoading}
          disabled={actionLoading || classesLoading || boardsLoading}
        />
        <EntityDialogs
          type="boards"
          createOpen={createBoardDialogOpen}
          editOpen={editBoardDialogOpen}
          deleteOpen={deleteBoardDialogOpen}
          memberOpen={memberBoardDialogOpen}
          item={popupBoard}
          setItem={setPopupBoard}
          editingItem={editingBoard}
          setEditingItem={setEditingBoard}
          itemToDelete={boardToDelete}
          setItemToDelete={setBoardToDelete}
          onSaveCreate={handleCreateBoard}
          onSaveEdit={handleUpdateBoard}
          onCancelCreate={handleCancelCreateBoard}
          onCancelEdit={() => {
            setEditBoardDialogOpen(false);
            setEditingBoard(null);
          }}
          onConfirmDelete={handleDeleteBoard}
          onCloseDelete={() => {
            setDeleteBoardDialogOpen(false);
            setBoardToDelete(null);
          }}
          selectedId={selectedBoardId}
          members={boards.find((b) => b.board_id === selectedBoardId)?.members || []}
          addMember={(id, memberData) => handleAddMember(id, memberData, true)}
          removeMember={(id, username) => handleRemoveMember(id, username, true)}
          updateMemberRole={(id, username, role) => handleUpdateMemberRole(id, username, role, true)}
          onSaveMembers={() => handleSaveMembers(true)}
          onCancelMembers={handleCancelBoardMemberDialog}
          disabled={actionLoading || classesLoading || boardsLoading}
          loading={actionLoading}
          token={token}
          gates={gates}
          classes={classes}
          currentClass={classData}
          fixedClassId={class_id}
          initialClassId={class_id}
        />
        {editClassDialogOpen && editingClass && (
          <EntityDialogs
            type="classes"
            createOpen={false}
            editOpen={editClassDialogOpen}
            deleteOpen={deleteClassDialogOpen}
            memberOpen={memberClassDialogOpen}
            item={editingClass}
            setItem={setEditingClass}
            editingItem={editingClass}
            setEditingItem={setEditingClass}
            itemToDelete={class_id}
            setItemToDelete={() => {}}
            onSaveCreate={() => {}}
            onSaveEdit={handleUpdateClass}
            onCancelCreate={() => {}}
            onCancelEdit={() => {
              setEditClassDialogOpen(false);
              setEditingClass(null);
            }}
            onConfirmDelete={handleDeleteClass}
            onCloseDelete={() => setDeleteClassDialogOpen(false)}
            selectedId={class_id}
            members={members || []}
            addMember={(id, memberData) => handleAddMember(id, memberData, false)}
            removeMember={(id, username) => handleRemoveMember(id, username, false)}
            updateMemberRole={(id, username, role) => handleUpdateMemberRole(id, username, role, false)}
            onSaveMembers={() => handleSaveMembers(false)}
            onCancelMembers={handleCancelClassMemberDialog}
            disabled={actionLoading || classesLoading}
            loading={actionLoading}
            token={token}
            gates={gates}
            classes={classes}
            currentGate={gate}
          />
        )}
      </AppLayout>
    </ErrorBoundary>
  );
};

ClassPage.propTypes = {
  token: PropTypes.string,
  authData: PropTypes.shape({
    anonymous_id: PropTypes.string,
    username: PropTypes.string,
    avatar: PropTypes.string,
    total_points: PropTypes.number,
  }),
  handleLogout: PropTypes.func,
  isAuthenticated: PropTypes.bool,
  authLoading: PropTypes.bool,
};

export default React.memo(ClassPage);