export const normalizeUserData = (currentUser) => ({
    username: currentUser.username || "-",
    anonName: currentUser.anonName || "-",
    email: currentUser.email || "-",
    location: currentUser.location || "-",
    timezone: currentUser.timezone || "-",
    gender: currentUser.gender || "-",
    birthday: currentUser.dateOfBirth || "-",
    bio: currentUser.bio || "",
    language: currentUser.language || "-",
    socialPresence: currentUser.socialPresence || "-",
    onlineStatus: currentUser.onlineStatus || "-",
    isPublic: currentUser.isPublic || false,
    theme: currentUser.theme || "-",
    contentLanguage: currentUser.contentLanguage || "-",
    notifications: {
      email: currentUser.preferences?.notifications?.email ?? true,
      push: currentUser.preferences?.notifications?.push ?? false,
    },
    access_level: currentUser.access_level || "-",
  });
  
  export const handleApiError = (err, setError) => {
    setError(err.response?.data?.errors?.[0] || "Failed to update profile");
  };