// src/pages/GatePage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/Layout/AppLayout";
import LoadingSpinner from "../components/Layout/LoadingSpinner";
import ErrorMessage from "../components/Layout/ErrorMessage";
import GateSection from "../sections/GateSection/GateSection";
import CreateModal from "../components/CreateModal/CreateModal";
import { useGates } from "../hooks/useGates";
import { useClasses } from "../hooks/useClasses";

const GatePage = ({ currentUser, onLogout, token }) => {
  const { gate_id } = useParams();
  const navigate = useNavigate();
  const { fetchGate, loading: gateLoading, error: gateError } = useGates(token);
  const {
    classes,
    fetchClassesByGateId,
    loading: classesLoading,
    error: classesError,
  } = useClasses(token, onLogout, navigate);
  const [gateData, setGateData] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadGateData = async () => {
      try {
        const gate = await fetchGate(gate_id, signal);
        if (!gate) {
          throw new Error("Gate not found");
        }
        setGateData(gate);
        await fetchClassesByGateId(gate_id, signal);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading gate data:", err);
        }
      }
    };

    if (gate_id && token) {
      loadGateData();
    }

    return () => controller.abort();
  }, [gate_id, token, fetchGate, fetchClassesByGateId]);

  const handleCreateSuccess = () => {
    fetchClassesByGateId(gate_id);
  };

  if (gateLoading || classesLoading) return <LoadingSpinner />;
  if (gateError) return <ErrorMessage message={gateError} />;
  if (classesError) return <ErrorMessage message={classesError} />;
  if (!gateData) return <ErrorMessage message="Gate not found" />;

  return (
    <AppLayout currentUser={currentUser} onLogout={onLogout} token={token}>
      <GateSection
        currentUser={currentUser}
        gateData={gateData}
        classes={classes}
        onCreate={() => setOpenModal(true)}
      />
      <CreateModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        entityType="class"
        token={token}
        gateId={gate_id}
        onSuccess={handleCreateSuccess}
      />
    </AppLayout>
  );
};

export default GatePage;