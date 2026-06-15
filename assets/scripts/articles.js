/* global config, Alpine, Typed, swal, md, getWebsiteConfig */

// 初始化 Alpine
document.addEventListener("alpine:init", () => {
    Alpine.data("getWebsiteConfig", config);
});

document.addEventListener("DOMContentLoaded", async () => {
    // 获取 DOM 元素
    var element = {
        pageHead: document.querySelector(".page-head"),
        leftArea: document.querySelector(".primary-container > .left-area"),
        socialIcons: document.querySelector(".social-icons"),
        icpInfo: document.querySelector(".icp-info"),
        webmasterInfo: document.querySelector(".webmaster-info"),
        articleCards: document.getElementById("article-cards"),
        articleLoading: document.getElementById("article-loading"),
        articleCount: document.getElementById("article-count"),
        articleList: document.getElementById("article-list"),
        articleDetail: document.getElementById("article-detail"),
        articleDetailContent: document.getElementById("article-detail-content"),
    };

    // 设置网站标题
    document.title = "文章 - " + config.content.title;

    // 输出控制台欢迎消息
    console.log("%c文章页%c - " + config.content.title, "padding: 5px; border-radius: 6px 0 0 6px; background-color: #1e88a8; color: #ffffff;", "padding: 5px; border-radius: 0 6px 6px 0; background-color: #b5495b; color: #ffffff;");

    // 加载页首打字标题
    if (typeof Typed !== "undefined") {
        new Typed(".page-head > .title", {
            strings: config.content.pageHead.typedContent,
            startDelay: 300,
            backDelay: 1000,
            typeSpeed: 100,
            backSpeed: 50,
            showCursor: true,
            loop: false,
        });
    }

    // 渲染社交链接
    const socialIconLinks = config.content.masterInfo.socialLink.enable
        .map(key => {
            const icon = config.content.masterInfo.socialLink.icon[key];
            const link = config.content.masterInfo.socialLink.link[key];
            return icon && link ? `<a href="${link}" target="_blank"><i class="${icon}"></i></a>` : "";
        })
        .filter(Boolean);
    element.socialIcons.innerHTML = socialIconLinks.join("");

    // 获取 Hitokoto 一言
    fetch("https://v1.hitokoto.cn")
        .then(response => response.json())
        .then(data => {
            const hitokoto = document.querySelector("#hitokoto-text");
            if (hitokoto) {
                hitokoto.href = `https://hitokoto.cn/?uuid=${data.uuid}`;
                hitokoto.innerText = data.hitokoto;
            }
        })
        .catch(console.error);

    // 页脚 ICP 信息
    const icpInfoLinks = config.content.icp.enable
        .map(key => {
            const code = config.content.icp.info.code[key];
            const link = config.content.icp.info.link[key];
            return code && link ? `<a class="icp-link" href="${link}" target="_blank">${code}</a>` : "";
        })
        .filter(Boolean);
    element.icpInfo.innerHTML = icpInfoLinks.join(` <i class="fa-solid fa-shield"></i> `);

    // 检测页脚重复作者名称
    if (config.content.masterInfo.name === "成成0v0") {
        element.webmasterInfo.innerHTML = "";
    }

    // ==================== 文章加载逻辑 ====================

    // 检查 URL hash，决定显示列表还是详情
    const hash = window.location.hash.replace("#", "").trim();

    if (hash) {
        // 显示文章详情
        showArticleDetail(hash);
    } else {
        // 显示文章列表
        loadArticleList();
    }

    // 监听 hash 变化
    window.addEventListener("hashchange", () => {
        const newHash = window.location.hash.replace("#", "").trim();
        if (newHash) {
            showArticleDetail(newHash);
        } else {
            showArticleList();
        }
    });
});

// ==================== 文章列表 ====================

// 缓存已加载的文章数据，避免重复 fetch
let cachedArticles = null;

async function loadArticleList() {
    const container = document.getElementById("article-cards");
    const loading = document.getElementById("article-loading");
    const countEl = document.getElementById("article-count");

    // 尝试加载 manifest.json
    try {
        const response = await fetch("./assets/markdown/articles/manifest.json");
        if (!response.ok) throw new Error("HTTP " + response.status);
        const manifest = await response.json();

        if (!manifest.articles || manifest.articles.length === 0) {
            showEmpty(container, loading);
            cachedArticles = [];
            return;
        }

        cachedArticles = manifest.articles;
        renderArticleCards(manifest.articles, container, loading, countEl);
    } catch (e) {
        console.warn("[Articles] 无法加载 manifest.json，使用内嵌数据:", e.message);

        // 回退：使用内嵌的 __FIREFLY_ARTICLES__（兼容 file:// 协议）
        if (window.__FIREFLY_ARTICLES__ && window.__FIREFLY_ARTICLES__.length > 0) {
            cachedArticles = window.__FIREFLY_ARTICLES__;
            renderArticleCards(window.__FIREFLY_ARTICLES__, container, loading, countEl);
        } else {
            showEmpty(container, loading);
        }
    }
}

function renderArticleCards(articles, container, loading, countEl) {
    // 隐藏加载状态
    if (loading) loading.style.display = "none";

    // 显示文章数量
    if (countEl) {
        countEl.textContent = `共 ${articles.length} 篇文章`;
    }

    // 生成卡片
    const cardsHTML = articles.map(article => {
        const dateStr = article.date ? formatDate(article.date) : "";
        const tagsHTML = (article.tags || []).map(t => `<span class="meta-tag">${escapeHTML(t)}</span>`).join("");
        const coverHTML = article.cover
            ? `<div class="card-cover"><img src="${escapeHTML(article.cover)}" alt="${escapeHTML(article.title)}" loading="lazy" /></div>`
            : `<div class="card-cover"><i class="fa-solid fa-feather cover-placeholder"></i></div>`;

        return `
            <a class="article-card" href="#${article.slug}">
                ${coverHTML}
                <div class="card-body">
                    <h3 class="card-title">${escapeHTML(article.title)}</h3>
                    <div class="card-meta">
                        ${dateStr ? `<span class="meta-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</span>` : ""}
                        ${tagsHTML ? `<span class="meta-tags">${tagsHTML}</span>` : ""}
                    </div>
                    <p class="card-desc">${escapeHTML(article.description || "")}</p>
                </div>
            </a>
        `;
    }).join("");

    container.innerHTML = cardsHTML;
}

function showEmpty(container, loading) {
    if (loading) loading.style.display = "none";
    container.innerHTML = `
        <div class="article-empty">
            <i class="fa-solid fa-inbox"></i>
            <p>暂无文章</p>
        </div>
    `;
}

// ==================== 文章详情 ====================

async function showArticleDetail(slug) {
    const listEl = document.getElementById("article-list");
    const detailEl = document.getElementById("article-detail");
    const contentEl = document.getElementById("article-detail-content");

    // 切换到详情视图
    if (listEl) listEl.style.display = "none";
    if (detailEl) detailEl.style.display = "";

    // 先尝试 fetch .md 文件
    let loaded = false;
    try {
        const response = await fetch(`./assets/markdown/articles/${slug}.md`);
        if (response.ok) {
            let mdText = await response.text();

            // 去除 frontmatter
            const fmMatch = mdText.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
            if (fmMatch) {
                mdText = mdText.substring(fmMatch[0].length);
            }

            if (typeof md !== "undefined") {
                contentEl.innerHTML = md.render(mdText);
            } else {
                contentEl.innerHTML = `<pre>${escapeHTML(mdText)}</pre>`;
            }
            loaded = true;
        }
    } catch (e) {
        console.warn("[Articles] Fetch 文章失败:", e.message);
    }

    // 回退：使用内嵌数据
    if (!loaded && window.__FIREFLY_MD__ && window.__FIREFLY_MD__[slug]) {
        if (typeof md !== "undefined") {
            contentEl.innerHTML = md.render(window.__FIREFLY_MD__[slug]);
        } else {
            contentEl.innerHTML = `<pre>${escapeHTML(window.__FIREFLY_MD__[slug])}</pre>`;
        }
        loaded = true;
    }

    if (!loaded) {
        contentEl.innerHTML = '<p style="color:red;">加载文章失败</p>';
    }

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showArticleList() {
    const listEl = document.getElementById("article-list");
    const detailEl = document.getElementById("article-detail");

    // 即时切换视图
    if (listEl) listEl.style.display = "";
    if (detailEl) detailEl.style.display = "none";

    // 如果有缓存数据，直接渲染（无需重新 fetch）
    if (cachedArticles) {
        const container = document.getElementById("article-cards");
        const loading = document.getElementById("article-loading");
        const countEl = document.getElementById("article-count");
        renderArticleCards(cachedArticles, container, loading, countEl);
    } else {
        // 首次加载才 fetch
        loadArticleList();
    }

    window.scrollTo({ top: 0, behavior: "instant" });
}

// 全局函数：返回文章列表（供 onclick 调用）
function goBackToList() {
    // 清除 hash（不触发 hashchange 的重复处理）
    if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname);
    }
    showArticleList();
}

// ==================== 工具函数 ====================

function formatDate(dateStr) {
    // 支持 YYYY-MM-DD 格式
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
