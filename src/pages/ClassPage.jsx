import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Add, Public, Lock, People, Forum, Star, Home } from '@mui/icons-material';
import PropTypes from 'prop-types';
import AppLayout from '../components/Layout/AppLayout';
import ProfileHeader from '../components/Headers/ProfileHeader';
import useAuth from '../hooks/useAuth';
import { useClasses } from '../hooks/useClasses';
import { useBoards } from '../hooks/useBoards';
import { useGates } from '../hooks/useGates';
import { useEntity } from '../hooks/useEntity';
import { useNotification } from '../context/NotificationContext';
import CardMain from '../components/Cards/CardMain';
import EntityGrid from '../components/Common/EntityGrid';
import EntityDialogs from '../components/Common/EntityDialogs';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';
import { filterEntities } from '../utils/filterUtils';
import { DEFAULT_BOARD } from '../constants/default';
import { BOARD_FILTER_OPTIONS } from '../constants/filterOptions';
import { debounce } from 'lodash';

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
    fetchClassesList,
    updateExistingClass,
    deleteExistingClass,
    addMemberToClass,
    removeMemberFromClass,
    updateMemberRole: updateClassMemberRole,
    toggleFavoriteClass,
    loading: classesLoading,
    error: classError,
  } = useClasses(token, handleLogout, navigate);
  const {
    boards,
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
  } = useBoards(token, handleLogout, navigate);
  const {
    gates,
    fetchGatesList,
    loading: gatesLoading,
    error: gatesError,
  } = useGates(token, handleLogout, navigate);

  // Dialog states for boards
  const [createBoardDialogOpen, setCreateBoardDialogOpen] = useState(false);
  const [editBoardDialogOpen, setEditBoardDialogOpen] = useState(false);
  const [deleteBoardDialogOpen, setDeleteBoardDialogOpen] = useState(false);
  const [memberBoardDialogOpen, setMemberBoardDialogOpen] = useState(false);
  // Dialog states for class
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  const [deleteClassDialogOpen, setDeleteClassDialogOpen] = useState(false);
  const [memberClassDialogOpen, setMemberClassDialogOpen] = useState(false);
  // Entity states
  const [editingClass, setEditingClass] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [popupBoard, setPopupBoard] = useState({ ...DEFAULT_BOARD, class_id, gate_id: null });
  const [quickFilter, setQuickFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Validate class_id early
  useEffect(() => {
    if (!class_id || typeof class_id !== 'string' || class_id.trim() === '') {
      showNotification('Invalid class ID', 'error');
      navigate('/classes');
    }
  }, [class_id, navigate, showNotification]);

  const { isLoading, actionLoading, setActionLoading } = useEntity(
    useMemo(
      () => [
        () => fetchClass(class_id),
        () => fetchClassMembersList(class_id),
        () => fetchBoardsByClass(class_id, {}),
        () => fetchGatesList({}),
        () => fetchClassesList({}),
      ],
      [fetchClass, fetchClassMembersList, fetchBoardsByClass, fetchGatesList, fetchClassesList, class_id]
    ),
    token,
    handleLogout,
    navigate,
    'class'
  );

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => setSearchQuery(value), 300),
    []
  );

  // Handle errors
  useEffect(() => {
    if (classError && classError !== 'canceled') {
      showNotification(classError, 'error');
    }
    if (boardsError && boardsError !== 'canceled') {
      showNotification(boardsError, 'error');
    }
    if (gatesError && gatesError !== 'canceled') {
      showNotification(gatesError, 'error');
    }
  }, [classError, boardsError, gatesError, showNotification]);

  // Sync popupBoard
  useEffect(() => {
    setPopupBoard((prev) => ({
      ...prev,
      class_id,
      gate_id: classData?.gate_id || null,
    }));
  }, [class_id, classData]);

  // Close edit dialogs if no editing entity
  useEffect(() => {
    if (!editingClass && editClassDialogOpen) {
      console.warn('editClassDialogOpen is true but editingClass is null');
      setEditClassDialogOpen(false);
    }
    if (!editingBoard && editBoardDialogOpen) {
      setEditBoardDialogOpen(false);
    }
  }, [editingClass, editClassDialogOpen, editingBoard, editBoardDialogOpen]);

  // Filter boards with class context
  const filteredBoards = useMemo(() => {
    const classFilter = classData ? [{ class_id: classData.class_id || class_id }] : [];
    return filterEntities(boards || [], 'boards', quickFilter, searchQuery, gates || [], classes || [], classFilter);
  }, [boards, classData, classes, gates, quickFilter, searchQuery, class_id]);

  // Board handlers
  const handleOpenCreateBoard = useCallback(() => setCreateBoardDialogOpen(true), []);
  const handleCancelCreateBoard = useCallback(() => {
    setCreateBoardDialogOpen(false);
    setPopupBoard({ ...DEFAULT_BOARD, class_id, gate_id: classData?.gate_id || null });
  }, [class_id, classData]);

  const handleCreateBoard = useCallback(async () => {
    if (!popupBoard.name?.trim()) {
      showNotification('Board name is required!', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const createdBoard = await createNewBoard({
        ...popupBoard,
        class_id,
        gate_id: classData?.gate_id || null,
      });
      setCreateBoardDialogOpen(false);
      setPopupBoard({ ...DEFAULT_BOARD, class_id, gate_id: classData?.gate_id || null });
      showNotification('Board created successfully!', 'success');
      navigate(`/board/${createdBoard.board_id}`);
    } catch (err) {
      showNotification(err.message || 'Failed to create board', 'error');
    } finally {
      setActionLoading(false);
    }
  }, [popupBoard, createNewBoard, class_id, classData, navigate, showNotification, setActionLoading]);

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

  // Class handlers
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

  // Member handlers
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

  // Dialog togglers
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
  }, [debouncedSetSearchQuery]);

  // Permissions
  const userRole = useMemo(
    () => members?.find((m) => m.anonymous_id === authData?.anonymous_id)?.role || 'none',
    [members, authData]
  );
  const gate = useMemo(() => gates.find((g) => g.gate_id === classData?.gate_id) || null, [gates, classData]);
  const isOwner = classData?.creator_id === authData?.anonymous_id;
  const canEdit = isOwner || userRole === 'admin';
  const canDelete = isOwner;
  const canCreateBoard = classData?.access?.is_public || userRole !== 'viewer';

  // Edit Class handler
  const handleEditClass = useCallback(() => {
    if (!classData) {
      console.warn('Attempted to edit class but classData is null');
      showNotification('Class data not available', 'error');
      return;
    }
    const newEditingClass = {
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
    };
    setEditingClass(newEditingClass);
    setEditClassDialogOpen(true);
  }, [classData, showNotification]);

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
          isMenuItem: false,
        },
        {
          label: 'Edit Class',
          onClick: () => {
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
            })
          },
          tooltip: 'Edit class details and settings',
          disabled: actionLoading || !canEdit || !classData || isLoading,
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
          isMenuItem: 'delete',
        },
      ].filter(
        (action) => action.label !== 'Create Board' || canCreateBoard
      ),
      isFavorited: classData?.is_favorited || false,
      onFavoriteToggle: handleFavoriteToggle,
      actionLoading,
    }),
    [
      gate,
      classData,
      stats,
      members,
      filteredBoards,
      userRole,
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
      handleEditClass, // Add to dependencies
    ]
  );

  // Modified loading condition to prioritize classData
  if (authLoading || (isLoading && !classData)) {
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
    <AppLayout currentUser={authData} onLogout={handleLogout} token={token}>
      <ProfileHeader user={authData} isOwnProfile={true} headerData={headerData} userRole={userRole} />
      <EntityGrid
        type="boards"
        items={filteredBoards || []}
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
        disabled={actionLoading || classesLoading || boardsLoading}
      />
      {/* Board Dialogs */}
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
        onCancelCreate={handleCancelCreateBoard} // Fixed reference
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
      {/* Class Dialogs */}
      <EntityDialogs
        type="classes"
        createOpen={false}
        editOpen={editClassDialogOpen}
        deleteOpen={deleteClassDialogOpen}
        memberOpen={memberClassDialogOpen}
        item={classData}
        setItem={setEditingClass}
        editingItem={editingClass}
        setEditingItem={setEditingClass}
        itemToDelete={null}
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
        members={classData?.members || []}
        addMember={(id, memberData) => handleAddMember(id, memberData, false)}
        removeMember={(id, username) => handleRemoveMember(id, username, false)}
        updateMemberRole={(id, username, role) => handleUpdateMemberRole(id, username, role, false)}
        onSaveMembers={() => handleSaveMembers(false)}
        onCancel={handleCancelClassMemberDialog}
        disabled={actionLoading || classesLoading}
        loading={actionLoading}
        token={token}
        gates={gates}
        classes={classes}
        currentGate={gate}
      />
    </AppLayout>
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