const STORE_KEY = "training-checkin-v1";
const TIMER_KEY = "training-checkin-timer-v1";
const TRAINING_PLAN = window.TRAINING_PLAN;
const EXERCISE_GUIDES = window.EXERCISE_GUIDES || {};
const FEEL_OPTIONS = ["轻松", "刚好", "吃力"];
const COMPOUND_EXERCISES = new Set([
  "leg-press",
  "hack-squat",
  "hip-thrust",
  "chest-press",
  "incline-press",
  "lat-pulldown",
  "chest-supported-row",
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
  toastTimer: null,
  undoAction: null,
  deferredPrompt: null,
  guideExerciseId: "",
  guideTab: "motion",
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
  completionCard: document.querySelector("#completionCard"),
  journalArea: document.querySelector("#journalArea"),
  weekPlanList: document.querySelector("#weekPlanList"),
  historySummary: document.querySelector("#historySummary"),
  historyList: document.querySelector("#historyList"),
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

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStore() {
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

function planIndexForDate(date) {
  return (date.getDay() + 6) % 7;
}

function selectedPlan() {
  return TRAINING_PLAN[planIndexForDate(appState.selectedDate)];
}

function findPreviousValues(exerciseId, beforeKey) {
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

function ensureRecord(key, plan = TRAINING_PLAN[planIndexForDate(parseDateKey(key))]) {
  if (!appState.store.records) appState.store.records = {};
  if (!appState.store.records[key]) {
    appState.store.records[key] = {
      date: key,
      updatedAt: "",
      startedAt: "",
      completedAt: "",
      exercises: {},
      dailyNote: "",
    };
  }

  const record = appState.store.records[key];
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
  const complete = (item?.sets || []).filter((set) => set.done).length;
  return {
    complete,
    total: exercise.sets,
    isComplete: complete === exercise.sets,
  };
}

function getProgress(plan, record) {
  const total = plan.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const complete = plan.exercises.reduce(
    (sum, exercise) => sum + getExerciseProgress(exercise, record).complete,
    0,
  );
  return {
    total,
    complete,
    percent: total ? Math.round((complete / total) * 100) : 0,
  };
}

function hasRecordContent(record) {
  if (record.dailyNote?.trim()) return true;
  return Object.values(record.exercises || {}).some((item) => {
    if (item.feel || item.note?.trim()) return true;
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
  return ["重量 kg", "实际次数"];
}

function resolveFocusedExercise(plan, record) {
  const requested = plan.exercises.find((exercise) => exercise.id === appState.focusedExerciseId);
  if (requested) return requested.id;

  const firstIncomplete = plan.exercises.find(
    (exercise) => !getExerciseProgress(exercise, record).isComplete,
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
}

function renderDayStrip() {
  const weekStart = startOfWeek(appState.selectedDate);
  const selectedKey = dateKey(appState.selectedDate);
  const todayKey = dateKey(new Date());

  elements.dayStrip.innerHTML = TRAINING_PLAN.map((plan, index) => {
    const dayDate = addDays(weekStart, index);
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

  elements.todayView.hidden = !showToday;
  elements.weekView.hidden = !showWeek;
  elements.historyView.hidden = !showHistory;
  elements.progressPanel.hidden = !showToday;
  document.querySelector(".week-control").hidden = showHistory;

  if (showToday) {
    renderPlanMeta(plan);
    renderExercises(plan, record);
    renderCompletion(plan, record, progress);
    renderJournal(record, progress);
  }
  if (showWeek) renderWeekPlan();
  if (showHistory) renderHistory();
}

function renderPlanMeta(plan) {
  elements.planMeta.innerHTML = `
    <div class="focus-copy">
      <span class="focus-dot" aria-hidden="true"></span>
      <p>${escapeHtml(plan.focus)}</p>
    </div>
    <div class="meta-line">
      ${plan.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderExercises(plan, record) {
  elements.exerciseList.innerHTML = plan.exercises
    .map((exercise, index) => renderExerciseCard(exercise, record, index))
    .join("");
}

function renderExerciseCard(exercise, record, index) {
  const item = record.exercises[exercise.id];
  const progress = getExerciseProgress(exercise, record);
  const isActive = exercise.id === appState.focusedExerciseId;
  const recordSummary = [item.quickWeight && `${item.quickWeight}${exercise.type === "strength" ? "kg" : ""}`, item.quickReps, item.feel]
    .filter(Boolean)
    .join(" · ");

  if (!isActive) {
    const stateLabel = progress.isComplete ? "已完成" : index > planExerciseIndex(record, exercise.id) ? "待训练" : "继续";
    return `
      <article
        class="exercise-card compact${progress.isComplete ? " complete" : " upcoming"}"
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
          <span class="step-marker${progress.isComplete ? " done" : ""}">${progress.isComplete ? "✓" : index + 1}</span>
          <span class="summary-copy">
            <strong>${escapeHtml(exercise.name)}</strong>
            <small>${exercise.sets}组 × ${escapeHtml(exercise.target)}${recordSummary ? ` · ${escapeHtml(recordSummary)}` : ""}</small>
          </span>
          <span class="summary-status">${progress.isComplete ? "完成" : "展开"}</span>
        </button>
      </article>
    `;
  }

  return `
    <article
      class="exercise-card active"
      data-exercise-card="${exercise.id}"
      style="--delay:${Math.min(index, 5) * 32}ms"
    >
      <header class="exercise-header">
        <div class="active-step">
          <span>当前动作 ${index + 1}/${selectedPlan().exercises.length}</span>
          <strong>${typeLabel(exercise.type)}</strong>
        </div>
        <span class="status-chip">${progress.complete}/${progress.total}</span>
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
      ${recordSummary ? `<p class="record-summary">本次沿用：${escapeHtml(recordSummary)}</p>` : ""}
      <p class="exercise-note">${escapeHtml(exercise.note)}</p>
      <div class="set-list" aria-label="${escapeHtml(exercise.name)}组数">
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
      <p class="set-hint">完成一组点一下，记录会自动保存</p>
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
        <p>今天的训练完成了</p>
        <h3>${progress.total}组全部打卡${duration ? ` · ${duration}分钟` : ""}</h3>
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
  if (!record.startedAt || !record.completedAt) return 0;
  return Math.max(1, Math.round((new Date(record.completedAt) - new Date(record.startedAt)) / 60000));
}

function renderWeekPlan() {
  const weekStart = startOfWeek(appState.selectedDate);
  elements.weekPlanList.innerHTML = TRAINING_PLAN.map((day, index) => {
    const currentDate = addDays(weekStart, index);
    const key = dateKey(currentDate);
    const record = ensureRecord(key, day);
    const progress = getProgress(day, record);
    const exercisePreview = day.exercises
      .slice(0, 4)
      .map((exercise) => exercise.name)
      .join("、");
    const moreCount = Math.max(0, day.exercises.length - 4);

    return `
      <article class="week-day-card${progress.percent === 100 ? " complete" : ""}">
        <button type="button" data-action="select-date" data-date="${key}">
          <span class="week-day-date">
            <strong>${day.day}</strong>
            <small>${formatShortDate(currentDate)}</small>
          </span>
          <span class="week-day-main">
            <strong>${escapeHtml(day.title)}</strong>
            <small>${escapeHtml(exercisePreview)}${moreCount ? `等${day.exercises.length}项` : ""}</small>
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
      const plan = TRAINING_PLAN[planIndexForDate(parseDateKey(record.date))];
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
      const plan = TRAINING_PLAN[planIndexForDate(date)];
      const currentRecord = ensureRecord(record.date, plan);
      const progress = getProgress(plan, currentRecord);
      const duration = trainingDuration(currentRecord);
      const feel = mostCommonFeel(currentRecord);
      return `
        <article class="history-card">
          <button type="button" data-action="open-history" data-date="${record.date}">
            <span class="history-date">
              <strong>${date.getDate()}</strong>
              <small>${date.getMonth() + 1}月</small>
            </span>
            <span class="history-main">
              <strong>${plan.day} · ${escapeHtml(plan.title)}</strong>
              <small>${progress.complete}/${progress.total}组${duration ? ` · ${duration}分钟` : ""}${feel ? ` · ${feel}` : ""}</small>
              <i><b style="width:${progress.percent}%"></b></i>
            </span>
            <span class="history-percent">${progress.percent}%</span>
          </button>
        </article>
      `;
    })
    .join("");
}

function mostCommonFeel(record) {
  const feels = Object.values(record.exercises || {})
    .map((item) => item.feel)
    .filter(Boolean);
  if (!feels.length) return "";
  return [...FEEL_OPTIONS].sort(
    (a, b) => feels.filter((feel) => feel === b).length - feels.filter((feel) => feel === a).length,
  )[0];
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
  const [metricA, metricB] = metricLabels(exercise);
  const supportsStepper = ["strength", "core", "technique"].includes(exercise.type);

  elements.recordSheetContent.innerHTML = `
    <header class="sheet-header">
      <div>
        <p>${typeLabel(exercise.type)}记录</p>
        <h2 id="recordSheetTitle">${escapeHtml(exercise.name)}</h2>
      </div>
      <button class="sheet-close" type="button" data-action="close-record" aria-label="关闭">×</button>
    </header>
    <div class="record-fields">
      ${renderRecordField(exercise, item, "quickWeight", metricA, supportsStepper ? 2.5 : 0)}
      ${renderRecordField(exercise, item, "quickReps", metricB, supportsStepper ? 1 : 0)}
    </div>
    <div class="feel-section">
      <span>训练感受</span>
      <div class="feel-row">
        ${FEEL_OPTIONS.map(
          (feel) => `
            <button
              class="feel-button${item.feel === feel ? " active" : ""}"
              type="button"
              data-action="set-feel"
              data-exercise="${exercise.id}"
              data-feel="${feel}"
            >${feel}</button>
          `,
        ).join("")}
      </div>
    </div>
    <label class="note-field">
      <span>补充备注</span>
      <textarea
        rows="3"
        data-action="exercise-note"
        data-exercise="${exercise.id}"
        placeholder="器械档位、发力感或不舒服的位置"
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
  }, 180);
  render();
}

function findPlanExercise(exerciseId) {
  return TRAINING_PLAN.flatMap((day) => day.exercises).find((exercise) => exercise.id === exerciseId);
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

    <div class="guide-visual">${renderGuideVisual(exercise, guide)}</div>

    <div class="muscle-chips" aria-label="参与肌群">
      ${guide.primary.map((name) => `<span class="primary">${escapeHtml(name)}</span>`).join("")}
      ${guide.secondary.map((name) => `<span>${escapeHtml(name)}</span>`).join("")}
    </div>

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
    .find((exercise) => !getExerciseProgress(exercise, record).isComplete);
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
  if (exerciseProgress.isComplete) {
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

function gentleVibration(pattern) {
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}

function timerDuration(exercise) {
  return COMPOUND_EXERCISES.has(exercise.id) ? 120 : 90;
}

function startRestTimer(exercise) {
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
  elements.restTimer.hidden = !timer;
  document.body.classList.toggle("timer-visible", Boolean(timer));
  if (!timer) return;

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
  }, undoAction ? 4200 : 1800);
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
    const current = Number.parseFloat(item[button.dataset.field]) || 0;
    const next = Math.max(0, current + Number(button.dataset.delta));
    item[button.dataset.field] = Number.isInteger(next) ? String(next) : next.toFixed(1);
    touchRecord(record);
    openRecordSheet(button.dataset.exercise);
    return;
  }

  if (action === "set-feel") {
    const record = ensureRecord(dateKey(appState.selectedDate));
    const item = record.exercises[button.dataset.exercise];
    item.feel = item.feel === button.dataset.feel ? "" : button.dataset.feel;
    touchRecord(record);
    openRecordSheet(button.dataset.exercise);
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
    touchRecord(record);
  }

  if (action === "exercise-note") {
    record.exercises[target.dataset.exercise].note = target.value;
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

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

if (appState.timer) {
  tickTimer();
  ensureTimerTicker();
}
render();
