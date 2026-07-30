const STORAGE_KEY = "training-checkin-v1";

const PLAN = (window.TRAINING_PLAN = [
  {
    day: "周一",
    title: "全身A + 20分钟有氧",
    focus: "大肌群优先，动作稳定后再加重量",
    tags: ["全身A", "爬坡20分钟"],
    exercises: [
      {
        id: "leg-press",
        name: "坐姿腿举",
        sets: 3,
        target: "8-12次",
        note: "脚掌踩稳，膝盖跟脚尖方向一致，保留2次余力。",
        type: "strength",
      },
      {
        id: "chest-press",
        name: "坐姿推胸器",
        sets: 3,
        target: "8-12次",
        note: "肩胛稳定，推起时不要耸肩。",
        type: "strength",
      },
      {
        id: "lat-pulldown",
        name: "高位下拉",
        sets: 3,
        target: "8-12次",
        note: "先沉肩，再用背把把手拉到胸前。",
        type: "strength",
      },
      {
        id: "leg-curl",
        name: "坐姿腿弯举",
        sets: 2,
        target: "10-15次",
        note: "顶峰收缩停一下，离心慢放。",
        type: "strength",
      },
      {
        id: "seated-row",
        name: "坐姿划船",
        sets: 2,
        target: "10-12次",
        note: "挺胸收肩胛，避免身体大幅后仰。",
        type: "strength",
      },
      {
        id: "lateral-raise",
        name: "侧平举",
        sets: 2,
        target: "12-15次",
        note: "手肘微弯，重量宁轻不甩。",
        type: "strength",
      },
      {
        id: "crunch",
        name: "卷腹",
        sets: 2,
        target: "12-15次",
        note: "腹部发力卷起，不用脖子硬拉。",
        type: "core",
      },
      {
        id: "cardio-20",
        name: "爬坡或单车",
        sets: 1,
        target: "20分钟",
        note: "力量后做，腿部疲劳时降低坡度或强度。",
        type: "cardio",
      },
    ],
  },
  {
    day: "周二",
    title: "肩手臂核心 + 30分钟有氧",
    focus: "轻中等强度，给周三主训练留恢复",
    tags: ["肩手臂", "核心", "有氧30分钟"],
    exercises: [
      {
        id: "machine-lateral-raise",
        name: "器械侧平举",
        sets: 3,
        target: "12-15次",
        note: "动作慢一点，不用冲重量。",
        type: "strength",
      },
      {
        id: "reverse-fly",
        name: "反向飞鸟",
        sets: 3,
        target: "12-15次",
        note: "肩后束发力，手臂只做连接。",
        type: "strength",
      },
      {
        id: "triceps-pushdown",
        name: "绳索下压",
        sets: 3,
        target: "10-15次",
        note: "肘部固定在身体两侧。",
        type: "strength",
      },
      {
        id: "biceps-curl",
        name: "二头弯举",
        sets: 3,
        target: "10-15次",
        note: "不甩腰，顶峰收紧。",
        type: "strength",
      },
      {
        id: "crunch-plus",
        name: "卷腹",
        sets: 3,
        target: "12-15次",
        note: "保持呼吸，收紧腹部。",
        type: "core",
      },
      {
        id: "plank",
        name: "平板支撑",
        sets: 2,
        target: "30-60秒",
        note: "骨盆不要塌，能稳住比撑更久重要。",
        type: "core",
      },
      {
        id: "cardio-30-a",
        name: "爬坡或单车",
        sets: 1,
        target: "25-30分钟",
        note: "保持能说短句的强度。",
        type: "cardio",
      },
    ],
  },
  {
    day: "周三",
    title: "全身B + 20分钟有氧",
    focus: "腿、上斜推、划船和臀部主训练",
    tags: ["全身B", "短有氧"],
    exercises: [
      {
        id: "hack-squat",
        name: "哈克深蹲或腿举",
        sets: 3,
        target: "8-12次",
        note: "动作幅度稳定，膝盖路线一致。",
        type: "strength",
      },
      {
        id: "incline-press",
        name: "上斜推胸器",
        sets: 3,
        target: "8-12次",
        note: "上胸发力，肩膀不要前顶。",
        type: "strength",
      },
      {
        id: "chest-supported-row",
        name: "胸托划船器",
        sets: 3,
        target: "8-12次",
        note: "胸贴稳，拉到肘部过身体。",
        type: "strength",
      },
      {
        id: "hip-thrust",
        name: "臀推器械",
        sets: 3,
        target: "8-12次",
        note: "顶峰收臀，不用腰顶。",
        type: "strength",
      },
      {
        id: "neutral-pulldown",
        name: "中立握高位下拉",
        sets: 2,
        target: "10-12次",
        note: "肩胛先下沉，保持身体稳定。",
        type: "strength",
      },
      {
        id: "reverse-fly-b",
        name: "反向飞鸟",
        sets: 2,
        target: "12-15次",
        note: "动作干净，不要借力。",
        type: "strength",
      },
      {
        id: "crunch-b",
        name: "卷腹",
        sets: 2,
        target: "12-15次",
        note: "腹部卷起，慢放。",
        type: "core",
      },
      {
        id: "cardio-short-b",
        name: "轻中等强度有氧",
        sets: 1,
        target: "15-20分钟",
        note: "腿很累就轻松走，不硬撑15级坡。",
        type: "cardio",
      },
    ],
  },
  {
    day: "周四",
    title: "动作练习 + 小肌群 + 30分钟有氧",
    focus: "练轨迹和发力，不追重量",
    tags: ["动作练习", "小肌群", "有氧30分钟"],
    exercises: [
      {
        id: "light-pulldown",
        name: "轻重量高位下拉",
        sets: 2,
        target: "12-15次",
        note: "保留4次余力，专注背部发力。",
        type: "technique",
      },
      {
        id: "light-row",
        name: "轻重量坐姿划船",
        sets: 2,
        target: "12-15次",
        note: "记录座椅档位和胸部位置。",
        type: "technique",
      },
      {
        id: "light-chest-press",
        name: "轻重量推胸器",
        sets: 2,
        target: "12-15次",
        note: "用轻重量找稳定轨迹。",
        type: "technique",
      },
      {
        id: "hip-abduction",
        name: "髋外展器",
        sets: 3,
        target: "12-20次",
        note: "髋部发力，不用身体摆动。",
        type: "strength",
      },
      {
        id: "calf-raise",
        name: "小腿提踵",
        sets: 3,
        target: "12-20次",
        note: "顶峰停一下，底部充分拉伸。",
        type: "strength",
      },
      {
        id: "core-choice",
        name: "核心训练",
        sets: 3,
        target: "10-15次",
        note: "卷腹、死虫或平板支撑三选一。",
        type: "core",
      },
      {
        id: "cardio-30-b",
        name: "爬坡或单车",
        sets: 1,
        target: "25-30分钟",
        note: "保持稳定心率，不冲刺。",
        type: "cardio",
      },
    ],
  },
  {
    day: "周五",
    title: "全身A + 20分钟有氧",
    focus: "重复A计划，状态好再小幅进步",
    tags: ["全身A", "爬坡20分钟"],
    exercises: [
      {
        id: "leg-press",
        name: "坐姿腿举",
        sets: 3,
        target: "8-12次",
        note: "脚掌踩稳，膝盖跟脚尖方向一致，保留2次余力。",
        type: "strength",
      },
      {
        id: "chest-press",
        name: "坐姿推胸器",
        sets: 3,
        target: "8-12次",
        note: "肩胛稳定，推起时不要耸肩。",
        type: "strength",
      },
      {
        id: "lat-pulldown",
        name: "高位下拉",
        sets: 3,
        target: "8-12次",
        note: "先沉肩，再用背把把手拉到胸前。",
        type: "strength",
      },
      {
        id: "leg-curl",
        name: "坐姿腿弯举",
        sets: 2,
        target: "10-15次",
        note: "顶峰收缩停一下，离心慢放。",
        type: "strength",
      },
      {
        id: "seated-row",
        name: "坐姿划船",
        sets: 2,
        target: "10-12次",
        note: "挺胸收肩胛，避免身体大幅后仰。",
        type: "strength",
      },
      {
        id: "lateral-raise",
        name: "侧平举",
        sets: 2,
        target: "12-15次",
        note: "手肘微弯，重量宁轻不甩。",
        type: "strength",
      },
      {
        id: "crunch",
        name: "卷腹",
        sets: 2,
        target: "12-15次",
        note: "腹部发力卷起，不用脖子硬拉。",
        type: "core",
      },
      {
        id: "cardio-20",
        name: "爬坡或单车",
        sets: 1,
        target: "20分钟",
        note: "力量后做，腿部疲劳时降低坡度或强度。",
        type: "cardio",
      },
    ],
  },
  {
    day: "周六",
    title: "可选轻松游泳",
    focus: "恢复优先，游完不影响下周训练",
    tags: ["可选", "蛙泳500米"],
    exercises: [
      {
        id: "easy-swim",
        name: "轻松蛙泳",
        sets: 1,
        target: "500米左右",
        note: "下班去也可以，明显疲劳就改成休息。",
        type: "cardio",
      },
      {
        id: "mobility",
        name: "拉伸放松",
        sets: 1,
        target: "10-15分钟",
        note: "肩、背、髋和腿后侧为主。",
        type: "recovery",
      },
    ],
  },
  {
    day: "周日",
    title: "休息",
    focus: "睡眠、饮食和恢复",
    tags: ["休息"],
    exercises: [
      {
        id: "rest-day",
        name: "休息完成",
        sets: 1,
        target: "今天休息",
        note: "可以轻松散步，不做正式训练。",
        type: "recovery",
      },
    ],
  },
]);

if (!window.APP_V3) {
const state = {
  store: loadStore(),
  activeView: "today",
  selectedDate: startOfDay(new Date()),
  openRecords: new Set(),
  lastChangedSet: "",
};

const el = {
  weekLabel: document.querySelector("#weekLabel"),
  selectedDateLabel: document.querySelector("#selectedDateLabel"),
  dayTitle: document.querySelector("#dayTitle"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  dayStrip: document.querySelector("#dayStrip"),
  planMeta: document.querySelector("#planMeta"),
  exerciseList: document.querySelector("#exerciseList"),
  dailyNote: document.querySelector("#dailyNote"),
  weekPlanList: document.querySelector("#weekPlanList"),
  historyList: document.querySelector("#historyList"),
  todayView: document.querySelector("#todayView"),
  weekView: document.querySelector("#weekView"),
  historyView: document.querySelector("#historyView"),
  installBtn: document.querySelector("#installBtn"),
  progressPanel: document.querySelector("#progressPanel"),
  toast: document.querySelector("#toast"),
};

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { records: {} };
  } catch {
    return { records: {} };
  }
}

function saveStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date) {
  const copy = startOfDay(date);
  const mondayOffset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
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
  return PLAN[planIndexForDate(state.selectedDate)];
}

function ensureRecord(key, plan = selectedPlan()) {
  if (!state.store.records[key]) {
    state.store.records[key] = {
      date: key,
      updatedAt: "",
      exercises: {},
      dailyNote: "",
    };
  }
  const record = state.store.records[key];
  plan.exercises.forEach((exercise) => {
    if (!record.exercises[exercise.id]) {
      record.exercises[exercise.id] = {
        sets: [],
        feel: "",
        note: "",
      };
    }
    const item = record.exercises[exercise.id];
    for (let index = 0; index < exercise.sets; index += 1) {
      if (!item.sets[index]) {
        item.sets[index] = { done: false, weight: "", reps: "" };
      }
    }
    item.sets = item.sets.slice(0, exercise.sets);
    if (item.quickWeight === undefined) {
      item.quickWeight = item.sets.find((set) => set.weight)?.weight || "";
    }
    if (item.quickReps === undefined) {
      const reps = item.sets.map((set) => set.reps).filter(Boolean);
      item.quickReps = reps.length > 1 ? reps.join("/") : reps[0] || "";
    }
  });
  return record;
}

function touchRecord(record) {
  record.updatedAt = new Date().toISOString();
  saveStore();
}

function getProgress(plan, record) {
  const total = plan.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const complete = plan.exercises.reduce((sum, exercise) => {
    const item = record.exercises[exercise.id];
    return sum + (item?.sets || []).filter((set) => set.done).length;
  }, 0);
  const percent = total ? Math.round((complete / total) * 100) : 0;
  return { total, complete, percent };
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

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function typeLabel(type) {
  const labels = {
    strength: "力量",
    core: "核心",
    cardio: "有氧",
    recovery: "恢复",
    technique: "动作",
  };
  return labels[type] || "训练";
}

function metricLabels(exercise) {
  if (exercise.type === "cardio") return ["时长/距离", "强度"];
  if (exercise.id.includes("plank")) return ["时长", "完成秒数"];
  if (exercise.type === "recovery") return ["时长", "感受"];
  return ["重量kg", "实际次数"];
}

function render() {
  const key = dateKey(state.selectedDate);
  const plan = selectedPlan();
  const record = ensureRecord(key, plan);
  const progress = getProgress(plan, record);
  const todayKey = dateKey(new Date());
  const weekStart = startOfWeek(state.selectedDate);
  const weekEnd = addDays(weekStart, 6);

  el.weekLabel.textContent = `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`;
  el.selectedDateLabel.textContent =
    key === todayKey ? `今天 · ${formatFullDate(state.selectedDate)}` : formatFullDate(state.selectedDate);
  el.dayTitle.textContent = `${plan.day} · ${plan.title}`;
  el.progressText.textContent = `${progress.complete} / ${progress.total} · ${progress.percent}%`;
  el.progressFill.style.width = `${progress.percent}%`;

  renderDayStrip();
  renderViews(plan, record);
  updateNav();
}

function renderDayStrip() {
  const weekStart = startOfWeek(state.selectedDate);
  const selectedKey = dateKey(state.selectedDate);
  const todayKey = dateKey(new Date());

  el.dayStrip.innerHTML = PLAN.map((plan, index) => {
    const dayDate = addDays(weekStart, index);
    const key = dateKey(dayDate);
    const activeClass = key === selectedKey ? " active" : "";
    const todayClass = key === todayKey ? " today" : "";
    return `
      <button class="day-button${activeClass}${todayClass}" type="button" data-action="select-date" data-date="${key}">
        ${plan.day.replace("周", "")}
        <span>${dayDate.getDate()}</span>
      </button>
    `;
  }).join("");
}

function renderViews(plan, record) {
  const showToday = state.activeView === "today";
  const showWeek = state.activeView === "week";
  const showHistory = state.activeView === "history";

  el.todayView.hidden = !showToday;
  el.weekView.hidden = !showWeek;
  el.historyView.hidden = !showHistory;

  if (showToday) {
    renderPlanMeta(plan);
    renderExercises(plan, record);
    el.dailyNote.value = record.dailyNote || "";
  }
  if (showWeek) renderWeekPlan();
  if (showHistory) renderHistory();
}

function renderPlanMeta(plan) {
  el.planMeta.innerHTML = `
    <div>
      <h2>${escapeHtml(plan.title)}</h2>
      <p class="exercise-note">${escapeHtml(plan.focus)}</p>
    </div>
    <div class="meta-line">
      ${plan.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
    </div>
  `;
}

function renderExercises(plan, record) {
  el.exerciseList.innerHTML = plan.exercises
    .map((exercise, index) => renderExerciseCard(exercise, record, index))
    .join("");
}

function renderExerciseCard(exercise, record, index) {
  const item = record.exercises[exercise.id] || { sets: [], feel: "", note: "" };
  const progress = getExerciseProgress(exercise, record);
  const [metricA, metricB] = metricLabels(exercise);
  const typeClass = exercise.type === "cardio" ? " cardio" : exercise.type === "recovery" ? " recovery" : "";
  const feelOptions = ["轻松", "刚好", "吃力"];
  const recordKey = `${dateKey(state.selectedDate)}:${exercise.id}`;
  const isOpen = state.openRecords.has(recordKey);
  const summaryParts = [item.quickWeight, item.quickReps, item.feel].filter(Boolean);

  return `
    <article class="exercise-card${progress.isComplete ? " complete" : ""}" style="--delay: ${index * 26}ms">
      <header class="exercise-header">
        <div>
          <span class="type-pill${typeClass}">${typeLabel(exercise.type)}</span>
          <h3>${escapeHtml(exercise.name)}</h3>
          <p class="exercise-subtitle">${exercise.sets}组 · ${escapeHtml(exercise.target)}</p>
        </div>
        <span class="status-chip">${progress.complete}/${progress.total}</span>
      </header>
      <p class="exercise-note">${escapeHtml(exercise.note)}</p>
      <div class="set-list">
        ${Array.from({ length: exercise.sets }, (_, index) => {
          const set = item.sets[index] || { done: false, weight: "", reps: "" };
          const setKey = `${recordKey}:${index}`;
          return `
            <button
              class="set-pill${set.done ? " done" : ""}${state.lastChangedSet === setKey ? " just-done" : ""}"
              type="button"
              data-action="toggle-set"
              data-exercise="${exercise.id}"
              data-set="${index}"
              aria-pressed="${set.done ? "true" : "false"}"
              aria-label="${exercise.name}第${index + 1}组"
            >
              ${set.done ? "✓" : `第${index + 1}组`}
            </button>
          `;
        }).join("")}
      </div>
      ${summaryParts.length ? `<p class="record-summary">记录：${summaryParts.map(escapeHtml).join(" · ")}</p>` : ""}
      <div class="card-actions">
        <button class="quiet-button" type="button" data-action="toggle-record-panel" data-exercise="${exercise.id}">
          ${isOpen ? "收起记录" : "记重量/次数"}
        </button>
        <button class="finish-button${progress.isComplete ? " complete" : ""}" type="button" data-action="toggle-exercise" data-exercise="${exercise.id}">
          ${progress.isComplete ? "已完成" : "全部完成"}
        </button>
      </div>
      <div class="record-panel${isOpen ? "" : " collapsed"}">
        <div class="quick-fields">
          <label class="field">
            <span>${metricA}</span>
            <input
              inputmode="decimal"
              autocomplete="off"
              data-action="quick-value"
              data-field="quickWeight"
              data-exercise="${exercise.id}"
              value="${escapeHtml(item.quickWeight || "")}"
              placeholder="-"
            />
          </label>
          <label class="field">
            <span>${metricB}</span>
            <input
              inputmode="decimal"
              autocomplete="off"
              data-action="quick-value"
              data-field="quickReps"
              data-exercise="${exercise.id}"
              value="${escapeHtml(item.quickReps || "")}"
              placeholder="${escapeHtml(exercise.target)}"
            />
          </label>
        </div>
        <div class="feel-row">
          ${feelOptions
            .map(
              (feel) => `
                <button
                  class="feel-button${item.feel === feel ? " active" : ""}"
                  type="button"
                  data-action="set-feel"
                  data-exercise="${exercise.id}"
                  data-feel="${feel}"
                >
                  ${feel}
                </button>
              `,
            )
            .join("")}
        </div>
        <label class="exercise-log">
          <span>补充备注</span>
          <textarea
            rows="2"
            data-action="exercise-note"
            data-exercise="${exercise.id}"
            placeholder="器械档位、发力感、哪里不舒服"
          >${escapeHtml(item.note)}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderWeekPlan() {
  el.weekPlanList.innerHTML = PLAN.map((day) => {
    const totalSets = day.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    return `
      <article class="week-day-card">
        <header>
          <div>
            <h3>${day.day} · ${escapeHtml(day.title)}</h3>
            <p class="exercise-note">${escapeHtml(day.focus)}</p>
          </div>
          <span class="status-chip">${totalSets}组</span>
        </header>
        <div class="meta-line">
          ${day.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        <ul>
          ${day.exercises
            .map(
              (exercise) => `
                <li>
                  <strong>${escapeHtml(exercise.name)}</strong>
                  <span class="week-exercise-line"> · ${exercise.sets}组 · ${escapeHtml(exercise.target)}</span>
                </li>
              `,
            )
            .join("")}
        </ul>
      </article>
    `;
  }).join("");
}

function renderHistory() {
  const records = Object.values(state.store.records)
    .filter(hasRecordContent)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!records.length) {
    el.historyList.innerHTML = `
      <div class="empty-state">
        <strong>还没有历史记录</strong>
        <span>完成一次打卡后会出现在这里。</span>
      </div>
    `;
    return;
  }

  el.historyList.innerHTML = records
    .map((record) => {
      const date = parseDateKey(record.date);
      const plan = PLAN[planIndexForDate(date)];
      ensureRecord(record.date, plan);
      const progress = getProgress(plan, record);
      const doneNames = plan.exercises
        .filter((exercise) => getExerciseProgress(exercise, record).isComplete)
        .map((exercise) => exercise.name);
      const note = record.dailyNote ? escapeHtml(record.dailyNote) : "没有当天感受";
      return `
        <article class="history-card">
          <header>
            <div>
              <h3>${formatFullDate(date)}</h3>
              <p>${plan.day} · ${escapeHtml(plan.title)}</p>
            </div>
            <span class="status-chip">${progress.percent}%</span>
          </header>
          <p>${doneNames.length ? doneNames.map(escapeHtml).join("、") : "尚未完成整项动作"}</p>
          <p>${note}</p>
          <button class="history-open" type="button" data-action="open-record" data-date="${record.date}">
            查看这天
          </button>
        </article>
      `;
    })
    .join("");
}

function hasRecordContent(record) {
  if (record.dailyNote?.trim()) return true;
  return Object.values(record.exercises || {}).some((item) => {
    if (item.feel || item.note?.trim()) return true;
    return (item.sets || []).some((set) => set.done || set.weight || set.reps);
  });
}

function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function updateNav() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
}

function selectDateFromKey(key) {
  state.selectedDate = parseDateKey(key);
  state.activeView = "today";
  render();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const view = button.dataset.view;
  const key = dateKey(state.selectedDate);
  const record = ensureRecord(key);

  if (view) {
    state.activeView = view;
    render();
    return;
  }

  if (action === "prev-week") {
    state.selectedDate = addDays(state.selectedDate, -7);
    render();
    return;
  }

  if (action === "next-week") {
    state.selectedDate = addDays(state.selectedDate, 7);
    render();
    return;
  }

  if (action === "select-date" || action === "open-record") {
    selectDateFromKey(button.dataset.date);
    return;
  }

  if (action === "toggle-set") {
    const item = record.exercises[button.dataset.exercise];
    const set = item.sets[Number(button.dataset.set)];
    set.done = !set.done;
    state.lastChangedSet = `${key}:${button.dataset.exercise}:${button.dataset.set}`;
    touchRecord(record);
    pulseProgress();
    if (getExerciseProgress(selectedPlan().exercises.find((exercise) => exercise.id === button.dataset.exercise), record).isComplete) {
      showToast("这一项完成了");
    }
    render();
    return;
  }

  if (action === "toggle-exercise") {
    const item = record.exercises[button.dataset.exercise];
    const planExercise = selectedPlan().exercises.find((exercise) => exercise.id === button.dataset.exercise);
    const shouldComplete = !getExerciseProgress(planExercise, record).isComplete;
    item.sets.forEach((set) => {
      set.done = shouldComplete;
    });
    state.lastChangedSet = "";
    touchRecord(record);
    pulseProgress();
    showToast(shouldComplete ? "已全部完成" : "已取消完成");
    render();
    return;
  }

  if (action === "toggle-record-panel") {
    const recordKey = `${key}:${button.dataset.exercise}`;
    if (state.openRecords.has(recordKey)) {
      state.openRecords.delete(recordKey);
    } else {
      state.openRecords.add(recordKey);
    }
    render();
    return;
  }

  if (action === "set-feel") {
    const item = record.exercises[button.dataset.exercise];
    item.feel = item.feel === button.dataset.feel ? "" : button.dataset.feel;
    touchRecord(record);
    render();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;
  const action = target.dataset.action;
  if (!action) return;

  const key = dateKey(state.selectedDate);
  const record = ensureRecord(key);

  if (action === "set-value") {
    const item = record.exercises[target.dataset.exercise];
    const set = item.sets[Number(target.dataset.set)];
    set[target.dataset.field] = target.value;
    touchRecord(record);
  }

  if (action === "quick-value") {
    const item = record.exercises[target.dataset.exercise];
    item[target.dataset.field] = target.value;
    touchRecord(record);
  }

  if (action === "exercise-note") {
    record.exercises[target.dataset.exercise].note = target.value;
    touchRecord(record);
  }
});

el.dailyNote.addEventListener("input", () => {
  const record = ensureRecord(dateKey(state.selectedDate));
  record.dailyNote = el.dailyNote.value;
  touchRecord(record);
});

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  el.installBtn.hidden = false;
});

el.installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  el.installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

render();

function pulseProgress() {
  el.progressFill.classList.remove("pulse");
  requestAnimationFrame(() => {
    el.progressFill.classList.add("pulse");
  });
}

let toastTimer = null;

function showToast(message) {
  clearTimeout(toastTimer);
  el.toast.textContent = message;
  el.toast.classList.add("show");
  toastTimer = setTimeout(() => {
    el.toast.classList.remove("show");
  }, 1300);
}
}
