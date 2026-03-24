// 1. 子菜单展开/收起
const submenuItems = document.querySelectorAll('.menu-item.has-submenu');
submenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // 阻止事件冒泡，避免点击子项触发父项
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

// 3. 菜单点击切换选中状态
const menuItems = document.querySelectorAll('.menu-item');
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // 移除所有选中状态
        menuItems.forEach(i => i.classList.remove('active'));
        // 给当前项添加选中状态
        item.classList.add('active');
    });
});

// 4. 左侧滚动条指示器跟随滚动（可选，模拟截图效果）
const sidebar = document.querySelector('.sidebar');
const indicator = document.querySelector('.sidebar-scroll-indicator');
sidebar.addEventListener('scroll', () => {
    const scrollTop = sidebar.scrollTop;
    const scrollHeight = sidebar.scrollHeight - sidebar.clientHeight;
    const percentage = scrollTop / scrollHeight;
    const indicatorHeight = sidebar.clientHeight * 0.8;
    indicator.style.top = `${40 + percentage * (sidebar.clientHeight - indicatorHeight)}px`;
});