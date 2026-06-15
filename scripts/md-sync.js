/**
 * Markdown Sync Watcher
 * 监听 assets/markdown/ 目录下 .md 文件的变化，自动同步到 index.html 和 articles.html 的
 * window.__FIREFLY_MD__ 中。
 * 同时解析文章 frontmatter 并生成 manifest.json 供文章列表页使用。
 *
 * 用法: node scripts/md-sync.js
 */

const fs = require("fs");
const path = require("path");

const MARKDOWN_DIR = path.resolve(__dirname, "..", "assets", "markdown");
const ARTICLES_DIR = path.resolve(__dirname, "..", "assets", "markdown", "articles");
const INDEX_HTML = path.resolve(__dirname, "..", "index.html");
const ARTICLES_HTML = path.resolve(__dirname, "..", "articles.html");
const MANIFEST_PATH = path.resolve(__dirname, "..", "assets", "markdown", "articles", "manifest.json");

// ==================== 工具函数 ====================

// 解析 Markdown 文件的 YAML frontmatter
// 返回 { data: {...}, content: "..." } 或 null（无 frontmatter）
function parseFrontmatter(mdContent) {
    // 统一换行符为 \n，避免 Windows \r\n 影响解析
    const normalized = mdContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const match = normalized.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    if (!match) return null;

    const yamlBlock = match[1];
    const content = match[2];
    const data = {};

    // 简单 YAML 解析（支持 key: value, key: "value", key: [a, b, c]）
    const lines = yamlBlock.split("\n");
    for (const line of lines) {
        // 跳过空行
        if (!line.trim()) continue;

        // 匹配 key: value
        const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
        if (kvMatch) {
            let value = kvMatch[2].trim();

            // 去除引号
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // 数组格式 [a, b, c]
            const arrMatch = value.match(/^\[(.*)\]$/);
            if (arrMatch) {
                value = arrMatch[1].split(",").map(s => {
                    const t = s.trim();
                    return (t.startsWith('"') && t.endsWith('"')) ? t.slice(1, -1) : t;
                }).filter(Boolean);
            }

            data[kvMatch[1]] = value;
        }
    }

    return { data, content };
}

// ==================== 文章清单 ====================

// 生成文章清单 manifest.json
function generateManifest() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        console.log("[MD-Sync] 文章目录尚未创建，跳过清单生成");
        return;
    }

    const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith(".md"));
    const articles = [];

    for (const file of files) {
        const filePath = path.join(ARTICLES_DIR, file);
        const mdContent = fs.readFileSync(filePath, "utf-8");
        const parsed = parseFrontmatter(mdContent);

        if (parsed && parsed.data) {
            const slug = file.replace(/\.md$/, "");
            articles.push({
                slug: slug,
                title: parsed.data.title || slug,
                date: parsed.data.date || "",
                tags: parsed.data.tags || [],
                description: parsed.data.description || "",
                cover: parsed.data.cover || "",
            });
        } else {
            console.warn(`[MD-Sync] ⚠ ${file} 缺少 frontmatter，跳过`);
        }
    }

    // 按日期降序排列（最新的在前）
    articles.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
    });

    const manifest = { articles };

    try {
        fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
        console.log(`[MD-Sync] ✅ 文章清单已生成: ${articles.length} 篇文章`);
    } catch (e) {
        console.error(`[MD-Sync] 生成 manifest.json 失败:`, e.message);
    }

    // 同时嵌入到 articles.html 的 __FIREFLY_ARTICLES__（兼容 file:// 协议）
    if (fs.existsSync(ARTICLES_HTML)) {
        embedArticlesManifest(manifest);
    }
}

// 将文章清单嵌入到 articles.html 的 window.__FIREFLY_ARTICLES__
function embedArticlesManifest(manifest) {
    let html;
    try {
        html = fs.readFileSync(ARTICLES_HTML, "utf-8");
    } catch (e) {
        console.error(`[MD-Sync] 读取 articles.html 失败:`, e.message);
        return;
    }

    const prefix = "window.__FIREFLY_ARTICLES__ = ";
    const startIdx = html.indexOf(prefix);
    if (startIdx === -1) {
        console.error("[MD-Sync] articles.html 中未找到 __FIREFLY_ARTICLES__ 占位");
        return;
    }

    const jsonStart = startIdx + prefix.length;

    // 括号计数找结束位置（支持数组或对象）
    const openChar = html[jsonStart];
    const closeChar = openChar === "[" ? "]" : "}";
    let depth = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = jsonStart; i < html.length; i++) {
        const ch = html[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"' && !escape) { inString = !inString; continue; }
        if (inString) continue;
        if (ch === openChar) depth++;
        if (ch === closeChar) {
            depth--;
            if (depth === 0) { endIdx = i; break; }
        }
    }

    if (endIdx === -1) return;

    const newArticlesJSON = JSON.stringify(manifest.articles);
    const newHtml = html.substring(0, jsonStart) + newArticlesJSON + html.substring(endIdx + 1);

    try {
        fs.writeFileSync(ARTICLES_HTML, newHtml, "utf-8");
        console.log(`[MD-Sync] ✅ 文章清单已嵌入 articles.html`);
    } catch (e) {
        console.error(`[MD-Sync] 嵌入 articles.html 失败:`, e.message);
    }
}

// ==================== __FIREFLY_MD__ 同步 ====================

// 从 HTML 文件中读取 __FIREFLY_MD__ 对象（使用括号计数法）
function readFireflyMD(html) {
    const prefix = "window.__FIREFLY_MD__ = ";
    const startIdx = html.indexOf(prefix);
    if (startIdx === -1) return null;

    const jsonStart = startIdx + prefix.length;
    if (html[jsonStart] !== "{") return null;

    let braceCount = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = jsonStart; i < html.length; i++) {
        const ch = html[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"' && !escape) { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") braceCount++;
        if (ch === "}") {
            braceCount--;
            if (braceCount === 0) { endIdx = i; break; }
        }
    }

    if (endIdx === -1) return null;

    const jsonStr = html.substring(jsonStart, endIdx + 1);
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("[MD-Sync] 解析 __FIREFLY_MD__ 失败:", e.message);
        return null;
    }
}

// 更新指定 HTML 文件中 __FIREFLY_MD__ 的某个 key
function updateFireflyMD(htmlPath, key, value) {
    let html;
    try {
        html = fs.readFileSync(htmlPath, "utf-8");
    } catch (e) {
        console.error(`[MD-Sync] 读取 ${path.basename(htmlPath)} 失败:`, e.message);
        return false;
    }

    const mdObj = readFireflyMD(html);
    if (!mdObj) {
        console.error(`[MD-Sync] 未在 ${path.basename(htmlPath)} 中找到 __FIREFLY_MD__`);
        return false;
    }

    mdObj[key] = value;
    const newMDString = JSON.stringify(mdObj);

    const prefix = "window.__FIREFLY_MD__ = ";
    const startIdx = html.indexOf(prefix);
    if (startIdx === -1) return false;

    const jsonStart = startIdx + prefix.length;
    if (html[jsonStart] !== "{") return false;

    let braceCount = 0;
    let inString = false;
    let escape = false;
    let endIdx = -1;

    for (let i = jsonStart; i < html.length; i++) {
        const ch = html[i];
        if (escape) { escape = false; continue; }
        if (ch === "\\") { escape = true; continue; }
        if (ch === '"' && !escape) { inString = !inString; continue; }
        if (inString) continue;
        if (ch === "{") braceCount++;
        if (ch === "}") {
            braceCount--;
            if (braceCount === 0) { endIdx = i; break; }
        }
    }

    if (endIdx === -1) return false;

    const newHtml = html.substring(0, jsonStart) + newMDString + html.substring(endIdx + 1);

    try {
        fs.writeFileSync(htmlPath, newHtml, "utf-8");
        return true;
    } catch (e) {
        console.error(`[MD-Sync] 写入 ${path.basename(htmlPath)} 失败:`, e.message);
        return false;
    }
}

// 同步单个 .md 文件内容
function syncFile(mdFilePath) {
    const isArticle = mdFilePath.includes("articles");
    const fileName = path.basename(mdFilePath, ".md");
    const key = fileName;

    console.log(`[MD-Sync] 检测到变化: ${isArticle ? "articles/" : ""}${fileName}.md`);

    let mdContent;
    try {
        mdContent = fs.readFileSync(mdFilePath, "utf-8");
    } catch (e) {
        console.error(`[MD-Sync] 读取 ${mdFilePath} 失败:`, e.message);
        return;
    }

    if (isArticle) {
        const parsed = parseFrontmatter(mdContent);
        mdContent = parsed ? parsed.content : mdContent;
    }

    // 同步到 index.html（所有 .md 文件）
    if (updateFireflyMD(INDEX_HTML, key, mdContent)) {
        console.log(`[MD-Sync] ✅ ${fileName}.md → index.html`);
    }

    // 文章文件额外同步到 articles.html
    if (isArticle && fs.existsSync(ARTICLES_HTML)) {
        if (updateFireflyMD(ARTICLES_HTML, key, mdContent)) {
            console.log(`[MD-Sync] ✅ ${fileName}.md → articles.html`);
        }
    }
}

// ==================== 文件监听 ====================

// 初始同步
function syncAll() {
    // 同步根目录下的 .md 文件（announcement.md, content-page.md）
    if (fs.existsSync(MARKDOWN_DIR)) {
        const files = fs.readdirSync(MARKDOWN_DIR).filter(f => f.endsWith(".md"));
        files.forEach(file => {
            syncFile(path.join(MARKDOWN_DIR, file));
        });
        console.log(`[MD-Sync] 根目录同步完成，共 ${files.length} 个文件`);
    }

    // 生成文章清单
    generateManifest();

    // 同步文章内容到 __FIREFLY_MD__
    if (fs.existsSync(ARTICLES_DIR)) {
        const articleFiles = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith(".md"));
        articleFiles.forEach(file => {
            syncFile(path.join(ARTICLES_DIR, file));
        });
    }

    // 清理已删除文章的残留数据
    cleanStaleArticles();
}

// 清理 __FIREFLY_MD__ 中已不存在的文章 key
function cleanStaleArticles() {
    // 收集当前所有文章 slug
    const currentSlugs = new Set();
    if (fs.existsSync(ARTICLES_DIR)) {
        fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith(".md")).forEach(f => {
            currentSlugs.add(f.replace(/\.md$/, ""));
        });
    }

    // 保留的固定 key（根目录下非文章的 markdown 文件）
    const rootKeys = new Set();
    if (fs.existsSync(MARKDOWN_DIR)) {
        fs.readdirSync(MARKDOWN_DIR).filter(f => f.endsWith(".md")).forEach(f => {
            rootKeys.add(f.replace(/\.md$/, ""));
        });
    }

    // 清理各 HTML 文件
    [INDEX_HTML, ARTICLES_HTML].forEach(htmlPath => {
        if (!fs.existsSync(htmlPath)) return;

        let html;
        try {
            html = fs.readFileSync(htmlPath, "utf-8");
        } catch (e) { return; }

        const mdObj = readFireflyMD(html);
        if (!mdObj) return;

        let cleaned = false;
        for (const key of Object.keys(mdObj)) {
            if (!rootKeys.has(key) && !currentSlugs.has(key)) {
                delete mdObj[key];
                cleaned = true;
            }
        }

        if (cleaned) {
            const prefix = "window.__FIREFLY_MD__ = ";
            const startIdx = html.indexOf(prefix);
            if (startIdx === -1) return;

            const jsonStart = startIdx + prefix.length;
            let braceCount = 0, inString = false, escape = false, endIdx = -1;
            for (let i = jsonStart; i < html.length; i++) {
                const ch = html[i];
                if (escape) { escape = false; continue; }
                if (ch === "\\") { escape = true; continue; }
                if (ch === '"' && !escape) { inString = !inString; continue; }
                if (inString) continue;
                if (ch === "{") braceCount++;
                if (ch === "}") { braceCount--; if (braceCount === 0) { endIdx = i; break; } }
            }
            if (endIdx === -1) return;

            const newHtml = html.substring(0, jsonStart) + JSON.stringify(mdObj) + html.substring(endIdx + 1);
            try {
                fs.writeFileSync(htmlPath, newHtml, "utf-8");
                console.log(`[MD-Sync] 🧹 已清理 ${path.basename(htmlPath)} 中的过期文章数据`);
            } catch (e) {}
        }
    });
}

// 防抖定时器
const debounceTimers = {};

// 开始监听
function startWatching() {
    console.log("[MD-Sync] 👀 正在监听 Markdown 文件变化...");
    console.log(`[MD-Sync]    根目录: ${MARKDOWN_DIR}`);
    console.log(`[MD-Sync]    文章目录: ${ARTICLES_DIR}`);
    console.log("[MD-Sync] 按 Ctrl+C 停止\n");

    // 先执行一次初始同步
    syncAll();

    // 监听根目录
    try {
        fs.watch(MARKDOWN_DIR, { recursive: false }, (eventType, filename) => {
            if (!filename || !filename.endsWith(".md")) return;
            const mdFilePath = path.join(MARKDOWN_DIR, filename);
            clearTimeout(debounceTimers[filename]);
            debounceTimers[filename] = setTimeout(() => {
                if (fs.existsSync(mdFilePath)) {
                    syncFile(mdFilePath);
                }
            }, 300);
        });
    } catch (e) {
        console.error("[MD-Sync] 监听根目录失败:", e.message);
    }

    // 监听文章目录
    if (fs.existsSync(ARTICLES_DIR)) {
        try {
            fs.watch(ARTICLES_DIR, { recursive: false }, (eventType, filename) => {
                if (!filename) return;

                // .md 文件变化：同步内容和清单
                if (filename.endsWith(".md")) {
                    const key = `articles/${filename}`;
                    clearTimeout(debounceTimers[key]);
                    debounceTimers[key] = setTimeout(() => {
                        const mdFilePath = path.join(ARTICLES_DIR, filename);
                        if (fs.existsSync(mdFilePath)) {
                            syncFile(mdFilePath);
                            generateManifest();
                        }
                    }, 300);
                }
            });
        } catch (e) {
            console.error("[MD-Sync] 监听文章目录失败:", e.message);
        }
    }
}

startWatching();
