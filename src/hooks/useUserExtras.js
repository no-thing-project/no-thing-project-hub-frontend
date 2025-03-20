// src/hooks/useUserExtras.js
import { useMemo } from "react";

const predictions = [
  "A pleasant surprise is waiting for you",
  "Your creativity will lead you to success",
  "Expect positive changes soon",
  "You will conquer new challenges today",
  "Good fortune will follow you",
];

function generateRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export const useUserExtras = (token) => {
  const randomPrediction = useMemo(() => {
    if (!token) {
      return "Welcome to GATE";
    }
    const predictionKey = `prediction_${token}`;
    let savedPrediction = localStorage.getItem(predictionKey);
    if (!savedPrediction) {
      savedPrediction = predictions[Math.floor(Math.random() * predictions.length)];
      localStorage.setItem(predictionKey, savedPrediction);
    }
    return savedPrediction;
  }, [token]);

  const sessionAvatarBg = useMemo(() => {
    if (!token) {
      return "#888888";
    }
    const colorKey = `avatarBgColor_${token}`;
    let savedColor = localStorage.getItem(colorKey);
    if (!savedColor) {
      savedColor = generateRandomColor();
      localStorage.setItem(colorKey, savedColor);
    }
    return savedColor;
  }, [token]);

  return { randomPrediction, sessionAvatarBg };
};