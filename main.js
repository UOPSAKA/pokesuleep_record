/* ============================================================
   LocalStorage 基本処理
============================================================ */
function saveRecords(records) {
  localStorage.setItem("pokesli_records", JSON.stringify(records));
}

function loadRecords() {
  return JSON.parse(localStorage.getItem("pokesli_records") || "[]");
}

/* ============================================================
   サブスキル選択肢の複製（DOMコピー）
============================================================ */
function copySubskillOptions() {
  const base = document.getElementById("sub1");
  if (!base) return;

  const targets = ["sub2", "sub3", "sub4", "sub5"];

  targets.forEach(id => {
    const target = document.getElementById(id);
    target.innerHTML = "";
    Array.from(base.children).forEach(child => {
      target.appendChild(child.cloneNode(true));
    });
  });
}

/* ============================================================
   記録追加・更新
============================================================ */
function addRecord() {
  const editingIndex = localStorage.getItem("editingIndex");

  const record = {
    date: document.getElementById("dateInput").value,
    name: document.getElementById("nameInput").value,
    level: Number(document.getElementById("levelInput").value),
    friendLevel: Number(document.getElementById("friendLevelInput").value),
    food: document.getElementById("foodInput").value.split(",").map(f => f.trim()),
    subskills: [
      document.getElementById("sub1").value,
      document.getElementById("sub2").value,
      document.getElementById("sub3").value,
      document.getElementById("sub4").value,
      document.getElementById("sub5").value
    ],
    nature: document.getElementById("natureInput").value
  };

  

  const records = loadRecords();

  if (editingIndex !== null) {
    records[editingIndex] = record;
    localStorage.removeItem("editingIndex");
    alert("更新しました！");
  } else {
    records.push(record);
    alert("記録しました！");
  }

  saveRecords(records);
}

/* ============================================================
   編集機能
============================================================ */
function editRecord(index) {
  const records = loadRecords();
  const r = records[index];

  localStorage.setItem("editingIndex", index);
  localStorage.setItem("editingData", JSON.stringify(r));

  window.location.href = "index.html";
}

/* ============================================================
   削除機能
============================================================ */
function deleteRecord(index) {
  const records = loadRecords();
  records.splice(index, 1);
  saveRecords(records);
  displayRecords();
}

/* ============================================================
   記録一覧表示（検索・並び替え対応）
============================================================ */
function displayRecords(records = null) {
  const list = document.getElementById("recordList");
  if (!list) return;

  if (!records) records = loadRecords();

  list.innerHTML = `
    <table class="record-table">
      <thead>
        <tr>
          <th data-key="date">日付</th>
          <th data-key="name">ポケモン名</th>
          <th data-key="level">Lv</th>
          <th data-key="friendLevel">FLv</th>
          <th data-key="food">食材構成</th>
          <th data-key="nature">性格</th>
          <th data-key="sub0">サブ1</th>
          <th data-key="sub1">サブ2</th>
          <th data-key="sub2">サブ3</th>
          <th data-key="sub3">サブ4</th>
          <th data-key="sub4">サブ5</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody id="recordBody"></tbody>
    </table>
  `;

  const tbody = document.getElementById("recordBody");

  records.forEach((r, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.date}</td>
      <td>${r.name}</td>
      <td>${r.level}</td>
      <td>${r.friendLevel}</td>
      <td>${r.food.join(", ")}</td>
      <td>${r.nature}</td>
      <td class="${getSubskillColorClass(r.subskills[0])}">${r.subskills[0] || ""}</td>
      <td class="${getSubskillColorClass(r.subskills[1])}">${r.subskills[1] || ""}</td>
      <td class="${getSubskillColorClass(r.subskills[2])}">${r.subskills[2] || ""}</td>
      <td class="${getSubskillColorClass(r.subskills[3])}">${r.subskills[3] || ""}</td>
      <td class="${getSubskillColorClass(r.subskills[4])}">${r.subskills[4] || ""}</td>

      <td>
        <button onclick="editRecord(${i})">編集</button>
        <button onclick="deleteRecord(${i})">削除</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  setupSorting();
}

/* ============================================================
   検索機能（リアルタイム）
============================================================ */
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.toLowerCase();
    const records = loadRecords();

    const filtered = records.filter(r =>
      r.name.toLowerCase().includes(keyword) ||
      r.food.join(",").toLowerCase().includes(keyword) ||
      r.nature.toLowerCase().includes(keyword) ||
      r.subskills.some(s => s.toLowerCase().includes(keyword))
    );

    displayRecords(filtered);
    updateSearchSummary(filtered);  // ← 集計表示
  });
}


/* ============================================================
   並び替え機能（列クリック）
============================================================ */
let sortState = {};

function setupSorting() {
  const headers = document.querySelectorAll(".record-table th[data-key]");
  headers.forEach(th => {
    th.style.cursor = "pointer";

    th.addEventListener("click", () => {
      const key = th.dataset.key;
      const records = loadRecords();

      sortState[key] = !sortState[key];

      const sorted = records.sort((a, b) => {
        let valA, valB;

        if (key.startsWith("sub")) {
          const idx = Number(key.replace("sub", ""));
          valA = a.subskills[idx] || "";
          valB = b.subskills[idx] || "";
        } else if (key === "food") {
          valA = a.food.join(",");
          valB = b.food.join(",");
        } else {
          valA = a[key];
          valB = b[key];
        }

        if (typeof valA === "number") {
          return sortState[key] ? valA - valB : valB - valA;
        } else {
          return sortState[key]
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
      });

      displayRecords(sorted);
    });
  });
}

/* ============================================================
   index.html 読み込み時：編集モードの値セット
============================================================ */
window.onload = () => {
  copySubskillOptions();

  const addBtn = document.getElementById("addBtn");
  if (addBtn) {
    const editingData = localStorage.getItem("editingData");
    if (editingData) {
      const r = JSON.parse(editingData);

      document.getElementById("dateInput").value = r.date;
      document.getElementById("nameInput").value = r.name;
      document.getElementById("levelInput").value = r.level;
      document.getElementById("friendLevelInput").value = r.friendLevel;
      document.getElementById("foodInput").value = r.food.join(",");
      document.getElementById("natureInput").value = r.nature;

      document.getElementById("sub1").value = r.subskills[0];
      document.getElementById("sub2").value = r.subskills[1];
      document.getElementById("sub3").value = r.subskills[2];
      document.getElementById("sub4").value = r.subskills[3];
      document.getElementById("sub5").value = r.subskills[4];

      addBtn.textContent = "更新する";
      localStorage.removeItem("editingData");
    }

    addBtn.onclick = addRecord;
  }

  displayRecords();
  setupSearch();
  updateSearchSummary(loadRecords());

};


// サブスキル → 色クラス判定
function getSubskillColorClass(skill) {
  if (!skill) return "";

  const gold = [
    "きのみS", "おてつだいボーナス", "睡眠EXPボーナス",
    "スキルレベルアップM", "げんき回復ボーナス",
    "ゆめのかけらボーナス", "リサーチEXPボーナス"
  ];

  const blue = [
    "おてつだいスピードM", "スキル確率アップM", "食材確率アップM",
    "スキルレベルアップS", "最大所持数アップL", "最大所持数アップM"
  ];

  const white = [
    "おてつだいスピードS", "スキル確率アップS", "食材確率アップS",
    "最大所持数アップS"
  ];

  if (gold.includes(skill)) return "sub-gold";
  if (blue.includes(skill)) return "sub-blue";
  if (white.includes(skill)) return "sub-white";

  return "";
}

// サブスキル集計関数
function countSubskills(records) {
  const counter = {};

  records.forEach(r => {
    r.subskills.forEach(skill => {
      if (!skill) return;
      counter[skill] = (counter[skill] || 0) + 1;
    });
  });

  return counter;
}

function updateSearchSummary(records) {
  const box = document.getElementById("searchSummary");
  if (!box) return;

  if (!records || records.length === 0) {
    box.textContent = "検索結果：0件";
    return;
  }

  // 件数
  const count = records.length;

  // サブスキル集計
  const subCounts = countSubskills(records);

  // 表示用テキスト生成
  let text = `検索結果：${count}件`;

  // サブスキルの出現数を追加
  Object.keys(subCounts).forEach(skill => {
    text += ` ｜ ${skill}：${subCounts[skill]}件`;
  });

  box.textContent = text;
}
