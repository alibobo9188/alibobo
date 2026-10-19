/* 工作成果展示 —— 交互逻辑 */
(function () {
  "use strict";

  const state = { productId: null, sectionId: null, search: "" };

  const $ = (sel) => document.querySelector(sel);
  const els = {
    tabs: $("#productTabs"),
    hero: $("#hero"),
    productCards: $("#productCards"),
    heroStats: $("#heroStats"),
    browse: $("#browse"),
    sidebarTitle: $("#sidebarTitle"),
    tree: $("#tree"),
    backHome: $("#backHome"),
    contentTitle: $("#contentTitle"),
    contentSub: $("#contentSub"),
    contentMeta: $("#contentMeta"),
    moduleList: $("#moduleList"),
    searchInput: $("#searchInput"),
    searchHint: $("#searchHint"),
    footerCount: $("#footerCount")
  };

  const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const countModules = (product) =>
    product.sections.reduce(
      (sum, s) => sum + s.groups.reduce((a, g) => a + g.modules.length, 0),
      0
    );

  /* ---------- 首页 ---------- */
  function renderHeroStats() {
    const totalSections = PRODUCTS.reduce((a, p) => a + p.sections.length, 0);
    const totalModules = PRODUCTS.reduce((a, p) => a + countModules(p), 0);
    const stats = [
      { num: PRODUCTS.length, lab: "产品体系" },
      { num: totalSections, lab: "功能版块" },
      { num: totalModules, lab: "功能模块" }
    ];
    els.heroStats.innerHTML = stats
      .map((s) => `<div class="stat"><div class="num">${s.num}</div><div class="lab">${s.lab}</div></div>`)
      .join("");
    els.footerCount.textContent = `共 ${PRODUCTS.length} 大产品 · ${totalSections} 版块 · ${totalModules} 模块`;
  }

  function renderProductCards() {
    els.productCards.innerHTML = PRODUCTS.map(
      (p) => `
      <div class="pcard" data-id="${p.id}" style="--c:${p.color}">
        <h3>${p.name}</h3>
        <p>${p.subtitle}</p>
        <div class="pcard-foot">
          <span>${p.sections.length} 大版块 · ${countModules(p)} 个模块</span>
          <span class="arrow">→</span>
        </div>
      </div>`
    ).join("");
    els.productCards.querySelectorAll(".pcard").forEach((card) => {
      card.addEventListener("click", () => selectProduct(card.dataset.id));
    });
  }

  function renderTabs() {
    els.tabs.innerHTML = PRODUCTS.map(
      (p) => `<button data-id="${p.id}">${p.name}</button>`
    ).join("");
    els.tabs.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => selectProduct(b.dataset.id));
    });
  }

  /* ---------- 浏览视图 ---------- */
  function selectProduct(id) {
    state.productId = id;
    state.sectionId = getProduct(id).sections[0].id;
    state.search = "";
    els.searchInput.value = "";
    els.searchHint.textContent = "";

    const p = getProduct(id);
    document.documentElement.style.setProperty("--accent", p.color);
    els.sidebarTitle.textContent = p.name + " · 架构";

    els.tabs.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("active", b.dataset.id === id)
    );

    els.hero.hidden = true;
    els.productCards.hidden = true;
    els.browse.hidden = false;

    renderTree(p);
    renderContent(p, p.sections[0]);
    els.browse.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function backHome() {
    state.productId = null;
    state.sectionId = null;
    els.tabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    els.hero.hidden = false;
    els.productCards.hidden = false;
    els.browse.hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function stripLeadingLetter(name) {
    return name.replace(/^[A-Z]\s+/, "");
  }
  function groupLetter(gi) {
    return String.fromCharCode(97 + gi);
  }

  function renderTree(product) {
    const html = product.sections
      .map((s) => {
        const cnt = s.groups.reduce((a, g) => a + g.modules.length, 0);
        const groupsHtml = s.groups
          .map((g, gi) => {
            const letter = groupLetter(gi);
            const gName = g.name
              ? `<div class="t-group-name">${letter}). ${stripLeadingLetter(g.name)}</div>`
              : "";
            const mods = g.modules
              .map(
                (m, i) =>
                  `<div class="t-module" data-section="${s.id}" data-module="${encodeURIComponent(
                    m.name
                  )}"><span class="t-midx">◐${i + 1}</span>${m.name}</div>`
              )
              .join("");
            return `${gName}<div class="t-group">${mods}</div>`;
          })
          .join("");
        return `
        <div class="t-section" data-section="${s.id}">
          <div class="t-section-head">
            <span class="t-code">${s.id}</span>
            <span class="t-name">${s.name}</span>
            <span class="t-count">${cnt}</span>
          </div>
          ${groupsHtml}
        </div>`;
      })
      .join("");
    els.tree.innerHTML = html;

    els.tree.querySelectorAll(".t-section-head").forEach((h) => {
      h.addEventListener("click", () => {
        const id = h.parentElement.dataset.section;
        const sec = product.sections.find((s) => s.id === id);
        state.sectionId = id;
        state.search = "";
        els.searchInput.value = "";
        els.searchHint.textContent = "";
        renderContent(product, sec);
        highlightTree();
      });
    });
    els.tree.querySelectorAll(".t-module").forEach((m) => {
      m.addEventListener("click", (e) => {
        e.stopPropagation();
        const sec = product.sections.find((s) => s.id === m.dataset.section);
        state.sectionId = sec.id;
        state.search = "";
        els.searchInput.value = "";
        renderContent(product, sec);
        highlightTree();
        const target = els.moduleList.querySelector(
          `[data-mod="${m.dataset.module}"]`
        );
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function highlightTree() {
    els.tree.querySelectorAll(".t-section").forEach((el) => {
      el.classList.toggle("active", el.dataset.section === state.sectionId);
    });
  }

  function renderContent(product, section) {
    state.sectionId = section.id;
    highlightTree();

    const total = section.groups.reduce((a, g) => a + g.modules.length, 0);
    els.contentTitle.textContent = `${section.id} · ${section.name}`;
    els.contentSub.textContent = product.name;
    els.contentMeta.innerHTML = `<b>${total}</b>个功能模块`;

    const groupsHtml = section.groups
      .map((g, gi) => {
        const title = g.name
          ? `<div class="module-group-title">${groupLetter(gi)}). ${stripLeadingLetter(g.name)}</div>`
          : "";
        const cards = g.modules
          .map((m, i) => moduleCard(m, gi, i))
          .join("");
        return `<div class="module-group">${title}<div class="module-grid">${cards}</div></div>`;
      })
      .join("");

    els.moduleList.innerHTML =
      groupsHtml ||
      `<div class="empty-search">该版块暂无模块数据</div>`;
  }

  function renderLinks(m) {
    if (!Array.isArray(m.links) || !m.links.length) return "";
    const items = m.links
      .map(
        (l) =>
          `<a class="mlink" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.text}</a>`
      )
      .join("");
    return `<div class="mlinks">${items}</div>`;
  }

  function linkFlags(m) {
    const texts = (Array.isArray(m.links) ? m.links : []).map((l) => l.text);
    return {
      hasParams:
        (Array.isArray(m.params) && m.params.length > 0) ||
        texts.some((t) => t.includes("功能参数")),
      hasPrd: !!m.prd || texts.some((t) => t.includes("PRD"))
    };
  }

  function moduleCard(m, gi, i) {
    const { hasParams, hasPrd } = linkFlags(m);
    const tags = `
      <div class="mtags">
        <span class="tag ${hasParams ? "filled" : "empty"}">功能参数 ${hasParams ? "✓" : "待补充"}</span>
        <span class="tag ${hasPrd ? "filled" : "empty"}">PRD ${hasPrd ? "✓" : "待补充"}</span>
      </div>`;
    const points = m.points
      ? `<p class="mpoints">${m.points}</p>`
      : `<p class="mpoints" style="opacity:.6">（功能要点待补充）</p>`;
    const idx = `◐${i + 1}`;
    return `
      <div class="mcard" data-mod="${encodeURIComponent(m.name)}">
        <h4><span class="mindex">${idx}</span>${m.name}</h4>
        ${points}
        ${renderLinks(m)}
        ${tags}
      </div>`;
  }

  /* ---------- 搜索 ---------- */
  function doSearch(q) {
    state.search = q.trim();
    if (!state.productId) return;
    const product = getProduct(state.productId);

    if (!state.search) {
      const sec = product.sections.find((s) => s.id === state.sectionId) || product.sections[0];
      renderContent(product, sec);
      els.searchHint.textContent = "";
      return;
    }

    const matches = [];
    product.sections.forEach((s) => {
      s.groups.forEach((g) => {
        g.modules.forEach((m) => {
          const hay = (m.name + " " + (m.points || "")).toLowerCase();
          if (hay.includes(state.search.toLowerCase())) {
            matches.push({ section: s, module: m });
          }
        });
      });
    });

    els.searchHint.textContent = `命中 ${matches.length}`;
    els.contentTitle.textContent = `搜索：“${state.search}”`;
    els.contentSub.textContent = product.name;
    els.contentMeta.innerHTML = `<b>${matches.length}</b>个匹配模块`;

    if (!matches.length) {
      els.moduleList.innerHTML = `<div class="empty-search">未找到匹配“${state.search}”的模块</div>`;
      return;
    }

    els.moduleList.innerHTML = `<div class="module-group"><div class="module-grid">${matches
      .map(
        ({ section, module }) => `
        <div class="mcard">
          <h4><span class="mindex">${section.id}</span>${module.name}</h4>
          <p class="mpoints">${module.points || "（功能要点待补充）"}</p>
          ${renderLinks(module)}
          <div class="mtags">
            <span class="tag ${linkFlags(module).hasParams ? "filled" : "empty"}">功能参数 ${linkFlags(module).hasParams ? "✓" : "待补充"}</span>
            <span class="tag ${linkFlags(module).hasPrd ? "filled" : "empty"}">PRD ${linkFlags(module).hasPrd ? "✓" : "待补充"}</span>
          </div>
          <p class="mpoints" style="margin-top:8px;opacity:.7">所属：${section.name}</p>
        </div>`
      )
      .join("")}</div></div>`;
  }

  /* ---------- 初始化 ---------- */
  function init() {
    renderTabs();
    renderHeroStats();
    renderProductCards();
    els.backHome.addEventListener("click", backHome);
    els.searchInput.addEventListener("input", (e) => doSearch(e.target.value));
  }

  init();
})();
