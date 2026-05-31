// src/services/aiService.js
import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

/* ============================= */
/* 🔒 SAFE JSON PARSER */
/* ============================= */
const extractJSON = (text) => {
  try {
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    const jsonString = match ? match[0] : text;
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("❌ JSON parse error:", text);
    return null;
  }
};

/* ============================= */
/* 🔢 CALORIE CALCULATION */
/* ============================= */
const calculateCalories = (profile) => {
  const weight = parseFloat(profile.weight);
  const height = parseFloat(profile.height) || 175;
  const age = parseFloat(profile.age);
  const isMale = profile.gender !== "female";

  const bmr = isMale
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = bmr * 1.55; // Середня активність

  if (profile.goal === "weight_loss") return Math.round(tdee - 400);
  if (profile.goal === "muscle") return Math.round(tdee + 400);
  return Math.round(tdee);
};

/* ============================= */
/* 🚀 GENERATE PROFESSIONAL PLAN */
/* ============================= */
export const generatePlan = async (
  userProfile,
  lastWorkoutsHistory = [],
  weekData = {},
  weeklyReport = null
) => {
  const currentWeek = weekData?.weekNumber || 1;
  const sessionNum = weeklyReport ? 1 : (weekData?.sessionsDone || 0) + 1;

  const caloriesTarget = calculateCalories(userProfile);

  /* 👇 ЛОГІКА: ІДЕАЛЬНИЙ ТРЕНУВАЛЬНИЙ СПЛІТ */
  const getSplitFocus = (session) => {
    if (session === 1) return "Тягові м'язи (Спина, Біцепс, Задня дельта) + Кор";
    if (session === 2) return "Жимові м'язи (Груди, Передні та Середні дельти, Трицепс)";
    if (session === 3) return "Низ тіла (Квадріцепси, Біцепс стегна, Сідниці, Ікри)";
    if (session === 4) return "Фулбаді (Усе тіло - кругове тренування)";
    return "Фокус на відстаючі м'язи або активне відновлення";
  };
  
  const todayTargetMuscles = getSplitFocus(sessionNum);

  /* 🧠 Уникнення повторів (останні 20 вправ) */
  const previousExercises = lastWorkoutsHistory
    ?.flatMap(w => w.exercises?.map(e => e.name) || [])
    ?.slice(-20)
    ?.join(", ") || "немає";

  const lastWorkoutExercises = lastWorkoutsHistory[0]?.exercises?.map(e => e.name)?.join(", ") || "немає";

  /* 📍 Локація та інвентар */
  const locationStrict = userProfile.location === "home"
      ? "ВДОМА (без професійних тренажерів)"
      : "В ТРЕНАЖЕРНОМУ ЗАЛІ (доступні всі тренажери)";

  const equipmentStrict = userProfile.hasEquipment
    ? `Доступний інвентар: ${userProfile.equipmentList}.`
    : "Інвентар відсутній. Використовувати ТІЛЬКИ власну вагу.";

  /* 🥗 Дієта */
  let dietRestrictions = "";
  if (userProfile.dietType === "vegan") {
    dietRestrictions += "Клієнт ВЕГАН. Суворо заборонено: м'ясо, риба, птиця, яйця, молочні продукти, мед. ";
  }
  if (userProfile.foodExclusions?.trim()) {
    dietRestrictions += `Алергії/Не любить: ${userProfile.foodExclusions}.`;
  }
  const dietText = dietRestrictions || "Дієтичних обмежень немає (всеїдний).";

  /* 🔄 Адаптація на основі звіту */
  let adaptationNote = "";
  if (weeklyReport) {
    const weightInfo = weeklyReport.weight ? `- Актуальна вага: ${weeklyReport.weight} кг` : "";
    const measurementsInfo = weeklyReport.measurements && weeklyReport.measurements !== "Не вказано" 
      ? `- Заміри тіла: ${weeklyReport.measurements}` 
      : "- Заміри тіла: не вказано цього тижня";

    adaptationNote = `
    🛑 АНАЛІЗ ЗВІТУ КЛІЄНТА ЗА МИНУЛИЙ ТИЖДЕНЬ:
    - Відгук: "${weeklyReport.feedback}"
    - Оцінки тренувань: ${JSON.stringify(weeklyReport.recentRatings)}
    ${weightInfo}
    ${measurementsInfo}
    👉 ЗАВДАННЯ ДЛЯ АДАПТАЦІЇ: 
    1. Якщо оцінки "hard" (важко) або є скарги у відгуку — зменш обсяг/інтенсивність на 10-20%. Якщо "easy" (легко) — додай складності (повторення/підходи).
    2. Якщо клієнт надав вагу або заміри, обов'язково прокоментуй їх у полі "progression_note" (наприклад, підтримай, похвали за поточні результати або дай пораду щодо подальшої трансформації об'ємів).
    `;
  }

  /* ============================= */
  /* 🧠 SYSTEM PROMPT */
  /* ============================= */

  const SYSTEM_PROMPT = `
Ти — персональний тренер преміум-рівня з досвідом 10+ років та спортивний дієтолог.
Твоє завдання — створити ідеальне тренування та підібрати страву.

ПРОФІЛЬ КЛІЄНТА:
- Вік: ${userProfile.age}, Початкова вага: ${userProfile.weight}кг, Стать: ${userProfile.gender === 'male' ? 'Чоловік' : 'Жінка'}
- Головна ціль: ${userProfile.goal === 'muscle' ? 'Набір м\'язової маси' : 'Схуднення та рельєф'}
- Травми/Обмеження: ${userProfile.injuries || "Немає"}

УМОВИ СЬОГОДНІ:
- Тиждень програми: ${currentWeek} (з 8-тижневого циклу)
- Тренування №: ${sessionNum}
- ФОКУС СЬОГОДНІ (СПЛІТ): ${todayTargetMuscles}
- Локація: ${locationStrict}
- ${equipmentStrict}
- Цільові калорії: ~${caloriesTarget} ккал/день

ПРАВИЛА ТРЕНУВАННЯ:
1. Строго 5-7 вправ. УСІ ВПРАВИ МАЮТЬ БУТИ ТІЛЬКИ НА ЦІЛЬОВІ М'ЯЗИ СЬОГОДНІ (${todayTargetMuscles}).
2. НЕ ДАВАЙ вправи, які клієнт робив на МИНУЛОМУ тренуванні (${lastWorkoutExercises}).
3. Уникай частих повторів цих вправ: ${previousExercises}
4. ${adaptationNote}
5. Періодизація: 1-3 тиждень (обсяг), 4 (deload), 5-7 (інтенсивність), 8 (пік). Враховуй це для кількості підходів/повторень.

ПРАВИЛА ХАРЧУВАННЯ:
- Пропонуй КРЕАТИВНІ, дуже смачні та різноманітні страви після тренування. Ніякої нудної "курки з рисом", якщо клієнт не просив. 
- Суворо дотримуйся дієтичних обмежень клієнта!
- Дієта: ${dietText}

Поверни ТІЛЬКИ JSON. СТРУКТУРА:
{
  "workout": {
    "title": "Професійна, лаконічна назва без пафосу (напр. 'День 1: Верхня частина тіла', 'Силове: Ноги та Кор').",
    "difficulty": "Початковий / Середній / Просунутий",
    "duration": "45-60 хв",
    "location_note": "Вдома або Зал",
    "warmup": "Детальна розминка (3-4 речення). Опиши рухи.",
    "exercises": [
      {
        "name": "Назва вправи",
        "sets": "Точна цифра (напр. '3' або '4'). Збільшуй, якщо це 2 або 3 тиждень!",
        "reps": "Точна цифра (напр. '10' або '12'). Додавай повторення, якщо минулого тижня було легко.",
        "tips": "Як дихати, куди дивитись (2 речення).",
        "youtube_search": "Точна назва українською для YouTube"
      }
    ],
    "cooldown": "Детальна заминка/розтяжка (2-3 речення).",
    "progression_note": "Твоя пряма мова до клієнта. Порада щодо прогресії ваг + ОБОВ'ЯЗКОВО проаналізуй або похвали клієнта за його заміри та поточну вагу (якщо вони були у звіті)!"
  },
  "nutrition": {
    "meal_example": "Детальний рецепт/страва (з грамами). Обов'язково за правилами дієти клієнта!",
    "advice": "1 речення про гідратацію або таймінг їжі."
  }
}
`;

  console.log("\n====== ЩО МИ ВІДПРАВЛЯЄМО ШІ ======");
  console.log(SYSTEM_PROMPT);
  console.log("=====================================\n");

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }],
        temperature: 0.7, 
        response_format: { type: "json_object" }
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}` }
      }
    );

    const aiData = extractJSON(response.data?.choices?.[0]?.message?.content);

    if (!aiData?.workout?.exercises) {
      throw new Error("Invalid AI response");
    }

    return aiData;

  } catch (error) {
    console.error("❌ Generation error:", error);
    throw error;
  }
};

/* ============================= */
/* 🍎 FOOD ANALYSIS */
/* ============================= */
export const analyzeFood = async (foodText) => {
  const SYSTEM_PROMPT = `
Ти спортивний дієтолог.
Поверни лише JSON:
{"calories": number, "protein": number, "fats": number, "carbs": number, "name": "Назва українською"}

Якщо введено "нічого" або "вода" → всі значення = 0.
`;

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Що я з'їв: "${foodText}"` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );

    return extractJSON(response.data?.choices?.[0]?.message?.content);
  } catch (error) {
    console.error("❌ Food analysis error:", error);
    return null;
  }
};