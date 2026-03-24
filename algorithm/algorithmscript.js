// 1. 子菜单展开/收起
const submenuItems = document.querySelectorAll('.menu-item.has-submenu');
submenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        item.classList.toggle('open');
    });
});

// 2. 折叠面板展开/收起
const collapsePanels = document.querySelectorAll('.collapse-panel');
collapsePanels.forEach(panel => {
    const header = panel.querySelector('.panel-header');
    header.addEventListener('click', () => {
        panel.classList.toggle('open');
    });
});

// 3. 核心功能：点击菜单切换右侧内容
const menuItems = document.querySelectorAll('.menu-item, .submenu-item');
const contentBlocks = document.querySelectorAll('.content-block');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有菜单的active状态
        menuItems.forEach(i => i.classList.remove('active'));
        // 给当前点击的菜单添加active
        item.classList.add('active');

        // 获取当前菜单对应的内容id
        const contentId = item.getAttribute('data-content');
        // 隐藏所有内容块
        contentBlocks.forEach(block => block.classList.remove('active'));
        // 显示对应内容块
        document.getElementById(contentId).classList.add('active');
    });
});

// 4. 左侧滚动条指示器跟随滚动（可选）
const sidebar = document.querySelector('.sidebar');
const indicator = document.querySelector('.sidebar-scroll-indicator');
sidebar.addEventListener('scroll', () => {
    const scrollTop = sidebar.scrollTop;
    const scrollHeight = sidebar.scrollHeight - sidebar.clientHeight;
    const percentage = scrollTop / scrollHeight;
    const indicatorHeight = sidebar.clientHeight * 0.8;
    indicator.style.top = `${40 + percentage * (sidebar.clientHeight - indicatorHeight)}px`;
});