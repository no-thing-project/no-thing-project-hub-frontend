import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.REACT_APP_HUB_API_URL,
  timeout: 10000, // Optional: Add a timeout to prevent hanging requests
});



// Gates
export const fetchGates = async (token) => {
  try {
    const response = await api.get(`/api/v1/gates`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.gates || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

export const fetchGateById = async (gate_id, token) => {
  try {
    const response = await api.get(`/api/v1/gates/${gate_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    return null;
  }
};

export const createGate = async (gateData, token) => {
  try {
    const response = await api.post(`/api/v1/gates`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const updateGate = async (gate_id, gateData, token) => {
  try {
    const response = await api.put(`/api/v1/gates/${gate_id}`, gateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const updateGateStatus = async (gate_id, statusData, token) => {
  try {
    const response = await api.put(`/api/v1/gates/${gate_id}/status`, statusData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const deleteGate = async (gate_id, token) => {
  try {
    const response = await api.delete(`/api/v1/gates/${gate_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const addGateMember = async (gate_id, memberData, token) => {
  try {
    const response = await api.post(`/api/v1/gates/${gate_id}/members`, memberData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const removeGateMember = async (gate_id, memberId, token) => {
  try {
    const response = await api.delete(`/api/v1/gates/${gate_id}/members/${memberId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const fetchGateMembers = async (gate_id, token) => {
  try {
    const response = await api.get(`/api/v1/gates/${gate_id}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content?.members || [];
  } catch (err) {
    handleApiError(err);
    return [];
  }
};

export const likeGate = async (gate_id, token) => {
  try {
    const response = await api.post(`/api/v1/gates/${gate_id}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};

export const unlikeGate = async (gate_id, token) => {
  try {
    const response = await api.post(`/api/v1/gates/${gate_id}/unlike`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data?.content || null;
  } catch (err) {
    handleApiError(err);
    throw err;
  }
};



// // Boards
// export const fetchBoards = async (token) => {
//   try {
//     const response = await api.get(`/api/v1/boards`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content?.boards || [];
//   } catch (err) {
//     handleApiError(err);
//     return [];
//   }
// };


// export const fetchBoardById = async (board_id, token) => {
//   try {
//     const response = await api.get(`/api/v1/boards/${board_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     return null;
//   }
// };

// export const fetchBoardsByClass = async (class_id, token) => {
//   try {
//     const response = await api.get(`/api/v1/boards/${class_id}/`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content?.boards || [];
//   } catch (err) {
//     handleApiError(err);
//     return [];
//   }
// };

// export const fetchBoardsByGate = async (gate_id, token) => {
//   console.log('Fetching boards for gate_id:', gate_id);
//   if (!gate_id) {
//     const error = new Error('gate_id is undefined or invalid');
//     console.error(error);
//     handleApiError(error);
//     return [];
//   }
//   try {
//     const response = await api.get(`/api/v1/boards/${gate_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     console.log('Boards response:', response.data);
//     return response.data?.content?.boards || [];
//   } catch (err) {
//     console.error('Error fetching boards by gate:', err);
//     handleApiError(err);
//     return [];
//   }
// };

// export const fetchBoardByIdClass = async (board_id, class_id, token) => {
//   try {
//     const response = await api.get(`/api/v1/boards/${class_id}/${board_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     return null;
//   }
// };

// export const fetchBoardByIdGate = async (board_id, gate_id, token) => {
//   try {
//     const response = await api.get(`/api/v1/boards/${gate_id}/${board_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     return null;
//   }
// };

// export const createBoard = async (boardData, token) => {
//   try {
//     const response = await api.post(`/api/v1/boards`, boardData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const createBoardInGate = async (gate_id, boardData, token) => {
//   try {
//     const response = await api.post(`/api/v1/boards/${gate_id}`, boardData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const createBoardInClass = async (class_id, boardData, token) => {
//   try {
//     const response = await api.post(`/api/v1/boards/${class_id}`, boardData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const updateBoardGate = async (gate_id, board_id, boardData, token) => {
//   try {
//     const response = await api.put(`/api/v1/boards/${gate_id}/${board_id}`, boardData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const updateBoardClass = async (class_id, board_id, boardData, token) => {
//   try {
//     const response = await api.put(`/api/v1/boards/${class_id}/${board_id}`, boardData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const updateBoardStatusGate = async (gate_id, board_id, statusData, token) => {
//   try {
//     const response = await api.put(`/api/v1/boards/${gate_id}/${board_id}/status`, statusData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const updateBoardStatusClass = async (class_id, board_id, statusData, token) => {
//   try {
//     const response = await api.put(`/api/v1/boards/${class_id}/${board_id}/status`, statusData, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const deleteBoardGate = async (gate_id, board_id, token) => {
//   try {
//     const response = await api.delete(`/api/v1/boards/${gate_id}/${board_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const deleteBoardClass = async (class_id, board_id, token) => {
//   try {
//     const response = await api.delete(`/api/v1/boards/${class_id}/${board_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const likeBoard = async (board_id, token) => {
//   try {
//     const response = await api.post(`/api/v1/boards/${board_id}/like`, {}, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const unlikeBoard = async (board_id, token) => {
//   try {
//     const response = await api.post(`/api/v1/boards/${board_id}/unlike`, {}, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     throw err;
//   }
// };

// export const fetchBoardMembers = async (board_id, token) => {
//   try {
//     const response = await api.get(`/api/v1/boards/${board_id}/members`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content?.members || [];
//   } catch (err) {
//     handleApiError(err);
//     return [];
//   }
// };

// export const fetchBoardClasses = async (gate_id, class_id, token) => {
//   try {
//     const response = await api.get(`/api/v1/classes/${gate_id}/${class_id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data?.content || null;
//   } catch (err) {
//     handleApiError(err);
//     return null;
//   }
// };

// Normalize user data
// export const normalizeUserData = (user) => ({
//   anonymous_id: user?.anonymous_id || "",
//   username: user?.username || "",
//   fullName: user?.fullName || "",
//   bio: user?.bio || "",
//   email: user?.email || "",
//   phone: user?.phone || "",
//   wallet_address: user?.wallet_address || "",
//   profile_picture: user?.profile_picture || "",
//   isPublic: user?.isPublic || false,
//   social_links: user?.social_links || {},
//   timezone: user?.timezone || "",
//   gender: user?.gender || "",
//   location: user?.location || "",
//   ethnicity: user?.ethnicity || "",
//   dateOfBirth: user?.dateOfBirth || null,
//   nameVisibility: user?.nameVisibility || "Hide",
//   preferences: user?.preferences || {
//     notifications: { email: true, push: false },
//     theme: "Light",
//     contentLanguage: "English",
//   },
//   onlineStatus: user?.onlineStatus || "offline",
//   language: user?.language || "",
//   access_level: user?.access_level || 0,
// });

export default api;