const searchInput = document.getElementById("searchInput");
const searchForm = document.getElementById("searchForm");
const results = document.getElementById("results");
const count = document.getElementById("count");

let wedges = [];


// =========================================
// 데이터 불러오기
// =========================================

fetch("data/wedge_data.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("데이터 파일을 찾을 수 없습니다.");
    }

    return response.json();
  })
  .then((data) => {
    wedges = data.wedges || [];
  })
  .catch((error) => {
    count.textContent = error.message;
  });


// =========================================
// 검색 버튼 클릭 또는 엔터
// =========================================

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  render();
});


// =========================================
// 검색
// =========================================

function render() {
  const keyword = searchInput.value.trim().toLowerCase();

  if (!keyword) {
    count.textContent = "";
    results.innerHTML = "";
    return;
  }

  const filtered = wedges.filter((wedge) => {
    const wedgeName = String(wedge.name || "").toLowerCase();

    return wedgeName.includes(keyword);
  });

  count.textContent = `${filtered.length}개 항목`;

  if (filtered.length === 0) {
    results.innerHTML = `
      <p class="empty">
        검색 결과가 없습니다.
      </p>
    `;

    return;
  }

  results.innerHTML = filtered
    .map(createCard)
    .join("");
}


// =========================================
// 현재 효과 정리
// =========================================

function cleanCurrentEffect(effect, index) {
  let value = String(effect ?? "");

  if (index === 3) {
    value = value.replace(
      /\s*강화\/증폭 상세 수치\s*▼.*$/s,
      ""
    );
  }

  return value.trim();
}


// =========================================
// 쐐기 카드 만들기
// =========================================

function createCard(wedge) {
  const summary = wedge.summary || {};


  // =========================================
  // 현재 효과
  // =========================================

  const currentEffects = Array.isArray(summary.effects)
    ? summary.effects
        .slice(0, 4)
        .map(cleanCurrentEffect)
        .filter(Boolean)
    : [];

  const effects =
    currentEffects.length > 0
      ? currentEffects
          .map(escapeHtml)
          .join("<br>• ")
      : "효과 정보 없음";


  // =========================================
  // 추가 정보
  // =========================================

  const version = wedge.version?.length
    ? wedge.version.join(", ")
    : "주조 재료 획득";


  // =========================================
  // 등급
  // =========================================

  const rarityClass = getRarityClass(wedge.rarity);


  // =========================================
  // 강화 상세
  // =========================================

  const enhancementList = (wedge.enhancement || [])
    .map((item) => {
      const itemEffects = Array.isArray(item.effects)
        ? item.effects
            .map(escapeHtml)
            .join("<br>")
        : "";

      return `
        <li>

          <strong>
            ${escapeHtml(item.level)} | ${escapeHtml(item.cost)}
          </strong>

          <br>

          ${itemEffects}

        </li>
      `;
    })
    .join("");


  // =========================================
  // 획득처
  // =========================================

  const acquisition = wedge.acquisition || [];

  const materialImages =
    wedge.acquisition_materials || [];


  const acquisitionList = acquisition
    .map((item) => {

      // -----------------------------
      // 주조 재료인지 확인
      // -----------------------------

      const isCastingMaterial =
        String(item).trim() === "주조 재료";


      // -----------------------------
      // 현재 획득처 이름과
      // 연결된 재료 이미지 찾기
      // -----------------------------

      const material = materialImages.find((entry) => {
        return (
          normalizeMaterialName(entry.name) ===
          normalizeMaterialName(item)
        );
      });


      // -----------------------------
      // 주조 재료 위쪽 구분선
      // -----------------------------

      const separatorClass =
        isCastingMaterial
          ? " acquisition-casting-material"
          : "";


      // -----------------------------
      // 재료 이미지가 있는 경우
      // -----------------------------

      const materialClass =
        material
          ? " acquisition-material-item"
          : "";


      const materialImage = material
        ? `
            <img
              class="material-icon"
              src="${escapeHtml(material.image)}"
              alt=""
              aria-hidden="true"
            >
          `
        : "";


      // -----------------------------
      // 획득처 항목
      // -----------------------------

      return `
        <li class="${separatorClass}${materialClass}">

          ${materialImage}

          <span>
            ${escapeHtml(item)}
          </span>

        </li>
      `;
    })
    .join("");


  // =========================================
  // 장착 조건
  // =========================================

  const restriction = wedge.restriction
    ? `
        <span class="restriction">
          ${escapeHtml(wedge.restriction)}
        </span>
      `
    : "";


  // =========================================
  // 카드
  // =========================================

  return `
    <article class="card ${rarityClass}">


      <div class="card-top">


        <img
          class="icon"
          src="${escapeHtml(wedge.image)}"
          alt="${escapeHtml(wedge.name)}"
        >


        <div class="card-info">


          <h2>
            ${escapeHtml(wedge.name)}
          </h2>


          <p class="english">
            ${escapeHtml(wedge.name_en)}
          </p>


          <div class="badge-row">


            <span class="badge">

              <span class="rarity-dot"></span>

              ${escapeHtml(wedge.family)}

            </span>


            ${restriction}


          </div>


        </div>


      </div>


      <h3>
        현재 효과
      </h3>


      <div class="summary">


        <strong>
          ${escapeHtml(summary.level || "")}
          |
          ${escapeHtml(summary.cost || "")}
        </strong>


        <br>


        • ${effects}


      </div>


      <h3>
        획득처
      </h3>


      <ul>

        ${acquisitionList}

      </ul>


      <h3>
        추가 정보
      </h3>


      <p class="muted">
        ${escapeHtml(version)}
      </p>


      <details>


        <summary>
          강화 상세 수치 보기
        </summary>


        <ul>

          ${enhancementList}

        </ul>


      </details>


    </article>
  `;
}


// =========================================
// 주조 재료 이름 비교용 정리
// =========================================

function normalizeMaterialName(value) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim();
}


// =========================================
// 쐐기 등급 → CSS 클래스
// =========================================

function getRarityClass(rarity) {
  const value =
    String(rarity || "").toLowerCase();


  if (
    value.includes("회색") ||
    value.includes("gray") ||
    value.includes("grey")
  ) {
    return "rarity-gray";
  }


  if (
    value.includes("파랑") ||
    value.includes("blue")
  ) {
    return "rarity-blue";
  }


  if (
    value.includes("보라") ||
    value.includes("purple")
  ) {
    return "rarity-purple";
  }


  if (
    value.includes("금") ||
    value.includes("gold")
  ) {
    return "rarity-gold";
  }


  return "rarity-gray";
}


// =========================================
// HTML 특수문자 처리
// =========================================

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}