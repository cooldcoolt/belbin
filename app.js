(function () {
  const BLOCKS = window.BELBIN_BLOCKS || [];
  const ROLE_ORDER = window.BELBIN_ROLE_ORDER || [];

  const intro = document.getElementById("screen-intro");
  const quiz = document.getElementById("screen-quiz");
  const result = document.getElementById("screen-result");
  const btnStart = document.getElementById("btn-start");
  const btnBack = document.getElementById("btn-back");
  const btnNext = document.getElementById("btn-next");
  const btnShareWa = document.getElementById("btn-share-wa");
  const btnCopy = document.getElementById("btn-copy");
  const btnRetry = document.getElementById("btn-retry");
  const blockTitle = document.getElementById("block-title");
  const sumUsedEl = document.getElementById("sum-used");
  const blockError = document.getElementById("block-error");
  const statementsEl = document.getElementById("statements");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  const resultList = document.getElementById("result-list");
  const toast = document.getElementById("toast");

  /** @type {number[][]} */
  let answers = [];
  let blockIndex = 0;

  const roleName = (id) => ROLE_ORDER.find((r) => r.id === id)?.name || id;

  function showScreen(el) {
    [intro, quiz, result].forEach((s) => {
      s.hidden = s !== el;
      s.classList.toggle("active", s === el);
    });
  }

  function parsePoints(inputs) {
    return inputs.map((inp) => {
      const v = parseInt(inp.value, 10);
      return Number.isFinite(v) && v >= 0 ? v : 0;
    });
  }

  /**
   * Правила: сумма 10; не более 4 ненулевых; либо одно утверждение = 10, либо 2–4 утверждения с минимум 2 балла каждому.
   */
  function validateBlock(points) {
    const sum = points.reduce((a, b) => a + b, 0);
    if (sum !== 10) {
      return sum < 10
        ? `Нужно распределить ещё ${10 - sum} балл(а/ов). Сумма по блоку должна быть ровно 10.`
        : `Сумма превышает 10 на ${sum - 10}. Уменьшите баллы.`;
    }
    const nz = points.filter((p) => p > 0);
    const k = nz.length;
    if (k === 0) return "Распределите 10 баллов.";
    if (k === 1) {
      if (nz[0] !== 10) return "Если выбираете одно утверждение — отдайте ему все 10 баллов.";
      return null;
    }
    if (k > 4) return "Баллы можно распределить не более чем между 4 утверждениями.";
    if (nz.some((p) => p < 2)) {
      return "Если отмечаете несколько утверждений, каждому — не меньше 2 баллов.";
    }
    return null;
  }

  function updateSumDisplay(inputs) {
    const pts = parsePoints(inputs);
    const sum = pts.reduce((a, b) => a + b, 0);
    sumUsedEl.textContent = String(sum);
    const err = validateBlock(pts);
    blockError.textContent = err || "";
    blockError.hidden = !err;
    btnNext.disabled = err !== null;
  }

  function renderBlock() {
    const block = BLOCKS[blockIndex];
    const n = BLOCKS.length;
    const pct = ((blockIndex + 1) / n) * 100;
    progressBar.style.setProperty("--p", pct + "%");
    progressText.textContent = `${blockIndex + 1} / ${n}`;
    blockTitle.textContent = block.title;
    btnBack.disabled = blockIndex === 0;

    statementsEl.innerHTML = "";
    const inputs = [];

    block.items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "stmt-row";
      const val = answers[blockIndex] ? answers[blockIndex][i] : 0;
      row.innerHTML = `
        <div class="stmt-meta">
          <span class="stmt-num">${item.num}</span>
          <span class="stmt-role">${roleName(item.role)}</span>
        </div>
        <p class="stmt-text">${item.text}</p>
        <label class="stmt-points">
          <span class="sr-only">Баллы</span>
          <input type="number" inputmode="numeric" min="0" max="10" step="1" value="${val}" aria-label="Баллы для утверждения ${item.num}" />
        </label>
      `;
      const inp = row.querySelector("input");
      inputs.push(inp);
      inp.addEventListener("input", () => updateSumDisplay(inputs));
      statementsEl.appendChild(row);
    });

    if (!answers[blockIndex]) {
      answers[blockIndex] = block.items.map(() => 0);
    } else {
      inputs.forEach((inp, i) => {
        inp.value = String(answers[blockIndex][i]);
      });
    }

    updateSumDisplay(inputs);
    statementsEl._inputs = inputs;
  }

  function saveCurrentBlock() {
    const inputs = statementsEl._inputs;
    if (!inputs) return;
    answers[blockIndex] = parsePoints(inputs);
  }

  function start() {
    answers = BLOCKS.map((b) => b.items.map(() => 0));
    blockIndex = 0;
    showScreen(quiz);
    renderBlock();
  }

  function finish() {
    /** @type {Record<string, number>} */
    const totals = Object.fromEntries(ROLE_ORDER.map((r) => [r.id, 0]));
    BLOCKS.forEach((block, bi) => {
      const pts = answers[bi];
      block.items.forEach((item, j) => {
        totals[item.role] += pts[j] || 0;
      });
    });

    const sorted = ROLE_ORDER.map((r) => ({ id: r.id, name: r.name, score: totals[r.id] || 0 })).sort(
      (a, b) => b.score - a.score || a.name.localeCompare(b.name, "ru")
    );

    resultList.innerHTML = "";
    sorted.forEach((s) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="role">${s.name}</span><span class="pct">${s.score}</span>`;
      resultList.appendChild(li);
    });

    window.__lastResultText = buildShareText(sorted);
    showScreen(result);
  }

  function buildShareText(sorted) {
    const lines = sorted.map((s) => `${s.name}: ${s.score}`);
    const pageUrl = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
    const header = "Мой результат (роли в команде):\n";
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

  async function shareWhatsApp() {
    const text = window.__lastResultText || "";
    if (navigator.share) {
      try {
        const payload = { text };
        if (navigator.canShare && !navigator.canShare(payload)) {
          throw new Error("cannot share");
        }
        await navigator.share(payload);
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(window.__lastResultText || "");
      showToast("Скопировано — вставьте в WhatsApp");
    } catch {
      showToast("Не удалось скопировать");
    }
  }

  btnStart.addEventListener("click", start);

  btnNext.addEventListener("click", () => {
    const inputs = statementsEl._inputs;
    if (!inputs) return;
    const pts = parsePoints(inputs);
    const err = validateBlock(pts);
    if (err) {
      blockError.textContent = err;
      blockError.hidden = false;
      return;
    }
    answers[blockIndex] = pts;
    if (blockIndex + 1 >= BLOCKS.length) {
      finish();
    } else {
      blockIndex += 1;
      renderBlock();
    }
  });

  btnBack.addEventListener("click", () => {
    if (blockIndex <= 0) return;
    saveCurrentBlock();
    blockIndex -= 1;
    renderBlock();
  });

  btnShareWa.addEventListener("click", shareWhatsApp);
  btnCopy.addEventListener("click", copyText);
  btnRetry.addEventListener("click", () => {
    showScreen(intro);
  });
})();
