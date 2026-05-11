document.addEventListener('DOMContentLoaded', function () {
    // 折叠展开功能
    const menuWraps = document.querySelectorAll('.menu-item-wrap');
    menuWraps.forEach(wrap => {
        const title = wrap.querySelector('.menu-title');
        const subMenu = wrap.querySelector('.sub-menu');
        const firstSubLi = subMenu.querySelector('.sub-li'); // 第一个子菜单

        title.addEventListener('click', () => {
            // 切换展开/折叠状态
            wrap.classList.toggle('open');
            // 标题激活态切换（变红/恢复）
            title.classList.toggle('active');

            // 如果展开，自动选中第一个子菜单并显示内容
            if (wrap.classList.contains('open')) {
                // 移除所有子菜单激活态
                document.querySelectorAll('.sub-li').forEach(l => l.classList.remove('active'));
                // 激活当前第一个子菜单
                firstSubLi.classList.add('active');
                
                // 显示对应内容
                const target = firstSubLi.dataset.target;
                document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
                document.getElementById(target).classList.add('active');
            }
        });
    });

    // 点击子菜单切换右侧内容
    const subLis = document.querySelectorAll('.sub-li');
    const contents = document.querySelectorAll('.content');

    subLis.forEach(li => {
        li.addEventListener('click', () => {
            // 高亮当前
            subLis.forEach(l => l.classList.remove('active'));
            li.classList.add('active');

            // 显示对应内容
            const target = li.dataset.target;
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById(target).classList.add('active');
        });
    });
});