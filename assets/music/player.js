// 紧凑播放器 - 进度条 + 歌词 + 播放 + 音量
(function initPlayer() {
    var pl = window.MUSIC_PLAYLIST || [];
    if (!pl.length) return;
    var s = pl[0];

    var container = document.getElementById('music-player-container');
    if (!container) { setTimeout(initPlayer, 200); return; }

    container.innerHTML =
        '<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#faf6f0;border-radius:14px;font-family:system-ui,sans-serif;">' +
        '<div style="width:50px;height:50px;border-radius:8px;overflow:hidden;flex-shrink:0;">' +
        '<img id="mp-cover" src="" style="width:100%;height:100%;object-fit:cover;animation:mp-spin 10s linear infinite;animation-play-state:paused;">' +
        '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="display:flex;align-items:baseline;gap:6px;">' +
        '<span id="mp-title" style="font-weight:700;font-size:14px;color:#3d2e1e;">' + s.title + '</span>' +
        '<span id="mp-artist" style="font-size:11px;color:#a0896e;">' + s.artist + '</span>' +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:5px;">' +
        '<div id="mp-bar" style="flex:1;height:3px;background:#e8d5c4;border-radius:2px;cursor:pointer;">' +
        '<div id="mp-prog" style="height:100%;background:#d4a574;border-radius:2px;width:0;"></div></div>' +
        '<span id="mp-time" style="font-size:10px;color:#a0896e;">00:00</span>' +
        '</div>' +
        '<div id="mp-lrc" style="font-size:11px;color:#b8a088;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">♪ ...</div>' +
        '</div>' +
        '<button id="mp-play" style="width:38px;height:38px;border:none;border-radius:50%;background:#d4a574;color:#fff;cursor:pointer;font-size:15px;flex-shrink:0;">▶</button>' +
        '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">' +
        '<span id="mp-vol-icon" style="font-size:11px;color:#a0896e;cursor:pointer;">🔊</span>' +
        '<div id="mp-vol-bar" style="width:50px;height:4px;background:#e0d5c5;border-radius:2px;cursor:pointer;">' +
        '<div id="mp-vol-fill" style="height:100%;background:#b5c9a0;border-radius:2px;width:70%;pointer-events:none;"></div></div>' +
        '</div></div>';

    var styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes mp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
    document.head.appendChild(styleEl);

    var audio = new Audio(); audio.preload = 'auto'; audio.volume = 0.7; audio.src = s.url;
    var playing = false;
    var lrcData = (function(lrc) {
        if (!lrc) return [];
        var re = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;
        return lrc.split('\n').map(function(line) {
            var m = line.match(re); if (!m) return null;
            var ms = m[3] ? parseInt(m[3]) : 0; if (ms < 100) ms *= 10;
            return { time: parseInt(m[1]) * 60 + parseInt(m[2]) + ms / 1000, text: line.replace(re, '').trim() || '...' };
        }).filter(Boolean).sort(function(a, b) { return a.time - b.time; });
    })(s.lrc);

    function fmt(t) {
        if (isNaN(t) || t < 0) return '00:00';
        var m = Math.floor(t / 60), s = Math.floor(t % 60);
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    document.getElementById('mp-cover').src = s.cover || '';

    document.getElementById('mp-play').addEventListener('click', function() {
        if (audio.paused) {
            audio.play().then(function() { playing = true; updateUI(); }).catch(function() {});
        } else { audio.pause(); playing = false; updateUI(); }
    });

    document.getElementById('mp-bar').addEventListener('click', function(e) {
        if (!audio.duration) return;
        audio.currentTime = ((e.clientX - this.getBoundingClientRect().left) / this.offsetWidth) * audio.duration;
    });

    function updateVolUI() {
        var v = audio.muted ? 0 : audio.volume;
        document.getElementById('mp-vol-fill').style.width = (v * 100) + '%';
        document.getElementById('mp-vol-icon').textContent = ['🔇', '🔈', '🔉', '🔊'][v === 0 ? 0 : v < 0.3 ? 1 : v < 0.7 ? 2 : 3];
    }

    document.getElementById('mp-vol-bar').addEventListener('click', function(e) {
        var rect = this.getBoundingClientRect();
        audio.volume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        updateVolUI();
    });
    document.getElementById('mp-vol-icon').addEventListener('click', function() { audio.muted = !audio.muted; updateVolUI(); });

    updateVolUI();

    function updateUI() {
        document.getElementById('mp-play').textContent = playing ? '⏸' : '▶';
        document.getElementById('mp-cover').style.animationPlayState = playing ? 'running' : 'paused';
    }

    audio.addEventListener('timeupdate', function() {
        var pct = audio.duration ? (audio.currentTime / audio.duration * 100) : 0;
        document.getElementById('mp-prog').style.width = pct + '%';
        document.getElementById('mp-time').textContent = fmt(audio.currentTime);
        if (lrcData.length) {
            var t = audio.currentTime, ci = -1;
            for (var i = lrcData.length - 1; i >= 0; i--) { if (t >= lrcData[i].time) { ci = i; break; } }
            document.getElementById('mp-lrc').textContent = ci >= 0 ? lrcData[ci].text : '♪ ...';
        }
    });
    audio.addEventListener('play', function() { playing = true; updateUI(); });
    audio.addEventListener('pause', function() { playing = false; updateUI(); });
    audio.addEventListener('ended', function() { audio.currentTime = 0; playing = false; updateUI(); });
})();
