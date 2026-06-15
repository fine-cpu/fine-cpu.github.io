/* global swal, markdownit */

// 获取网站配置
function getWebsiteConfig() {
    return {
        content: {},
        init() {
            // 优先使用内嵌数据（兼容 file:// 协议）
            if (window.__FIREFLY_CONFIG__) {
                this.content = window.__FIREFLY_CONFIG__;
                console.log("%c[I]%c 从内嵌数据加载配置", "background-color: #00896c;", "");
                return;
            }
            try {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", "./config.json", false);
                xhr.send();

                if (xhr.status >= 200 && xhr.status < 300) {
                    this.content = JSON.parse(xhr.responseText);
                } else {
                    throw new Error("无法获取网站配置文件");
                }
            } catch (error) {
                console.error("无法获取网站配置文件: ", error);
            }
        },
    };
}

// 获取网站配置
const config = getWebsiteConfig();
config.init();

// 对象递归初始化代理
function autoInitObject() {
    return new Proxy(
        {},
        {
            get(target, prop) {
                // 如果属性不存在，则递归返回一个新的代理
                if (!(prop in target)) {
                    target[prop] = autoInitObject();
                }
                return target[prop];
            },
            set(target, prop, value) {
                // 正常设置属性
                target[prop] = value;
                return true;
            },
        }
    );
}

// 节流函数
// NOTE: 节流的作用是：无论事件触发频率多高，目标函数都只会在指定时间间隔内执行一次。
function throttle(func, interval) {
    let lastTime = 0;
    return function (...args) {
        const now = Date.now(); // 当前时间
        if (now - lastTime >= interval) {
            func.apply(this, args); // 如果距离上次执行的时间超过间隔，执行函数
            lastTime = now; // 更新上次执行时间
        }
    };
}

// 防抖函数
// NOTE: 防抖的作用是：在事件触发后的 delay 时间内没有再次触发时，才会执行目标函数。
function debounce(func, delay) {
    let timer;
    return function (...args) {
        const context = this;
        clearTimeout(timer); // 每次触发事件都清除之前的定时器
        timer = setTimeout(() => {
            func.apply(context, args); // 重新设定定时器并调用函数
        }, delay);
    };
}

// 初始化 markdown-it 实例
const md = new markdownit({
    html: true, // 允许 HTML 标签
});

// Markdown 渲染器
function renderMarkdown() {
    // 获取页面中的所有 .markdown-content 元素
    const markdownElements = document.querySelectorAll(".markdown-content");

    // 遍历每个元素，获取其 src 指定的 Markdown 文件并渲染
    markdownElements.forEach(element => {
        const src = element.getAttribute("src"); // 获取 src 属性

        if (src) {
            // 从文件路径中提取 key（如 "./assets/markdown/announcement.md" → "announcement"）
            const fileName = src.replace(/^.*[\\/]/, '').replace(/\.md$/, '');
            
            var loaded = false;

            // 优先尝试读取本地 .md 文件（这样编辑 content-page.md 即可生效）
            try {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", src, false);
                xhr.send();

                if (xhr.status >= 200 && xhr.status < 300) {
                    const markdownContent = xhr.responseText;
                    const renderedHTML = md.render(markdownContent);
                    element.innerHTML = renderedHTML;
                    loaded = true;
                }
            } catch(e) {}

            // 回退：使用内嵌数据（XHR 被 CORS 阻止时）
            if (!loaded && window.__FIREFLY_MD__ && window.__FIREFLY_MD__[fileName]) {
                const markdownContent = window.__FIREFLY_MD__[fileName];
                const renderedHTML = md.render(markdownContent);
                element.innerHTML = renderedHTML;
                loaded = true;
            }

            if (!loaded) {
                element.innerHTML = '<span style=\"color: red;\">加载 Markdown 文件失败: ' + src + '</span>';
            }
        } else {
            element.innerHTML = "<span style='color: red;'>加载 Markdown 文件失败: 未在 src 属性中指定文件路径</span>";
        }
    });
}

// 将方法挂载到全局对象 window
window.autoInitObject = autoInitObject;
