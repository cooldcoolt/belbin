(function () {
  const ROLE_IDS = ["plant", "ri", "co", "sh", "me", "tw", "imp", "cf", "sp"];
  const SCALE = [
    { value: 1, label: "Совсем не про меня" },
    { value: 2, label: "Скорее нет" },
    { value: 3, label: "Иногда" },
    { value: 4, label: "Скорее да" },
    { value: 5, label: "Очень про меня" }
  ];

  const intro = document.getElementById("screen-intro");
  const quiz = document.getElementById("screen-quiz");
  const result = document.getElementById("screen-result");
  const btnStart = document.getElementById("btn-start");
  const btnBack = document.getElementById("btn-back");
  const btnShareWa = document.getElementById("btn-share-wa");
  const btnCopy = document.getElementById("btn-copy");
  const btnRetry = document.getElementById("btn-retry");
  const questionText = document.getElementById("question-text");
  const scaleEl = document.getElementById("scale");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const resultList = document.getElementById("result-list");
  const toast = document.getElementById("toast");

  const questions = window.BELBIN_LIKE_QUESTIONS || [];
  const roleLabels = window.BELBIN_ROLE_LABELS || {};

  let order = [];
  let index = 0;
  /** @type {number[]} ответы по позициям в order */
  let answers = [];
  /** @type {Record<string, number>} */
  let sums = {};
  /** @type {Record<string, number>} */
  let counts = {};

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function showScreen(el) {
    [intro, quiz, result].forEach((s) => {
      s.hidden = s !== el;
      s.classList.toggle("active", s === el);
    });
  }

  function resetScores() {
    sums = Object.fromEntries(ROLE_IDS.map((id) => [id, 0]));
    counts = Object.fromEntries(ROLE_IDS.map((id) => [id, 0]));
  }

  function start() {
    order = shuffle(questions.map((_, i) => i));
    index = 0;
    answers = [];
    resetScores();
    showScreen(quiz);
    renderQuestion();
  }

  function renderQuestion() {
    const q = questions[order[index]];
    const n = order.length;
    const pct = ((index + 1) / n) * 100;
    progressBar.style.setProperty("--p", pct + "%");
    progressText.textContent = `${index + 1} / ${n}`;
    questionText.textContent = q.text;
    btnBack.disabled = index === 0;

    scaleEl.innerHTML = "";
    SCALE.forEach((opt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = opt.label;
      b.addEventListener("click", () => answer(q.id, opt.value));
      scaleEl.appendChild(b);
    });
  }

  function answer(roleId, value) {
    const q = questions[order[index]];
    if (answers[index] != null) {
      const prev = answers[index];
      sums[q.id] -= prev;
      counts[q.id] -= 1;
    }
    answers[index] = value;
    sums[roleId] += value;
    counts[roleId] += 1;
    index += 1;
    if (index >= order.length) {
      finish();
    } else {
      renderQuestion();
    }
  }

  function finish() {
    const scores = ROLE_IDS.map((id) => {
      const c = counts[id] || 1;
      const max = c * 5;
      const raw = sums[id] / max;
      return { id, pct: Math.round(raw * 100) };
    }).sort((a, b) => b.pct - a.pct);

    resultList.innerHTML = "";
    scores.forEach((s) => {
      const meta = roleLabels[s.id] || { name: s.id, emoji: "•" };
      const li = document.createElement("li");
      li.innerHTML = `<span class="role">${meta.emoji} ${meta.name}</span><span class="pct">${s.pct}%</span>`;
      resultList.appendChild(li);
    });

    window.__lastResultText = buildShareText(scores);
    showScreen(result);
  }

  function buildShareText(scores) {
    const lines = scores.map((s) => {
      const meta = roleLabels[s.id] || { name: s.id, emoji: "" };
      return `${meta.emoji} ${meta.name}: ${s.pct}%`;
    });
    const pageUrl = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
    const header = "Мой результат (роли в команде, упрощённый опрос):\n";
    const footer = pageUrl ? `\n\nПройти тест: ${pageUrl}` : "";
    return header + lines.join("\n") + footer;
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }

  function shareWhatsApp() {
    const text = window.__lastResultText || "";
    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyText() {
    const text = window.__lastResultText || "";
    try {
      await navigator.clipboard.writeText(text);
      showToast("Скопировано — вставьте в WhatsApp");
    } catch {
      showToast("Не удалось скопировать");
    }
  }

  btnStart.addEventListener("click", start);
  btnBack.addEventListener("click", () => {
    if (index <= 0) return;
    index -= 1;
    const prevQ = questions[order[index]];
    const v = answers[index];
    if (v != null) {
      sums[prevQ.id] -= v;
      counts[prevQ.id] -= 1;
      answers[index] = undefined;
    }
    renderQuestion();
  });

  btnShareWa.addEventListener("click", shareWhatsApp);
  btnCopy.addEventListener("click", copyText);
  btnRetry.addEventListener("click", () => {
    showScreen(intro);
  });
})();
