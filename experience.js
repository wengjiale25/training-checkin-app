const STORE_KEY = "training-checkin-v1";
const TIMER_KEY = "training-checkin-timer-v1";
const TRAINING_CYCLE = window.TRAINING_CYCLE || [];
const WEEKEND_PLANS = window.WEEKEND_PLANS || {};
const CYCLE_CONFIG = window.CYCLE_CONFIG || { anchorDate: "2026-08-17", anchorIndex: 0 };
const EXERCISE_GUIDES = window.EXERCISE_GUIDES || {};
const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const COMPOUND_EXERCISES = new Set([
  "leg-press",
  "hack-squat",
  "hip-thrust",
  "chest-press",
  "incline-press",
  "assisted-dip",
  "shoulder-press",
  "reverse-grip-pulldown",
  "neutral-pulldown",
  "narrow-neutral-row",
  "upper-back-row",
]);

const appState = {
  store: loadJson(STORE_KEY, { records: {} }),
  activeView: "today",
  selectedDate: startOfDay(new Date()),
  focusedExerciseId: "",
  lastChangedSet: "",
  openDailyNote: false,
  timer: loadJson(TIMER_KEY, null),
  timerTicker: null,
  timerAutoClose: null,
  sessionTicker: null,
  toastTimer: null,
  undoAction: null,
  deferredPrompt: null,
  guideExerciseId: "",
  guideTab: "motion",
  weightFilter: "all",
  extraType: "strength",
  extraWeightUnit: "lb",
};

const elements = {
  weekLabel: document.querySelector("#weekLabel"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  dayTitle: document.querySelector("#dayTitle"),
  progressPercent: document.querySelector("#progressPercent"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  progressPanel: document.querySelector("#progressPanel"),
  dayStrip: document.querySelector("#dayStrip"),
  planMeta: document.querySelector("#planMeta"),
  exerciseList: document.querySelector("#exerciseList"),
  conditioningArea: document.querySelector("#conditioningArea"),
  completionCard: document.querySelector("#completionCard"),
  journalArea: document.querySelector("#journalArea"),
  weekPlanList: document.querySelector("#weekPlanList"),
  historySummary: document.querySelector("#historySummary"),
  historyList: document.querySelector("#historyList"),
  weightsView: document.querySelector("#weightsView"),
  weightFilters: document.querySelector("#weightFilters"),
  weightsList: document.querySelector("#weightsList"),
  weightsStatus: document.querySelector("#weightsStatus"),
  todayView: document.querySelector("#todayView"),
  weekView: document.querySelector("#weekView"),
  historyView: document.querySelector("#historyView"),
  installBtn: document.querySelector("#installBtn"),
  restTimer: document.querySelector("#restTimer"),
  recordSheet: document.querySelector("#recordSheet"),
  recordSheetContent: document.querySelector("#recordSheetContent"),
  guideSheet: document.querySelector("#guideSheet"),
  guideSheetContent: document.querySelector("#guideSheetContent"),
  toast: document.querySelector("#toast"),
};

function ensureStoreShape() {
  if (!appState.store || typeof appState.store !== "object") appState.store = {};
  if (!appState.store.records) appState.store.records = {};
  if (!appState.store.exerciseDefaults) appState.store.exerciseDefaults = {};
}

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStore() {
  ensureStoreShape();
  localStorage.setItem(STORE_KEY, JSON.stringify(appState.store));
}

function saveTimer() {
  if (appState.timer) {
    localStorage.setItem(TIMER_KEY, JSON.stringify(appState.timer));
  } else {
    localStorage.removeItem(TIMER_KEY);
  }
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date) {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return startOfDay(copy);
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatFullDate(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function modulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function trainingDayOffset(date) {
  const anchor = parseDateKey(CYCLE_CONFIG.anchorDate);
  const target = startOfDay(date);
  let offset = 0;

  if (target >= anchor) {
    for (let cursor = anchor; cursor < target; cursor = addDays(cursor, 1)) {
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) offset += 1;
    }
    return offset;
  }

  for (let cursor = addDays(anchor, -1); cursor >= target; cursor = addDays(cursor, -1)) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) offset -= 1;
  }
  return offset;
}

function scheduledPlanForDate(date) {
  const weekday = date.getDay();
  const basePlan =
    weekday === 0
      ? WEEKEND_PLANS.sunday
      : weekday === 6
        ? WEEKEND_PLANS.saturday
        : TRAINING_CYCLE[
            modulo(trainingDayOffset(date) + Number(CYCLE_CONFIG.anchorIndex || 0), TRAINING_CYCLE.length)
          ];

  return {
    ...basePlan,
    day: WEEKDAY_NAMES[weekday],
  };
}

function allSessionPlans() {
  return [...TRAINING_CYCLE, WEEKEND_PLANS.saturday, WEEKEND_PLANS.sunday].filter(Boolean);
}

function planById(id) {
  return allSessionPlans().find((plan) => plan.id === id);
}

function planForDate(date) {
  const record = appState.store.records?.[dateKey(date)];
  const basePlan = record?.planSnapshot
    ? record.planSnapshot
    : record?.planOverrideId && planById(record.planOverrideId)
      ? { ...planById(record.planOverrideId), day: WEEKDAY_NAMES[date.getDay()] }
      : scheduledPlanForDate(date);
  const extras = Array.isArray(record?.extraExercises) ? record.extraExercises : [];
  if (!extras.length) return basePlan;
  return { ...basePlan, exercises: [...basePlan.exercises, ...extras] };
}

function selectedPlan() {
  return planForDate(appState.selectedDate);
}

function exerciseDefault(exerciseId) {
  ensureStoreShape();
  return appState.store.exerciseDefaults[exerciseId] || { quickWeight: "", quickReps: "" };
}

function saveExerciseDefault(exerciseId, field, value) {
  ensureStoreShape();
  if (!appState.store.exerciseDefaults[exerciseId]) {
    appState.store.exerciseDefaults[exerciseId] = { quickWeight: "", quickReps: "" };
  }
  appState.store.exerciseDefaults[exerciseId][field] = String(value ?? "");
  saveStore();
}

function updateExerciseValue(exerciseId, field, value) {
  saveExerciseDefault(exerciseId, field, value);
  const record = ensureRecord(dateKey(appState.selectedDate));
  if (record.exercises[exerciseId]) {
    record.exercises[exerciseId][field] = String(value ?? "");
    touchRecord(record);
  }
}

function displayedValues(exerciseId, item = {}) {
  const defaults = exerciseDefault(exerciseId);
  const hasPerformance = item.sets?.some((set) => set.done || set.weight || set.reps) || item.note?.trim();
  return {
    quickWeight: hasPerformance
      ? item.quickWeight || defaults.quickWeight || ""
      : defaults.quickWeight || item.quickWeight || "",
    quickReps: hasPerformance
      ? item.quickReps || defaults.quickReps || ""
      : defaults.quickReps || item.quickReps || "",
  };
}

function findPreviousValues(exerciseId, beforeKey) {
  const defaults = exerciseDefault(exerciseId);
  if (defaults.quickWeight || defaults.quickReps) return { ...defaults };
  const previous = Object.values(appState.store.records || {})
    .filter((record) => record.date < beforeKey && record.exercises?.[exerciseId])
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((record) => record.exercises[exerciseId])
    .find((item) => item.quickWeight || item.quickReps || item.sets?.some((set) => set.weight || set.reps));

  if (!previous) return { quickWeight: "", quickReps: "" };

  const setWeights = previous.sets?.map((set) => set.weight).filter(Boolean) || [];
  const setReps = previous.sets?.map((set) => set.reps).filter(Boolean) || [];
  return {
    quickWeight: previous.quickWeight || setWeights[0] || "",
    quickReps: previous.quickReps || (setReps.length > 1 ? setReps.join("/") : setReps[0] || ""),
  };
}

function ensureRecord(key, plan = planForDate(parseDateKey(key))) {
  ensureStoreShape();
  if (!appState.store.records[key]) {
    appState.store.records[key] = {
      date: key,
      updatedAt: "",
      startedAt: "",
      completedAt: "",
      exercises: {},
      dailyNote: "",
      planId: plan.id,
      extraExercises: [],
      session: { status: "idle", elapsedMs: 0, resumedAt: 0, endedAt: 0 },
    };
  }

  const record = appState.store.records[key];
  if (!record.planId && !record.planSnapshot) record.planId = plan.id;
  if (!Array.isArray(record.extraExercises)) record.extraExercises = [];
  if (!record.session) record.session = { status: "idle", elapsedMs: 0, resumedAt: 0, endedAt: 0 };
  if (!record.exercises) record.exercises = {};
  plan.exercises.forEach((exercise) => {
    if (!record.exercises[exercise.id]) {
      record.exercises[exercise.id] = {
        sets: [],
        feel: "",
        note: "",
        quickWeight: "",
        quickReps: "",
        defaultsApplied: false,
        skipped: false,
        skipReason: "",
        recordedAt: "",
      };
    }

    const item = record.exercises[exercise.id];
    if (!Array.isArray(item.sets)) item.sets = [];
    for (let index = 0; index < exercise.sets; index += 1) {
      if (!item.sets[index]) item.sets[index] = { done: false, weight: "", reps: "" };
    }
    item.sets = item.sets.slice(0, exercise.sets);
    if (item.quickWeight === undefined) {
      item.quickWeight = item.sets.find((set) => set.weight)?.weight || "";
    }
    if (item.quickReps === undefined) {
      const reps = item.sets.map((set) => set.reps).filter(Boolean);
      item.quickReps = reps.length > 1 ? reps.join("/") : reps[0] || "";
    }
    if (!item.defaultsApplied) {
      const previous = findPreviousValues(exercise.id, key);
      if (!item.quickWeight) item.quickWeight = previous.quickWeight;
      if (!item.quickReps) item.quickReps = previous.quickReps;
      if (item.quickWeight) saveExerciseDefault(exercise.id, "quickWeight", item.quickWeight);
      if (item.quickReps) saveExerciseDefault(exercise.id, "quickReps", item.quickReps);
      item.defaultsApplied = true;
    }
  });

  return record;
}

function touchRecord(record) {
  record.updatedAt = new Date().toISOString();
  saveStore();
}

function getExerciseProgress(exercise, record) {
  const item = record.exercises[exercise.id];
  if (item?.skipped) {
    return { complete: 0, total: 0, isComplete: true, isSkipped: true };
  }
  const complete = (item?.sets || []).filter((set) => set.done).length;
  return {
    complete,
    total: exercise.sets,
    isComplete: complete === exercise.sets,
    isSkipped: false,
  };
}

function getProgress(plan, record) {
  const allRequired = plan.exercises.filter((exercise) => !exercise.optional);
  const requiredExercises = allRequired.filter((exercise) => !record.exercises[exercise.id]?.skipped);
  const total = requiredExercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const complete = requiredExercises.reduce(
    (sum, exercise) => sum + getExerciseProgress(exercise, record).complete,
    0,
  );
  return {
    total,
    complete,
    percent: total ? Math.round((complete / total) * 100) : allRequired.length ? 100 : 0,
  };
}

function hasRecordContent(record) {
  if (record.dailyNote?.trim()) return true;
  return Object.values(record.exercises || {}).some((item) => {
    if (item.note?.trim() || item.skipped || item.recordedAt) return true;
    return item.sets?.some((set) => set.done || set.weight || set.reps);
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function typeLabel(type) {
  return (
    {
      strength: "力量",
      core: "核心",
      cardio: "有氧",
      recovery: "恢复",
      technique: "动作练习",
    }[type] || "训练"
  );
}

function metricLabels(exercise) {
  if (exercise.type === "cardio") return ["时长或距离", "实际强度"];
  if (exercise.id.includes("plank")) return ["负重", "完成秒数"];
  if (exercise.type === "recovery") return ["完成时长", "实际感受"];
  if (exercise.type === "core") return ["负重", "实际次数"];
  const unit = exercise.weightUnit === "kg" ? "kg" : "磅";
  return [exercise.id === "assisted-dip" ? `辅助重量 ${unit}` : `重量 ${unit}`, "实际次数"];
}

function exerciseWeightUnit(exercise) {
  if (exercise.type !== "strength") return "";
  return exercise.weightUnit === "kg" ? "kg" : "磅";
}

function isConditioningExercise(exercise) {
  return exercise.type === "cardio";
}

function resolveFocusedExercise(plan, record) {
  const requested = plan.exercises.find((exercise) => exercise.id === appState.focusedExerciseId);
  if (requested) return requested.id;

  const firstIncomplete = plan.exercises.find(
    (exercise) =>
      !exercise.optional &&
      !isConditioningExercise(exercise) &&
      !record.exercises[exercise.id]?.skipped &&
      !getExerciseProgress(exercise, record).isComplete,
  );
  appState.focusedExerciseId = firstIncomplete?.id || "";
  return appState.focusedExerciseId;
}

function render() {
  const key = dateKey(appState.selectedDate);
  const plan = selectedPlan();
  const record = ensureRecord(key, plan);
  const progress = getProgress(plan, record);
  const weekStart = startOfWeek(appState.selectedDate);
  const weekEnd = addDays(weekStart, 6);
  const todayKey = dateKey(new Date());

  resolveFocusedExercise(plan, record);
  elements.weekLabel.textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  elements.selectedDateLabel.textContent =
    key === todayKey ? `今天 · ${formatFullDate(appState.selectedDate)}` : formatFullDate(appState.selectedDate);
  elements.dayTitle.textContent = `${plan.day} · ${plan.title}`;
  elements.progressPercent.textContent = `${progress.percent}%`;
  elements.progressText.textContent = `${progress.complete} / ${progress.total}组`;
  elements.progressFill.style.width = `${progress.percent}%`;
  elements.progressPanel.classList.toggle("finished", progress.percent === 100);

  renderDayStrip();
  renderViews(plan, record, progress);
  updateNav();
  renderTimer();
  updateSessionTicker();
}

function renderDayStrip() {
  const weekStart = startOfWeek(appState.selectedDate);
  const selectedKey = dateKey(appState.selectedDate);
  const todayKey = dateKey(new Date());

  elements.dayStrip.innerHTML = Array.from({ length: 7 }, (_, index) => {
    const dayDate = addDays(weekStart, index);
    const plan = planForDate(dayDate);
    const key = dateKey(dayDate);
    const dayRecord = ensureRecord(key, plan);
    const progress = getProgress(plan, dayRecord);
    return `
      <button
        class="day-button${key === selectedKey ? " active" : ""}${key === todayKey ? " today" : ""}"
        type="button"
        data-action="select-date"
        data-date="${key}"
        aria-label="${plan.day}${dayDate.getDate()}日，完成${progress.percent}%"
      >
        <span>${plan.day.replace("周", "")}</span>
        <strong>${dayDate.getDate()}</strong>
        <i class="${progress.percent === 100 ? "done" : ""}" aria-hidden="true"></i>
      </button>
    `;
  }).join("");
}

function renderViews(plan, record, progress) {
  const showToday = appState.activeView === "today";
  const showWeek = appState.activeView === "week";
  const showHistory = appState.activeView === "history";
  const showWeights = appState.activeView === "weights";

  elements.todayView.hidden = !showToday;
  elements.weekView.hidden = !showWeek;
  elements.historyView.hidden = !showHistory;
  elements.weightsView.hidden = !showWeights;
  elements.progressPanel.hidden = !showToday;
  document.querySelector(".week-control").hidden = showHistory || showWeights;

  if (showToday) {
    renderPlanMeta(plan, record);
    renderExercises(plan, record);
    renderCompletion(plan, record, progress);
    renderJournal(record, progress);
  }
  if (showWeek) renderWeekPlan();
  if (showHistory) renderHistory();
  if (showWeights) renderWeights();
}

function renderPlanMeta(plan, record) {
  const session = record.session || { status: "idle", elapsedMs: 0 };
  const running = session.status === "running";
  const finished = session.status === "finished";
  elements.planMeta.innerHTML = `
    <div class="session-console">
      <div class="session-clock">
        <span>${finished ? "本次用时" : running ? "训练进行中" : session.status === "paused" ? "训练已暂停" : "本次训练"}</span>
        <strong id="sessionElapsed">${formatElapsed(sessionElapsedMs(session))}</strong>
      </div>
      <div class="session-actions">
        ${
          finished
            ? '<button type="button" data-action="session-reset">重新计时</button>'
            : running
              ? '<button type="button" data-action="session-pause">暂停</button><button class="finish" type="button" data-action="session-finish">结束</button>'
              : `<button class="primary" type="button" data-action="session-start">${session.status === "paused" ? "继续" : "开始计时"}</button>${session.status === "paused" ? '<button class="finish" type="button" data-action="session-finish">结束</button>' : ""}`
        }
      </div>
    </div>
    <div class="plan-tools">
      <div class="focus-copy">
        <span class="focus-dot" aria-hidden="true"></span>
        <p>${escapeHtml(plan.focus)}</p>
      </div>
      <button class="add-training-button" type="button" data-action="open-add-exercise" data-extra-type="strength">＋ 加练</button>
    </div>
  `;
}

function renderExercises(plan, record) {
  const exercises = plan.exercises.filter((exercise) => !isConditioningExercise(exercise));
  elements.exerciseList.innerHTML = exercises
    .map((exercise, index) => renderExerciseCard(exercise, record, index, exercises.length))
    .join("");
  renderConditioning(plan, record);
}

function exerciseRecordSummary(exercise, item) {
  const values = displayedValues(exercise.id, item);
  if (exercise.type === "strength") {
    return [
      values.quickWeight && `${values.quickWeight}${exerciseWeightUnit(exercise)}`,
      values.quickReps && `${values.quickReps}次`,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return [values.quickWeight, values.quickReps].filter(Boolean).join(" · ");
}

function renderConditioning(plan, record) {
  const exercises = plan.exercises.filter(isConditioningExercise);
  if (!exercises.length) {
    elements.conditioningArea.innerHTML = `
      <button class="conditioning-add" type="button" data-action="open-add-exercise" data-extra-type="cardio">＋ 记录额外有氧</button>
    `;
    return;
  }

  elements.conditioningArea.innerHTML = `
    <section class="conditioning-panel">
      <header>
        <div><span>收尾项目</span><strong>有氧与游泳</strong></div>
        <button type="button" data-action="open-add-exercise" data-extra-type="cardio">＋ 添加</button>
      </header>
      <div class="conditioning-list">
        ${exercises
          .map((exercise) => {
            const item = record.exercises[exercise.id];
            const progress = getExerciseProgress(exercise, record);
            return `
              <div class="conditioning-row${progress.isComplete ? " done" : ""}${exercise.optional ? " optional" : ""}">
                <button type="button" data-action="toggle-set" data-exercise="${exercise.id}" data-set="0" aria-pressed="${progress.isComplete}">
                  <span class="conditioning-check">${progress.isComplete ? "✓" : ""}</span>
                  <span><strong>${escapeHtml(exercise.name)}</strong><small>${escapeHtml(exercise.target)}${exercise.optional ? " · 可选" : ""}</small></span>
                </button>
                ${exercise.extra ? `<button class="conditioning-remove" type="button" data-action="remove-extra" data-exercise="${exercise.id}" aria-label="删除${escapeHtml(exercise.name)}">×</button>` : ""}
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderExerciseCard(exercise, record, index, exerciseCount) {
  const item = record.exercises[exercise.id];
  const progress = getExerciseProgress(exercise, record);
  const isActive = exercise.id === appState.focusedExerciseId;
  const recordSummary = exerciseRecordSummary(exercise, item);

  if (!isActive) {
    const stateLabel = progress.isSkipped
      ? "已跳过"
      : exercise.optional
      ? progress.isComplete
        ? "已记录"
        : "可选"
      : progress.isComplete
        ? "已完成"
        : index > planExerciseIndex(record, exercise.id)
          ? "待训练"
          : "继续";
    return `
      <article
        class="exercise-card compact${exercise.optional ? " optional" : ""}${progress.isComplete ? " complete" : " upcoming"}${progress.isSkipped ? " skipped" : ""}"
        data-exercise-card="${exercise.id}"
        style="--delay:${Math.min(index, 5) * 32}ms"
      >
        <button
          class="exercise-summary"
          type="button"
          data-action="focus-exercise"
          data-exercise="${exercise.id}"
          aria-label="${stateLabel}：${escapeHtml(exercise.name)}"
        >
          <span class="step-marker${progress.isComplete ? " done" : ""}">${progress.isSkipped ? "−" : progress.isComplete ? "✓" : index + 1}</span>
          <span class="summary-copy">
            <strong>${escapeHtml(exercise.name)}</strong>
            <small>${progress.isSkipped ? `已跳过${item.skipReason ? ` · ${escapeHtml(item.skipReason)}` : ""}` : `${exercise.optional ? "可选 · " : ""}${exercise.sets}组 × ${escapeHtml(exercise.target)}`}</small>
          </span>
          <span class="summary-status">${progress.isSkipped ? "跳过" : recordSummary || (progress.isComplete ? "完成" : exercise.optional ? "可选" : "展开")}</span>
        </button>
      </article>
    `;
  }

  return `
    <article
      class="exercise-card active${exercise.optional ? " optional" : ""}"
      data-exercise-card="${exercise.id}"
      style="--delay:${Math.min(index, 5) * 32}ms"
    >
      <header class="exercise-header">
        <div class="active-step">
          <span>${exercise.extra ? "当天加练" : exercise.optional ? "可选项目" : `当前动作 ${index + 1}/${exerciseCount}`}</span>
          <strong>${exercise.optional ? "不计入进度" : typeLabel(exercise.type)}</strong>
        </div>
        <span class="status-chip">${progress.isSkipped ? "已跳过" : `${progress.complete}/${progress.total}`}</span>
      </header>
      <div class="exercise-title-row">
        <div>
          <h3>${escapeHtml(exercise.name)}</h3>
          <p>${exercise.sets}组 × ${escapeHtml(exercise.target)}</p>
        </div>
        <div class="exercise-title-actions">
          <button
            class="guide-button"
            type="button"
            data-action="open-guide"
            data-exercise="${exercise.id}"
          >
            动作教学
          </button>
          <button
            class="record-button"
            type="button"
            data-action="open-record"
            data-exercise="${exercise.id}"
          >
            ${recordSummary ? "调整记录" : "记录"}
          </button>
        </div>
      </div>
      <p class="record-summary">${recordSummary ? `本次：${escapeHtml(recordSummary)}` : exercise.type === "strength" ? `还没设置重量 · 默认${exerciseWeightUnit(exercise)}` : "可按实际完成情况记录"}</p>
      <p class="exercise-note">${escapeHtml(exercise.note)}</p>
      ${progress.isSkipped ? `<div class="skipped-notice"><strong>这个动作本次不练</strong><span>${escapeHtml(item.skipReason || "可恢复后继续打卡")}</span></div>` : `<div class="set-list" aria-label="${escapeHtml(exercise.name)}组数">
        ${Array.from({ length: exercise.sets }, (_, setIndex) => {
          const set = item.sets[setIndex] || { done: false };
          const setKey = `${dateKey(appState.selectedDate)}:${exercise.id}:${setIndex}`;
          return `
            <button
              class="set-button${set.done ? " done" : ""}${appState.lastChangedSet === setKey ? " just-done" : ""}"
              type="button"
              data-action="toggle-set"
              data-exercise="${exercise.id}"
              data-set="${setIndex}"
              aria-pressed="${set.done ? "true" : "false"}"
            >
              <span>${set.done ? "✓" : setIndex + 1}</span>
              <small>${set.done ? "完成" : `第${setIndex + 1}组`}</small>
            </button>
          `;
        }).join("")}
      </div>
      <p class="set-hint">完成一组点一下，记录会自动保存</p>`}
      <div class="exercise-secondary-actions">
        <button type="button" data-action="toggle-skip" data-exercise="${exercise.id}">${progress.isSkipped ? "恢复动作" : "本次跳过"}</button>
        ${exercise.extra ? `<button class="danger" type="button" data-action="remove-extra" data-exercise="${exercise.id}">删除加练</button>` : ""}
      </div>
    </article>
  `;
}

function planExerciseIndex(record, exerciseId) {
  const plan = selectedPlan();
  const activeIndex = plan.exercises.findIndex((exercise) => exercise.id === appState.focusedExerciseId);
  if (activeIndex >= 0) return activeIndex;
  return plan.exercises.findIndex(
    (exercise) => !getExerciseProgress(exercise, record).isComplete,
  );
}

function renderCompletion(plan, record, progress) {
  if (progress.percent !== 100) {
    elements.completionCard.innerHTML = "";
    return;
  }

  const duration = trainingDuration(record);
  elements.completionCard.innerHTML = `
    <article class="completion-card">
      <span class="completion-check" aria-hidden="true">✓</span>
      <div>
        <p>${progress.total ? "今天的训练完成了" : "今天的计划已处理"}</p>
        <h3>${progress.total ? `${progress.total}组全部打卡` : "已按实际情况调整"}${duration ? ` · ${duration}分钟` : ""}</h3>
      </div>
    </article>
  `;
}

function renderJournal(record, progress) {
  const isOpen = appState.openDailyNote || progress.percent === 100;
  elements.journalArea.innerHTML = `
    <button class="journal-trigger" type="button" data-action="toggle-journal">
      <span>
        <strong>${record.dailyNote ? "已记录当天感受" : "记录当天感受"}</strong>
        <small>${record.dailyNote ? escapeHtml(record.dailyNote.slice(0, 28)) : "可选，写疲劳、疼痛或动作心得"}</small>
      </span>
      <span aria-hidden="true">${isOpen ? "收起" : "填写"}</span>
    </button>
    <div class="journal-panel${isOpen ? "" : " collapsed"}">
      <textarea id="dailyNote" rows="4" placeholder="今天的状态、疲劳或动作心得">${escapeHtml(record.dailyNote || "")}</textarea>
    </div>
  `;
}

function trainingDuration(record) {
  if (record.session?.elapsedMs) return Math.max(1, Math.round(sessionElapsedMs(record.session) / 60000));
  if (!record.startedAt || !record.completedAt) return 0;
  return Math.max(1, Math.round((new Date(record.completedAt) - new Date(record.startedAt)) / 60000));
}

function sessionElapsedMs(session) {
  if (!session) return 0;
  const saved = Number(session.elapsedMs) || 0;
  return session.status === "running" && session.resumedAt ? saved + Math.max(0, Date.now() - session.resumedAt) : saved;
}

function formatElapsed(milliseconds) {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function updateSessionClock() {
  const clock = document.querySelector("#sessionElapsed");
  if (!clock || appState.activeView !== "today") return;
  const record = ensureRecord(dateKey(appState.selectedDate));
  clock.textContent = formatElapsed(sessionElapsedMs(record.session));
}

function updateSessionTicker() {
  const record = ensureRecord(dateKey(appState.selectedDate));
  const shouldRun = appState.activeView === "today" && record.session?.status === "running";
  if (shouldRun && !appState.sessionTicker) {
    appState.sessionTicker = setInterval(updateSessionClock, 1000);
  } else if (!shouldRun && appState.sessionTicker) {
    clearInterval(appState.sessionTicker);
    appState.sessionTicker = null;
  }
}

function startSessionTimer() {
  const record = ensureRecord(dateKey(appState.selectedDate));
  const session = record.session;
  if (session.status === "finished") return;
  session.status = "running";
  session.resumedAt = Date.now();
  session.endedAt = 0;
  if (!session.startedAt) session.startedAt = Date.now();
  touchRecord(record);
  render();
  showToast(session.elapsedMs ? "训练计时继续" : "训练计时已开始");
}

function pauseSessionTimer() {
  const record = ensureRecord(dateKey(appState.selectedDate));
  const session = record.session;
  if (session.status !== "running") return;
  session.elapsedMs = sessionElapsedMs(session);
  session.resumedAt = 0;
  session.status = "paused";
  touchRecord(record);
  render();
  showToast("训练计时已暂停");
}

function finishSessionTimer() {
  const record = ensureRecord(dateKey(appState.selectedDate));
  const before = { ...record.session };
  record.session.elapsedMs = sessionElapsedMs(record.session);
  record.session.resumedAt = 0;
  record.session.endedAt = Date.now();
  record.session.status = "finished";
  touchRecord(record);
  render();
  showToast(`本次训练 ${formatElapsed(record.session.elapsedMs)}`, () => {
    const undoRecord = ensureRecord(dateKey(appState.selectedDate));
    undoRecord.session = before;
    touchRecord(undoRecord);
    render();
  });
}

function resetSessionTimer() {
  const record = ensureRecord(dateKey(appState.selectedDate));
  const before = { ...record.session };
  record.session = { status: "idle", elapsedMs: 0, resumedAt: 0, endedAt: 0, startedAt: 0 };
  touchRecord(record);
  render();
  showToast("计时已重置", () => {
    const undoRecord = ensureRecord(dateKey(appState.selectedDate));
    undoRecord.session = before;
    touchRecord(undoRecord);
    render();
  });
}

function renderWeekPlan() {
  const weekStart = startOfWeek(appState.selectedDate);
  elements.weekPlanList.innerHTML = Array.from({ length: 7 }, (_, index) => {
    const currentDate = addDays(weekStart, index);
    const day = planForDate(currentDate);
    const key = dateKey(currentDate);
    const record = ensureRecord(key, day);
    const progress = getProgress(day, record);
    const exercisePreview = day.exercises
      .filter((exercise) => !exercise.optional)
      .slice(0, 4)
      .map((exercise) => exercise.name)
      .join("、");
    const requiredCount = day.exercises.filter((exercise) => !exercise.optional).length;
    const moreCount = Math.max(0, requiredCount - 4);

    return `
      <article class="week-day-card${progress.percent === 100 ? " complete" : ""}">
        <button type="button" data-action="select-date" data-date="${key}">
          <span class="week-day-date">
            <strong>${day.day}</strong>
            <small>${formatShortDate(currentDate)}</small>
          </span>
          <span class="week-day-main">
            <strong>${escapeHtml(day.title)}</strong>
            <small>${escapeHtml(exercisePreview)}${moreCount ? `等${requiredCount}项` : ""}</small>
          </span>
          <span class="week-progress">${progress.percent}%</span>
        </button>
        <div class="mini-progress"><i style="width:${progress.percent}%"></i></div>
      </article>
    `;
  }).join("");
}

function renderHistory() {
  const records = Object.values(appState.store.records)
    .filter(hasRecordContent)
    .sort((a, b) => b.date.localeCompare(a.date));

  const stats = records.reduce(
    (summary, record) => {
      const plan = planForDate(parseDateKey(record.date));
      const progress = getProgress(plan, ensureRecord(record.date, plan));
      summary.sets += progress.complete;
      if (progress.percent === 100) summary.completeDays += 1;
      return summary;
    },
    { sets: 0, completeDays: 0 },
  );

  elements.historySummary.innerHTML = `
    <article><span>有记录</span><strong>${records.length}</strong><small>天</small></article>
    <article><span>完整完成</span><strong>${stats.completeDays}</strong><small>次</small></article>
    <article><span>累计训练</span><strong>${stats.sets}</strong><small>组</small></article>
  `;

  if (!records.length) {
    elements.historyList.innerHTML = `
      <div class="empty-state">
        <strong>还没有训练记录</strong>
        <span>完成第一组后，这里就会开始积累。</span>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = records
    .map((record) => {
      const date = parseDateKey(record.date);
      const plan = planForDate(date);
      const currentRecord = ensureRecord(record.date, plan);
      const progress = getProgress(plan, currentRecord);
      const duration = trainingDuration(currentRecord);
      return `
        <article class="history-card">
          <button type="button" data-action="open-history" data-date="${record.date}">
            <span class="history-date">
              <strong>${date.getDate()}</strong>
              <small>${date.getMonth() + 1}月</small>
            </span>
            <span class="history-main">
              <strong>${plan.day} · ${escapeHtml(plan.title)}</strong>
              <small>${progress.complete}/${progress.total}组${duration ? ` · ${duration}分钟` : ""}</small>
              <i><b style="width:${progress.percent}%"></b></i>
            </span>
            <span class="history-percent">${progress.percent}%</span>
          </button>
        </article>
      `;
    })
    .join("");
}

function exerciseCatalog() {
  const catalog = new Map();
  const add = (exercise, group) => {
    if (exercise.type !== "strength") return;
    if (!catalog.has(exercise.id)) catalog.set(exercise.id, { ...exercise, group });
  };

  TRAINING_CYCLE.forEach((plan) => {
    const group = plan.id.startsWith("push") ? "push" : plan.id.startsWith("pull") ? "pull" : "legs";
    plan.exercises.forEach((exercise) => add(exercise, group));
  });
  Object.values(appState.store.records || {}).forEach((record) => {
    (record.extraExercises || []).forEach((exercise) => add(exercise, "other"));
  });
  return [...catalog.values()];
}

function latestExerciseHistory(exerciseId) {
  const record = Object.values(appState.store.records || {})
    .filter((entry) => {
      const item = entry.exercises?.[exerciseId];
      return item?.recordedAt || item?.sets?.some((set) => set.done || set.weight || set.reps);
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!record) return null;
  const item = record.exercises[exerciseId];
  const setWeight = item.sets?.find((set) => set.weight)?.weight || "";
  const setReps = item.sets?.map((set) => set.reps).filter(Boolean) || [];
  return {
    date: record.date,
    quickWeight: item.quickWeight || setWeight,
    quickReps: item.quickReps || (setReps.length > 1 ? setReps.join("/") : setReps[0] || ""),
  };
}

function renderWeights() {
  const filters = [
    ["all", "全部"],
    ["push", "推"],
    ["pull", "拉"],
    ["legs", "腿"],
  ];
  elements.weightFilters.innerHTML = filters
    .map(
      ([value, label]) => `
        <button class="${appState.weightFilter === value ? "active" : ""}" type="button" data-action="weight-filter" data-filter="${value}">${label}</button>
      `,
    )
    .join("");

  const exercises = exerciseCatalog().filter(
    (exercise) => appState.weightFilter === "all" || exercise.group === appState.weightFilter,
  );
  elements.weightsStatus.textContent = `${exercises.length}个动作 · 自动保存`;
  elements.weightsList.innerHTML = exercises
    .map((exercise) => {
      const defaults = exerciseDefault(exercise.id);
      const latest = latestExerciseHistory(exercise.id);
      const unit = exerciseWeightUnit(exercise);
      const step = unit === "kg" ? 2.5 : 5;
      const latestText = latest
        ? `${latest.quickWeight ? `${latest.quickWeight}${unit}` : "未记重量"}${latest.quickReps ? ` · ${latest.quickReps}次` : ""}`
        : "还没有完成记录";
      return `
        <article class="weight-card">
          <header>
            <div><strong>${escapeHtml(exercise.name)}</strong><small>上次 ${latest ? escapeHtml(formatShortDate(parseDateKey(latest.date))) : "暂无"} · ${escapeHtml(latestText)}</small></div>
            <span class="unit-badge">${unit}</span>
          </header>
          <div class="weight-editor">
            <label>
              <span>常用重量</span>
              <div class="compact-stepper">
                <button type="button" data-action="adjust-default" data-exercise="${exercise.id}" data-field="quickWeight" data-delta="-${step}">−</button>
                <input inputmode="decimal" data-action="default-value" data-exercise="${exercise.id}" data-field="quickWeight" value="${escapeHtml(defaults.quickWeight || "")}" placeholder="0" aria-label="${escapeHtml(exercise.name)}常用重量" />
                <button type="button" data-action="adjust-default" data-exercise="${exercise.id}" data-field="quickWeight" data-delta="${step}">＋</button>
              </div>
            </label>
            <label>
              <span>常用次数</span>
              <div class="compact-stepper reps">
                <button type="button" data-action="adjust-default" data-exercise="${exercise.id}" data-field="quickReps" data-delta="-1">−</button>
                <input inputmode="decimal" data-action="default-value" data-exercise="${exercise.id}" data-field="quickReps" value="${escapeHtml(defaults.quickReps || "")}" placeholder="0" aria-label="${escapeHtml(exercise.name)}常用次数" />
                <button type="button" data-action="adjust-default" data-exercise="${exercise.id}" data-field="quickReps" data-delta="1">＋</button>
              </div>
            </label>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateNav() {
  document.body.dataset.view = appState.activeView;
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.view === appState.activeView;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
}

function openRecordSheet(exerciseId) {
  const plan = selectedPlan();
  const exercise = plan.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;

  const record = ensureRecord(dateKey(appState.selectedDate), plan);
  const item = record.exercises[exerciseId];
  const values = displayedValues(exerciseId, item);
  const [metricA, metricB] = metricLabels(exercise);
  const supportsStepper = ["strength", "core", "technique"].includes(exercise.type);
  const weightStep = exercise.type === "strength" ? (exerciseWeightUnit(exercise) === "kg" ? 2.5 : 5) : 1;
  const displayItem = { ...item, ...values };

  elements.recordSheetContent.innerHTML = `
    <header class="sheet-header">
      <div>
        <p>${typeLabel(exercise.type)}记录</p>
        <h2 id="recordSheetTitle">${escapeHtml(exercise.name)}</h2>
      </div>
      <button class="sheet-close" type="button" data-action="close-record" aria-label="关闭">×</button>
    </header>
    <div class="record-fields">
      ${renderRecordField(exercise, displayItem, "quickWeight", metricA, supportsStepper ? weightStep : 0)}
      ${renderRecordField(exercise, displayItem, "quickReps", metricB, supportsStepper ? 1 : 0)}
    </div>
    <label class="note-field">
      <span>补充备注</span>
      <textarea
        rows="3"
        data-action="exercise-note"
        data-exercise="${exercise.id}"
        placeholder="器械档位、动作调整或跳过原因"
      >${escapeHtml(item.note || "")}</textarea>
    </label>
    <button class="sheet-done" type="button" data-action="close-record">完成</button>
  `;
  elements.recordSheet.dataset.exercise = exerciseId;
  elements.recordSheet.hidden = false;
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => elements.recordSheet.classList.add("show"));
}

function renderRecordField(exercise, item, field, label, step) {
  const value = item[field] || "";
  if (!step) {
    return `
      <label class="simple-field">
        <span>${label}</span>
        <input
          inputmode="decimal"
          autocomplete="off"
          data-action="quick-value"
          data-field="${field}"
          data-exercise="${exercise.id}"
          value="${escapeHtml(value)}"
          placeholder="-"
        />
      </label>
    `;
  }

  return `
    <div class="stepper-field">
      <span>${label}</span>
      <div class="stepper">
        <button
          type="button"
          data-action="adjust-value"
          data-exercise="${exercise.id}"
          data-field="${field}"
          data-delta="-${step}"
          aria-label="${label}减少${step}"
        >−</button>
        <input
          inputmode="decimal"
          autocomplete="off"
          data-action="quick-value"
          data-field="${field}"
          data-exercise="${exercise.id}"
          value="${escapeHtml(value)}"
          placeholder="-"
          aria-label="${label}"
        />
        <button
          type="button"
          data-action="adjust-value"
          data-exercise="${exercise.id}"
          data-field="${field}"
          data-delta="${step}"
          aria-label="${label}增加${step}"
        >＋</button>
      </div>
    </div>
  `;
}

function closeRecordSheet() {
  elements.recordSheet.classList.remove("show");
  document.body.classList.remove("sheet-open");
  setTimeout(() => {
    elements.recordSheet.hidden = true;
    elements.recordSheet.dataset.exercise = "";
    elements.recordSheet.dataset.mode = "";
  }, 180);
  render();
}

function openAddExerciseSheet(initialType = "strength") {
  appState.extraType = initialType === "cardio" ? "cardio" : "strength";
  appState.extraWeightUnit = "lb";
  elements.recordSheetContent.innerHTML = `
    <header class="sheet-header">
      <div>
        <p>当天实际训练</p>
        <h2 id="recordSheetTitle">添加临时项目</h2>
      </div>
      <button class="sheet-close" type="button" data-action="close-record" aria-label="关闭">×</button>
    </header>
    <form class="extra-form" id="extraExerciseForm">
      <div class="extra-type-row" aria-label="项目类型">
        <button class="${appState.extraType === "strength" ? "active" : ""}" type="button" data-action="select-extra-type" data-extra-type="strength">力量动作</button>
        <button class="${appState.extraType === "cardio" ? "active" : ""}" type="button" data-action="select-extra-type" data-extra-type="cardio">有氧 / 游泳</button>
      </div>
      <label class="extra-name-field"><span>名称</span><input name="name" autocomplete="off" placeholder="例如：器械夹胸" /></label>
      <div class="extra-form-grid">
        <label><span>组数</span><input name="sets" inputmode="numeric" value="${appState.extraType === "cardio" ? "1" : "3"}" /></label>
        <label><span>目标</span><input name="target" autocomplete="off" value="${appState.extraType === "cardio" ? "20分钟" : "8-12次"}" /></label>
      </div>
      <div class="extra-unit-row" ${appState.extraType === "cardio" ? "hidden" : ""}>
        <span>重量单位</span>
        <div>
          <button class="active" type="button" data-action="select-extra-unit" data-unit="lb">磅</button>
          <button type="button" data-action="select-extra-unit" data-unit="kg">kg</button>
        </div>
      </div>
      <label class="extra-name-field"><span>备注（可选）</span><input name="note" autocomplete="off" placeholder="器械、动作重点或临时安排" /></label>
      <button class="sheet-done" type="button" data-action="add-extra">添加到今天</button>
    </form>
  `;
  elements.recordSheet.dataset.mode = "add-extra";
  elements.recordSheet.hidden = false;
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => {
    elements.recordSheet.classList.add("show");
    elements.recordSheet.querySelector('input[name="name"]')?.focus({ preventScroll: true });
  });
}

function addExtraExercise() {
  const form = document.querySelector("#extraExerciseForm");
  if (!form) return;
  const name = form.elements.name.value.trim();
  if (!name) {
    showToast("先写项目名称");
    form.elements.name.focus();
    return;
  }

  const key = dateKey(appState.selectedDate);
  const basePlan = selectedPlan();
  const record = ensureRecord(key, basePlan);
  const exercise = {
    id: `extra-${Date.now()}`,
    name,
    sets: Math.max(1, Math.min(12, Number.parseInt(form.elements.sets.value, 10) || 1)),
    target: form.elements.target.value.trim() || (appState.extraType === "cardio" ? "20分钟" : "8-12次"),
    note: form.elements.note.value.trim() || "当天临时添加，可按实际情况完成。",
    type: appState.extraType,
    weightUnit: appState.extraType === "strength" ? appState.extraWeightUnit : undefined,
    extra: true,
  };
  record.extraExercises.push(exercise);
  touchRecord(record);
  ensureRecord(key, planForDate(appState.selectedDate));
  appState.focusedExerciseId = exercise.type === "strength" ? exercise.id : appState.focusedExerciseId;
  closeRecordSheet();
  showToast(`${name}已加到今天`, () => removeExtraExercise(exercise.id, false));
}

function removeExtraExercise(exerciseId, allowUndo = true) {
  const key = dateKey(appState.selectedDate);
  const record = ensureRecord(key);
  const index = record.extraExercises.findIndex((exercise) => exercise.id === exerciseId);
  if (index < 0) return;
  const exercise = record.extraExercises[index];
  const savedItem = record.exercises[exerciseId];
  record.extraExercises.splice(index, 1);
  delete record.exercises[exerciseId];
  if (appState.focusedExerciseId === exerciseId) appState.focusedExerciseId = "";
  touchRecord(record);
  render();
  if (allowUndo) {
    showToast(`${exercise.name}已删除`, () => {
      const undoRecord = ensureRecord(key);
      undoRecord.extraExercises.splice(index, 0, exercise);
      undoRecord.exercises[exerciseId] = savedItem;
      touchRecord(undoRecord);
      render();
    });
  }
}

function findPlanExercise(exerciseId) {
  const allPlans = [
    ...TRAINING_CYCLE,
    WEEKEND_PLANS.saturday,
    WEEKEND_PLANS.sunday,
  ].filter(Boolean);
  return allPlans.flatMap((day) => day.exercises).find((exercise) => exercise.id === exerciseId);
}

function guideCredit(source) {
  if (source === "wikimedia") {
    return `
      动作示意：
      <a href="https://commons.wikimedia.org/wiki/File:Breaststroke.gif" target="_blank" rel="noreferrer">
        Wikimedia Commons · fxqf · CC BY-SA
      </a>
    `;
  }
  if (source === "free-exercise-db") {
    return `
      动作示意：
      <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">
        Free Exercise DB
      </a>
    `;
  }
  if (source === "mixed") {
    return `
      动作示意：
      <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noreferrer">Free Exercise DB</a>
      与
      <a href="https://repdb.co/free-exercise-dataset" target="_blank" rel="noreferrer">RepDB</a>
    `;
  }
  return `
    动作示意：
    <a href="https://repdb.co/free-exercise-dataset" target="_blank" rel="noreferrer">
      Exercise data by RepDB
    </a>
  `;
}

function renderGuideVisual(exercise, guide) {
  if (appState.guideTab === "muscles") {
    return `
      <div class="muscle-visual">
        <img
          src="${guide.muscleMap}"
          alt="${escapeHtml(exercise.name)}主要训练肌群示意"
          loading="lazy"
          decoding="async"
        />
        <div class="muscle-legend">
          <span><i class="primary-dot"></i>主要发力</span>
          <span><i class="secondary-dot"></i>辅助参与</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="pose-grid${guide.visual.kind === "single" ? " single" : ""}">
      ${guide.visual.frames
        .map(
          (frame) => `
            <figure class="pose-frame">
              <img
                src="${frame.src}"
                alt="${escapeHtml(exercise.name)}${escapeHtml(frame.label)}姿势"
                loading="lazy"
                decoding="async"
              />
              <figcaption>${escapeHtml(frame.label)}</figcaption>
            </figure>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderGuideList(items, ordered = false) {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
}

function renderCoachFocus(coach) {
  if (!coach) return "";
  return `
    <section class="coach-focus">
      <div class="coach-focus-meta">
        <span>视频重点</span>
        <small>${escapeHtml(coach.time)}</small>
      </div>
      <strong>${escapeHtml(coach.focus)}</strong>
    </section>
  `;
}

function renderCoachDetails(coach) {
  if (!coach) return "";
  return `
    <section class="guide-section coach-details">
      <header>
        <div>
          <span>跟着视频做</span>
          <h3>${escapeHtml(coach.session)}</h3>
        </div>
        <small>${escapeHtml(coach.time)}</small>
      </header>
      <div class="coach-point-list">
        ${coach.points
          .map(
            (point) => `
              <article class="coach-point">
                <span>${escapeHtml(point.label)}</span>
                <p>${escapeHtml(point.text)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderGuideSheet() {
  const exercise = findPlanExercise(appState.guideExerciseId);
  const guide = EXERCISE_GUIDES[appState.guideExerciseId];
  if (!exercise || !guide) return;

  elements.guideSheetContent.innerHTML = `
    <header class="sheet-header guide-header">
      <div>
        <p>${typeLabel(exercise.type)}教学 · ${exercise.sets}组 × ${escapeHtml(exercise.target)}</p>
        <h2 id="guideSheetTitle">${escapeHtml(exercise.name)}</h2>
      </div>
      <button class="sheet-close" type="button" data-action="close-guide" aria-label="关闭">×</button>
    </header>

    <div class="guide-tabs" role="tablist" aria-label="动作教学视图">
      <button
        type="button"
        role="tab"
        data-action="guide-tab"
        data-tab="motion"
        aria-selected="${appState.guideTab === "motion"}"
        class="${appState.guideTab === "motion" ? "active" : ""}"
      >动作示意</button>
      <button
        type="button"
        role="tab"
        data-action="guide-tab"
        data-tab="muscles"
        aria-selected="${appState.guideTab === "muscles"}"
        class="${appState.guideTab === "muscles" ? "active" : ""}"
      >训练肌群</button>
    </div>

    ${renderCoachFocus(guide.coach)}

    <div class="guide-visual">${renderGuideVisual(exercise, guide)}</div>

    <div class="muscle-chips" aria-label="参与肌群">
      ${guide.primary.map((name) => `<span class="primary">${escapeHtml(name)}</span>`).join("")}
      ${guide.secondary.map((name) => `<span>${escapeHtml(name)}</span>`).join("")}
    </div>

    ${renderCoachDetails(guide.coach)}

    <section class="guide-section steps">
      <h3>怎么做</h3>
      ${renderGuideList(guide.steps, true)}
    </section>

    <div class="guide-section-grid">
      <section class="guide-section cues">
        <h3>记住这几点</h3>
        ${renderGuideList(guide.cues)}
      </section>
      <section class="guide-section mistakes">
        <h3>常见错误</h3>
        ${renderGuideList(guide.mistakes)}
      </section>
    </div>

    <section class="breathing-note">
      <strong>呼吸</strong>
      <span>${escapeHtml(guide.breathing)}</span>
    </section>

    <p class="safety-note">
      ${escapeHtml(guide.safety || "肌肉酸胀可以观察；关节锐痛、麻木或明显不适时立即停止。")}
    </p>

    <footer class="guide-credit">
      <span>${guideCredit(guide.visual.source)}</span>
      <span>
        肌肉示意：
        <a href="https://anatome.dev" target="_blank" rel="noreferrer">Anatome</a>
      </span>
      <small>示意图用于帮助理解动作，不替代现场动作纠正或医疗建议。</small>
    </footer>
  `;
}

function openGuideSheet(exerciseId) {
  if (!EXERCISE_GUIDES[exerciseId]) {
    showToast("这个动作的教学正在补充");
    return;
  }

  appState.guideExerciseId = exerciseId;
  appState.guideTab = "motion";
  renderGuideSheet();
  elements.guideSheet.hidden = false;
  document.body.classList.add("sheet-open");
  requestAnimationFrame(() => {
    elements.guideSheet.classList.add("show");
    elements.guideSheet.querySelector(".sheet-close")?.focus({ preventScroll: true });
  });
}

function closeGuideSheet() {
  elements.guideSheet.classList.remove("show");
  document.body.classList.remove("sheet-open");
  setTimeout(() => {
    elements.guideSheet.hidden = true;
    elements.guideSheetContent.innerHTML = "";
    appState.guideExerciseId = "";
  }, 180);
}

function recordTrainingTiming(record, progressBefore, progressAfter) {
  if (record.session) return;
  const now = new Date().toISOString();
  if (progressBefore.complete === 0 && progressAfter.complete > 0 && !record.startedAt) {
    record.startedAt = now;
  }
  if (progressAfter.percent === 100) {
    if (!record.completedAt) record.completedAt = now;
  } else {
    record.completedAt = "";
  }
}

function nextIncompleteExercise(plan, record, currentId) {
  const currentIndex = plan.exercises.findIndex((exercise) => exercise.id === currentId);
  return plan.exercises
    .slice(currentIndex + 1)
    .find(
      (exercise) =>
        !exercise.optional &&
        !isConditioningExercise(exercise) &&
        !record.exercises[exercise.id]?.skipped &&
        !getExerciseProgress(exercise, record).isComplete,
    );
}

function scrollToExercise(exerciseId) {
  requestAnimationFrame(() => {
    document
      .querySelector(`[data-exercise-card="${CSS.escape(exerciseId)}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function toggleSet(exerciseId, setIndex) {
  const plan = selectedPlan();
  const key = dateKey(appState.selectedDate);
  const record = ensureRecord(key, plan);
  const exercise = plan.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return;

  const set = record.exercises[exerciseId].sets[setIndex];
  const wasDone = set.done;
  const timingBefore = {
    startedAt: record.startedAt || "",
    completedAt: record.completedAt || "",
    focusedExerciseId: appState.focusedExerciseId,
    timer: appState.timer ? { ...appState.timer } : null,
  };
  const before = getProgress(plan, record);
  set.done = !set.done;
  appState.lastChangedSet = `${key}:${exerciseId}:${setIndex}`;

  if (set.done) {
    gentleVibration(12);
    if (!["cardio", "recovery"].includes(exercise.type)) startRestTimer(exercise);
  } else {
    appState.focusedExerciseId = exerciseId;
  }

  const exerciseProgress = getExerciseProgress(exercise, record);
  let toastMessage = set.done ? `第${setIndex + 1}组已完成` : `第${setIndex + 1}组已取消`;
  if (exercise.optional) {
    if (!isConditioningExercise(exercise)) appState.focusedExerciseId = exercise.id;
    toastMessage = set.done ? `${exercise.name}已记录` : `${exercise.name}已取消`;
  } else if (exerciseProgress.isComplete) {
    const next = nextIncompleteExercise(plan, record, exerciseId);
    appState.focusedExerciseId = next?.id || "";
    toastMessage = next ? `${exercise.name}完成，下一项已准备好` : "今天全部完成";
  }

  const after = getProgress(plan, record);
  recordTrainingTiming(record, before, after);
  touchRecord(record);
  pulseProgress();
  render();
  showToast(toastMessage, () => {
    const undoRecord = ensureRecord(key, plan);
    undoRecord.exercises[exerciseId].sets[setIndex].done = wasDone;
    undoRecord.startedAt = timingBefore.startedAt;
    undoRecord.completedAt = timingBefore.completedAt;
    appState.focusedExerciseId = timingBefore.focusedExerciseId || exerciseId;
    appState.timer = timingBefore.timer;
    saveTimer();
    if (appState.timer) ensureTimerTicker();
    else stopTimerTicker();
    appState.lastChangedSet = "";
    touchRecord(undoRecord);
    render();
  });
  if (exerciseProgress.isComplete && appState.focusedExerciseId) {
    scrollToExercise(appState.focusedExerciseId);
  }
}

function toggleSkipExercise(exerciseId) {
  const key = dateKey(appState.selectedDate);
  const plan = selectedPlan();
  const record = ensureRecord(key, plan);
  const item = record.exercises[exerciseId];
  const exercise = plan.exercises.find((entry) => entry.id === exerciseId);
  if (!item || !exercise) return;
  const before = { skipped: Boolean(item.skipped), skipReason: item.skipReason || "" };
  item.skipped = !item.skipped;
  item.skipReason = item.skipped ? item.note?.trim() || "临时调整" : "";
  if (item.skipped) {
    const next = nextIncompleteExercise(plan, record, exerciseId);
    appState.focusedExerciseId = next?.id || exerciseId;
  } else {
    appState.focusedExerciseId = exerciseId;
  }
  touchRecord(record);
  render();
  showToast(item.skipped ? `${exercise.name}本次已跳过` : `${exercise.name}已恢复`, () => {
    const undoRecord = ensureRecord(key, plan);
    undoRecord.exercises[exerciseId].skipped = before.skipped;
    undoRecord.exercises[exerciseId].skipReason = before.skipReason;
    appState.focusedExerciseId = exerciseId;
    touchRecord(undoRecord);
    render();
  });
}

function gentleVibration(pattern) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function timerDuration(exercise) {
  return COMPOUND_EXERCISES.has(exercise.id) ? 120 : 90;
}

function startRestTimer(exercise) {
  clearTimeout(appState.timerAutoClose);
  appState.timerAutoClose = null;
  const duration = timerDuration(exercise);
  appState.timer = {
    exerciseName: exercise.name,
    duration,
    remaining: duration,
    running: true,
    finished: false,
    endAt: Date.now() + duration * 1000,
  };
  saveTimer();
  ensureTimerTicker();
}

function currentTimerRemaining() {
  if (!appState.timer) return 0;
  if (!appState.timer.running) return Math.max(0, appState.timer.remaining || 0);
  return Math.max(0, Math.ceil((appState.timer.endAt - Date.now()) / 1000));
}

function tickTimer() {
  if (!appState.timer) {
    stopTimerTicker();
    renderTimer();
    return;
  }

  const remaining = currentTimerRemaining();
  appState.timer.remaining = remaining;
  if (remaining <= 0 && appState.timer.running) {
    appState.timer.running = false;
    appState.timer.finished = true;
    appState.timer.endAt = 0;
    gentleVibration([20, 60, 20]);
    showToast("休息结束，可以开始下一组");
    clearTimeout(appState.timerAutoClose);
    appState.timerAutoClose = setTimeout(() => closeTimer(), 15000);
  }
  saveTimer();
  renderTimer();
}

function ensureTimerTicker() {
  if (appState.timerTicker) return;
  appState.timerTicker = setInterval(tickTimer, 500);
}

function stopTimerTicker() {
  if (!appState.timerTicker) return;
  clearInterval(appState.timerTicker);
  appState.timerTicker = null;
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function renderTimer() {
  const timer = appState.timer;
  const visible = Boolean(timer) && appState.activeView === "today" && dateKey(appState.selectedDate) === dateKey(new Date());
  elements.restTimer.hidden = !visible;
  document.body.classList.toggle("timer-visible", visible);
  if (!visible) return;

  const remaining = currentTimerRemaining();
  const progress = timer.duration ? Math.max(0, Math.min(1, remaining / timer.duration)) : 0;
  elements.restTimer.innerHTML = `
    <div class="timer-ring" style="--timer-angle:${Math.round(progress * 360)}deg">
      <span>${timer.finished ? "✓" : formatTimer(remaining)}</span>
    </div>
    <div class="timer-copy">
      <strong>${timer.finished ? "休息结束" : timer.running ? "组间休息" : "已暂停"}</strong>
      <small>${escapeHtml(timer.exerciseName)}</small>
    </div>
    <div class="timer-actions">
      <button type="button" data-action="timer-adjust" data-delta="15" aria-label="增加15秒">+15</button>
      <button type="button" data-action="timer-toggle">${timer.running ? "暂停" : timer.finished ? "重计" : "继续"}</button>
      <button type="button" data-action="timer-close" aria-label="关闭计时">×</button>
    </div>
  `;
}

function adjustTimer(seconds) {
  if (!appState.timer) return;
  const remaining = Math.max(0, currentTimerRemaining() + seconds);
  appState.timer.remaining = remaining;
  appState.timer.finished = false;
  if (appState.timer.running) appState.timer.endAt = Date.now() + remaining * 1000;
  saveTimer();
  renderTimer();
}

function toggleTimer() {
  if (!appState.timer) return;
  clearTimeout(appState.timerAutoClose);
  appState.timerAutoClose = null;
  if (appState.timer.finished) {
    appState.timer.remaining = appState.timer.duration;
    appState.timer.endAt = Date.now() + appState.timer.duration * 1000;
    appState.timer.running = true;
    appState.timer.finished = false;
  } else if (appState.timer.running) {
    appState.timer.remaining = currentTimerRemaining();
    appState.timer.running = false;
    appState.timer.endAt = 0;
  } else {
    appState.timer.running = true;
    appState.timer.endAt = Date.now() + appState.timer.remaining * 1000;
  }
  saveTimer();
  renderTimer();
}

function closeTimer() {
  clearTimeout(appState.timerAutoClose);
  appState.timerAutoClose = null;
  appState.timer = null;
  saveTimer();
  stopTimerTicker();
  renderTimer();
}

function pulseProgress() {
  elements.progressFill.classList.remove("pulse");
  requestAnimationFrame(() => elements.progressFill.classList.add("pulse"));
}

function showToast(message, undoAction = null) {
  clearTimeout(appState.toastTimer);
  appState.undoAction = undoAction;
  elements.toast.innerHTML = `
    <span>${escapeHtml(message)}</span>
    ${undoAction ? '<button type="button" data-action="undo-toast">撤销</button>' : ""}
  `;
  elements.toast.classList.add("show");
  appState.toastTimer = setTimeout(() => {
    elements.toast.classList.remove("show");
    appState.undoAction = null;
  }, undoAction ? 7000 : 1800);
}

function selectDate(key) {
  appState.selectedDate = parseDateKey(key);
  appState.activeView = "today";
  appState.focusedExerciseId = "";
  appState.openDailyNote = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const view = button.dataset.view;

  if (view) {
    appState.activeView = view;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (action === "prev-week" || action === "next-week") {
    appState.selectedDate = addDays(appState.selectedDate, action === "prev-week" ? -7 : 7);
    appState.focusedExerciseId = "";
    render();
    return;
  }

  if (action === "select-date" || action === "open-history") {
    selectDate(button.dataset.date);
    return;
  }

  if (action === "focus-exercise") {
    appState.focusedExerciseId = button.dataset.exercise;
    render();
    scrollToExercise(button.dataset.exercise);
    return;
  }

  if (action === "toggle-set") {
    toggleSet(button.dataset.exercise, Number(button.dataset.set));
    return;
  }

  if (action === "open-record") {
    openRecordSheet(button.dataset.exercise);
    return;
  }

  if (action === "open-add-exercise") {
    openAddExerciseSheet(button.dataset.extraType);
    return;
  }

  if (action === "select-extra-type") {
    appState.extraType = button.dataset.extraType;
    document.querySelectorAll("[data-action='select-extra-type']").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    const form = document.querySelector("#extraExerciseForm");
    const isCardio = appState.extraType === "cardio";
    if (form) {
      form.querySelector(".extra-unit-row").hidden = isCardio;
      if (isCardio && form.elements.sets.value === "3") form.elements.sets.value = "1";
      if (isCardio && form.elements.target.value === "8-12次") form.elements.target.value = "20分钟";
      if (!isCardio && form.elements.target.value === "20分钟") form.elements.target.value = "8-12次";
    }
    return;
  }

  if (action === "select-extra-unit") {
    appState.extraWeightUnit = button.dataset.unit;
    document.querySelectorAll("[data-action='select-extra-unit']").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    return;
  }

  if (action === "add-extra") {
    addExtraExercise();
    return;
  }

  if (action === "remove-extra") {
    removeExtraExercise(button.dataset.exercise);
    return;
  }

  if (action === "toggle-skip") {
    toggleSkipExercise(button.dataset.exercise);
    return;
  }

  if (action === "open-guide") {
    openGuideSheet(button.dataset.exercise);
    return;
  }

  if (action === "close-record") {
    closeRecordSheet();
    return;
  }

  if (action === "close-guide") {
    closeGuideSheet();
    return;
  }

  if (action === "guide-tab") {
    appState.guideTab = button.dataset.tab;
    renderGuideSheet();
    return;
  }

  if (action === "adjust-value") {
    const record = ensureRecord(dateKey(appState.selectedDate));
    const item = record.exercises[button.dataset.exercise];
    const currentValues = displayedValues(button.dataset.exercise, item);
    const current = Number.parseFloat(currentValues[button.dataset.field]) || 0;
    const next = Math.max(0, current + Number(button.dataset.delta));
    item[button.dataset.field] = Number.isInteger(next) ? String(next) : next.toFixed(1);
    item.recordedAt = new Date().toISOString();
    saveExerciseDefault(button.dataset.exercise, button.dataset.field, item[button.dataset.field]);
    touchRecord(record);
    openRecordSheet(button.dataset.exercise);
    return;
  }

  if (action === "adjust-default") {
    const defaults = exerciseDefault(button.dataset.exercise);
    const current = Number.parseFloat(defaults[button.dataset.field]) || 0;
    const next = Math.max(0, current + Number(button.dataset.delta));
    const value = Number.isInteger(next) ? String(next) : next.toFixed(1);
    updateExerciseValue(button.dataset.exercise, button.dataset.field, value);
    renderWeights();
    elements.weightsStatus.textContent = "已保存";
    return;
  }

  if (action === "weight-filter") {
    appState.weightFilter = button.dataset.filter;
    renderWeights();
    return;
  }

  if (action === "session-start") {
    startSessionTimer();
    return;
  }

  if (action === "session-pause") {
    pauseSessionTimer();
    return;
  }

  if (action === "session-finish") {
    finishSessionTimer();
    return;
  }

  if (action === "session-reset") {
    resetSessionTimer();
    return;
  }

  if (action === "toggle-journal") {
    appState.openDailyNote = !appState.openDailyNote;
    render();
    return;
  }

  if (action === "timer-adjust") {
    adjustTimer(Number(button.dataset.delta));
    return;
  }

  if (action === "timer-toggle") {
    toggleTimer();
    return;
  }

  if (action === "undo-toast") {
    const undoAction = appState.undoAction;
    appState.undoAction = null;
    clearTimeout(appState.toastTimer);
    elements.toast.classList.remove("show");
    if (undoAction) undoAction();
    showToast("已恢复");
    return;
  }

  if (action === "timer-close") closeTimer();
});

document.addEventListener("input", (event) => {
  const target = event.target;
  const action = target.dataset.action;
  const key = dateKey(appState.selectedDate);
  const record = ensureRecord(key);

  if (action === "quick-value") {
    record.exercises[target.dataset.exercise][target.dataset.field] = target.value;
    record.exercises[target.dataset.exercise].recordedAt = new Date().toISOString();
    saveExerciseDefault(target.dataset.exercise, target.dataset.field, target.value);
    touchRecord(record);
  }

  if (action === "default-value") {
    updateExerciseValue(target.dataset.exercise, target.dataset.field, target.value);
    elements.weightsStatus.textContent = "已保存";
  }

  if (action === "exercise-note") {
    record.exercises[target.dataset.exercise].note = target.value;
    if (record.exercises[target.dataset.exercise].skipped) {
      record.exercises[target.dataset.exercise].skipReason = target.value.trim() || "临时调整";
    }
    touchRecord(record);
  }

  if (target.id === "dailyNote") {
    record.dailyNote = target.value;
    touchRecord(record);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!elements.guideSheet.hidden) {
    closeGuideSheet();
  } else if (!elements.recordSheet.hidden) {
    closeRecordSheet();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  appState.deferredPrompt = event;
  elements.installBtn.hidden = false;
});

elements.installBtn.addEventListener("click", async () => {
  if (!appState.deferredPrompt) return;
  appState.deferredPrompt.prompt();
  await appState.deferredPrompt.userChoice;
  appState.deferredPrompt = null;
  elements.installBtn.hidden = true;
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && appState.timer) tickTimer();
});

function migrateLegacyRecords() {
  const oldTitles = {
    0: "休息",
    1: "全身A + 20分钟有氧",
    2: "肩手臂核心 + 30分钟有氧",
    3: "全身B + 20分钟有氧",
    4: "动作练习 + 小肌群 + 30分钟有氧",
    5: "全身A + 20分钟有氧",
    6: "可选轻松游泳",
  };
  const oldNames = {
    "leg-press": "坐姿腿举",
    "chest-press": "坐姿推胸器",
    "lat-pulldown": "高位下拉",
    "leg-curl": "坐姿腿弯举",
    "seated-row": "坐姿划船",
    "lateral-raise": "侧平举",
    crunch: "卷腹",
    "cardio-20": "爬坡或单车",
    "machine-lateral-raise": "器械侧平举",
    "reverse-fly": "反向飞鸟",
    "triceps-pushdown": "绳索下压",
    "biceps-curl": "二头弯举",
    "crunch-plus": "卷腹",
    plank: "平板支撑",
    "cardio-30-a": "爬坡或单车",
    "hack-squat": "哈克深蹲或腿举",
    "incline-press": "上斜推胸器",
    "chest-supported-row": "胸托划船器",
    "hip-thrust": "臀推器械",
    "neutral-pulldown": "中立握高位下拉",
    "reverse-fly-b": "反向飞鸟",
    "crunch-b": "卷腹",
    "cardio-short-b": "轻中等强度有氧",
    "light-pulldown": "轻重量高位下拉",
    "light-row": "轻重量坐姿划船",
    "light-chest-press": "轻重量推胸器",
    "hip-abduction": "髋外展器",
    "calf-raise": "小腿提踵",
    "core-choice": "核心训练",
    "cardio-30-b": "爬坡或单车",
    "easy-swim": "轻松蛙泳",
    mobility: "拉伸放松",
    "rest-day": "休息完成",
  };

  let changed = false;
  Object.values(appState.store.records || {}).forEach((record) => {
    if (record.planId || record.planSnapshot || !hasRecordContent(record)) return;
    const date = parseDateKey(record.date);
    const exercises = Object.entries(record.exercises || {}).map(([id, item]) => {
      const isCardio = id.includes("cardio") || id.includes("swim");
      const isRecovery = id === "mobility" || id === "rest-day";
      return {
        id,
        name: oldNames[id] || id,
        sets: Math.max(1, item.sets?.length || 1),
        target: "旧版记录",
        note: "这是切换三分化前保存的训练内容。",
        type: isRecovery ? "recovery" : isCardio ? "cardio" : "strength",
      };
    });

    record.planSnapshot = {
      id: `legacy-${record.date}`,
      day: WEEKDAY_NAMES[date.getDay()],
      shortTitle: "旧计划",
      title: oldTitles[date.getDay()] || "旧版训练记录",
      focus: "切换三分化前的历史记录，原始打卡数据已保留。",
      tags: ["旧版记录"],
      exercises,
    };
    changed = true;
  });

  if (changed) saveStore();
}

function migrateExerciseDefaults() {
  ensureStoreShape();
  const records = Object.values(appState.store.records)
    .filter(hasRecordContent)
    .sort((a, b) => b.date.localeCompare(a.date));
  let changed = false;

  exerciseCatalog().forEach((exercise) => {
    const defaults = exerciseDefault(exercise.id);
    if (defaults.quickWeight && defaults.quickReps) return;
    const previous = records
      .map((record) => record.exercises?.[exercise.id])
      .find((item) => item?.quickWeight || item?.quickReps || item?.sets?.some((set) => set.weight || set.reps));
    if (!previous) return;
    const setWeight = previous.sets?.find((set) => set.weight)?.weight || "";
    const setReps = previous.sets?.map((set) => set.reps).filter(Boolean) || [];
    if (!defaults.quickWeight && (previous.quickWeight || setWeight)) {
      defaults.quickWeight = previous.quickWeight || setWeight;
      changed = true;
    }
    if (!defaults.quickReps && (previous.quickReps || setReps.length)) {
      defaults.quickReps = previous.quickReps || (setReps.length > 1 ? setReps.join("/") : setReps[0] || "");
      changed = true;
    }
    appState.store.exerciseDefaults[exercise.id] = defaults;
  });

  if (changed) saveStore();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

ensureStoreShape();
migrateLegacyRecords();
migrateExerciseDefaults();
if (appState.timer) {
  if (appState.timer.finished || (appState.timer.running && appState.timer.endAt < Date.now())) {
    appState.timer = null;
    saveTimer();
  } else {
    tickTimer();
    ensureTimerTicker();
  }
}
render();
