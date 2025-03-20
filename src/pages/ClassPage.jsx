import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import ClassSection from "../sections/ClassSection/ClassSection";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import CreateModal from "../components/Modals/CreateModal";
import { useClasses } from "../hooks/useClasses";

const ClassPage = ({ currentUser, onLogout, token }) => {
  const { gate_id, class_id } = useParams(); // Assume route is /class/:gate_id/:class_id
  const navigate = useNavigate();
  const { fetchClass, loading, error } = useClasses(token, onLogout, navigate);
  const [classData, setClassData] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const loadClass = async () => {
      try {
        const data = await fetchClass(class_id, gate_id);
        setClassData(data);
      } catch (err) {
        // Error is already set by the hook
      }
    };
    loadClass();
  }, [class_id, gate_id, fetchClass]);

  const handleCreateSuccess = () => {
    fetchClass(class_id, gate_id).then((data) => setClassData(data));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <ClassSection
        currentUser={currentUser}
        classData={classData}
        token={token}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="board"
        token={token}
        onSuccess={handleCreateSuccess}
        gateId={gate_id} // Pass gate_id to CreateModal for creating boards
        classId={class_id} // Pass class_id to CreateModal for creating boards
      />
    </AppLayout>
  );
};

export default ClassPage;