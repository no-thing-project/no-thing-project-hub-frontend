import React from 'react';
import PropTypes from 'prop-types';
import GateFormDialog from '../Dialogs/GateFormDialog';
import ClassFormDialog from '../Dialogs/ClassFormDialog';
import BoardFormDialog from '../Dialogs/BoardFormDialog';
import MemberFormDialog from '../Dialogs/MemberFormDialog';
import DeleteConfirmationDialog from '../Dialogs/DeleteConfirmationDialog';

const EntityDialogs = ({
  type,
  createOpen,
  editOpen,
  deleteOpen,
  memberOpen,
  item,
  setItem,
  editingItem,
  setEditingItem,
  itemToDelete,
  setItemToDelete,
  onSaveCreate,
  onSaveEdit,
  onCancelCreate,
  onCancelEdit,
  onConfirmDelete,
  onCloseDelete,
  selectedId,
  members,
  addMember,
  removeMember,
  updateMemberRole,
  onSaveMembers,
  onCancelMembers,
  disabled,
  loading,
  token,
  gates,
  classes,
  currentGate,
  currentClass,
  fixedGateId,
  fixedClassId,
  initialGateId,
  initialClassId,
}) => {
  const dialogProps = {
    disabled,
    loading,
    ariaLabelledby: `${type}-dialog`,
  };

  const getFormDialog = () => {
    switch (type) {
      case 'gates':
        return (
          <>
            <GateFormDialog
              open={createOpen}
              title="Create New Gate"
              gate={item}
              setGate={setItem}
              onSave={onSaveCreate}
              onCancel={onCancelCreate}
              {...dialogProps}
            />
            {editingItem && (
              <GateFormDialog
                open={editOpen}
                title="Edit Gate"
                gate={editingItem}
                setGate={setEditingItem}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                {...dialogProps}
              />
            )}
          </>
        );
      case 'classes':
        return (
          <>
            <ClassFormDialog
              open={createOpen}
              title="Create New Class"
              classItem={item}
              setClass={setItem}
              onSave={onSaveCreate}
              onCancel={onCancelCreate}
              gates={gates}
              fixedGateId={fixedGateId}
              initialGateId={initialGateId}
              currentGate={currentGate}
              {...dialogProps}
            />
            {editingItem && (
              <ClassFormDialog
                open={editOpen}
                title="Edit Class"
                classItem={editingItem}
                setClass={setEditingItem}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                gates={gates}
                fixedGateId={fixedGateId}
                initialGateId={initialGateId}
                currentGate={currentGate}
                {...dialogProps}
              />
            )}
          </>
        );
      case 'boards':
        return (
          <>
            <BoardFormDialog
              open={createOpen}
              title="Create New Board"
              board={item}
              setBoard={setItem}
              onSave={onSaveCreate}
              onCancel={onCancelCreate}
              gates={gates}
              classes={classes}
              currentClass={currentClass}
              initialClassId={initialClassId}
              fixedClassId={fixedClassId}
              fixedGateId={fixedGateId}
              {...dialogProps}
            />
            {editingItem && (
              <BoardFormDialog
                open={editOpen}
                title="Edit Board"
                board={editingItem}
                setBoard={setEditingItem}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                gates={gates}
                classes={classes}
                currentClass={currentClass}
                initialClassId={initialClassId}
                fixedClassId={fixedClassId}
                fixedGateId={fixedGateId}
                {...dialogProps}
              />
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {getFormDialog()}
      <MemberFormDialog
        open={memberOpen}
        title={`Manage ${type === 'gates' ? 'Gate' : type === 'classes' ? 'Class' : 'Board'} Members`}
        gateId={type === 'gates' ? selectedId : null}
        classId={type === 'classes' ? selectedId : null}
        boardId={type === 'boards' ? selectedId : null}
        token={token}
        members={members}
        addMember={addMember}
        removeMember={removeMember}
        updateMemberRole={updateMemberRole}
        onSave={onSaveMembers}
        onCancel={onCancelMembers}
        {...dialogProps}
      />
      <DeleteConfirmationDialog
        open={deleteOpen}
        onClose={onCloseDelete}
        onConfirm={onConfirmDelete}
        message={`Are you sure you want to delete this ${type === 'gates' ? 'gate' : type === 'classes' ? 'class' : 'board'}? This action cannot be undone.`}
        {...dialogProps}
      />
    </>
  );
};

EntityDialogs.propTypes = {
  type: PropTypes.oneOf(['gates', 'classes', 'boards']).isRequired,
  createOpen: PropTypes.bool.isRequired,
  editOpen: PropTypes.bool.isRequired,
  deleteOpen: PropTypes.bool.isRequired,
  memberOpen: PropTypes.bool.isRequired,
  item: PropTypes.object,
  setItem: PropTypes.func.isRequired,
  editingItem: PropTypes.object,
  setEditingItem: PropTypes.func.isRequired,
  itemToDelete: PropTypes.string,
  setItemToDelete: PropTypes.func.isRequired,
  onSaveCreate: PropTypes.func.isRequired,
  onSaveEdit: PropTypes.func.isRequired,
  onCancelCreate: PropTypes.func.isRequired,
  onCancelEdit: PropTypes.func.isRequired,
  onConfirmDelete: PropTypes.func.isRequired,
  onCloseDelete: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  members: PropTypes.array,
  addMember: PropTypes.func,
  removeMember: PropTypes.func,
  updateMemberRole: PropTypes.func,
  onSaveMembers: PropTypes.func,
  onCancelMembers: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  token: PropTypes.string,
  gates: PropTypes.array,
  classes: PropTypes.array,
  currentGate: PropTypes.object,
  currentClass: PropTypes.object,
  fixedGateId: PropTypes.string,
  fixedClassId: PropTypes.string,
  initialGateId: PropTypes.string,
  initialClassId: PropTypes.string,
};

export default React.memo(EntityDialogs);