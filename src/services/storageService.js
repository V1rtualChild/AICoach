// src/services/storageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ============================= */
/* 👤 USER PROFILE               */
/* ============================= */

export const getUserProfile = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('user_profile');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Помилка отримання профілю:", e);
    return null;
  }
};

export const saveUserProfile = async (profile) => {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem('user_profile', jsonValue);
  } catch (e) {
    console.error("Помилка збереження профілю:", e);
  }
};

/* ============================= */
/* 📏 MEASUREMENTS & PROGRESS    */
/* ============================= */

/**
 * Отримання останніх збережених замірів (зі звіту або аналітики)
 */
export const getLatestMeasurement = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('user_measurements');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error("Помилка отримання замірів:", e);
    return null;
  }
};

/**
 * Збереження замірів тіла
 */
export const saveMeasurement = async (data) => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem('user_measurements', jsonValue);
  } catch (e) {
    console.error("Помилка збереження замірів:", e);
  }
};

/* ============================= */
/* 🏋️‍♂️ WORKOUT HISTORY            */
/* ============================= */

export const getHistory = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('workout_history');
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Помилка отримання історії:", e);
    return [];
  }
};

export const saveToHistory = async (workoutResult) => {
  try {
    const history = await getHistory();
    // Додаємо дату, якщо вона не прийшла з екрана
    const entry = { 
        ...workoutResult, 
        date: workoutResult.date || new Date().toISOString() 
    };
    const updatedHistory = [entry, ...history];
    await AsyncStorage.setItem('workout_history', JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Помилка збереження в історію:", e);
  }
};

/* ============================= */
/* 🍏 NUTRITION                  */
/* ============================= */

export const getDailyNutrition = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const jsonValue = await AsyncStorage.getItem(`nutrition_${today}`);
    return jsonValue != null ? JSON.parse(jsonValue) : { calories: 0, protein: 0, fats: 0, carbs: 0, history: [] };
  } catch (e) {
    return { calories: 0, protein: 0, fats: 0, carbs: 0, history: [] };
  }
};

export const addFoodLog = async (foodData) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const current = await getDailyNutrition();
    const updated = {
      calories: current.calories + (foodData.calories || 0),
      protein: current.protein + (foodData.protein || 0),
      fats: current.fats + (foodData.fats || 0),
      carbs: current.carbs + (foodData.carbs || 0),
      history: [foodData, ...current.history]
    };
    await AsyncStorage.setItem(`nutrition_${today}`, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Помилка додавання їжі:", e);
  }
};

/* ============================= */
/* 📅 WEEKLY PROGRESS            */
/* ============================= */

export const getWeeklyProgress = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('weekly_progress');
    return jsonValue != null ? JSON.parse(jsonValue) : { weekNumber: 1, sessionsDone: 0, sessionsTarget: 3 };
  } catch (e) {
    return { weekNumber: 1, sessionsDone: 0, sessionsTarget: 3 };
  }
};

export const incrementWeeklyProgress = async () => {
  try {
    const current = await getWeeklyProgress();
    const updated = { ...current, sessionsDone: current.sessionsDone + 1 };
    await AsyncStorage.setItem('weekly_progress', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Помилка оновлення прогресу тижня:", e);
  }
};

export const startNewWeek = async () => {
  try {
    const current = await getWeeklyProgress();
    const updated = { weekNumber: current.weekNumber + 1, sessionsDone: 0, sessionsTarget: 3 };
    await AsyncStorage.setItem('weekly_progress', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Помилка старту нового тижня:", e);
  }
};

/* ============================= */
/* ⚡ ACTIVE WORKOUT (DRAFT)     */
/* ============================= */

export const getActiveWorkout = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('active_workout_plan');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    return null;
  }
};

export const saveActiveWorkout = async (plan) => {
  try {
    await AsyncStorage.setItem('active_workout_plan', JSON.stringify(plan));
  } catch (e) {
    console.error("Помилка збереження активного плану:", e);
  }
};

export const clearActiveWorkout = async () => {
  try {
    await AsyncStorage.removeItem('active_workout_plan');
  } catch (e) {
    console.error("Помилка видалення активного плану:", e);
  }
};

/* ============================= */
/* 🔴 SYSTEM                     */
/* ============================= */

export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error("Помилка повної очистки:", e);
  }
};