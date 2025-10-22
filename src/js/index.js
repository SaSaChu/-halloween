$(function () {

  // 1) 進場掉落動畫（尊重 prefers-reduced-motion）
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    $('.nav-link').each(function (i) {
      const el = $(this);
      setTimeout(function () { el.addClass('is-show'); }, 200 + i * 120);
    });
  } else {
    $('.nav-link').addClass('is-show');
  }

  // 2) 桌機吸頂：IntersectionObserver + 佔位，不改 HTML
  (function desktopSticky() {
    const nav = document.querySelector('#navWrap');
    if (!nav) return;

    const mqDesktop = window.matchMedia('(min-width: 992px)');
    let io, onScrollBound;
    const sentinel = document.createElement('span');
    sentinel.className = 'menu-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    nav.parentNode.insertBefore(sentinel, nav);

    const placeholder = document.createElement('div');
    placeholder.className = 'menu-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    nav.parentNode.insertBefore(placeholder, nav.nextSibling);

    function setPH() {
      placeholder.style.height = nav.classList.contains('is-fixed') ? nav.offsetHeight + 'px' : '0px';
    }

    function enableSticky() {
      disableSticky();
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => {
          const e = entries[0];
          if (!e.isIntersecting) nav.classList.add('is-fixed');
          else nav.classList.remove('is-fixed');
          setPH();
        }, { rootMargin: '0px', threshold: 0 });
        io.observe(sentinel);
      } else {
        const onScroll = () => {
          const rect = sentinel.getBoundingClientRect();
          if (rect.top <= 0) nav.classList.add('is-fixed');
          else nav.classList.remove('is-fixed');
          setPH();
        };
        onScrollBound = onScroll;
        window.addEventListener('scroll', onScrollBound, { passive: true });
        onScroll();
      }
      window.addEventListener('resize', setPH);
      setPH();
    }

    function disableSticky() {
      if (io) { io.disconnect(); io = null; }
      if (onScrollBound) { window.removeEventListener('scroll', onScrollBound); onScrollBound = null; }
      nav.classList.remove('is-fixed');
      placeholder.style.height = '0px';
      window.removeEventListener('resize', setPH);
    }

    function handleMQ(e) { e.matches ? enableSticky() : disableSticky(); }
    handleMQ(mqDesktop);
    if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', handleMQ);
    else mqDesktop.addListener(handleMQ);
  })();

  /* ==== ★ 新增 2-1) 量測 nav 高度，寫入 CSS 變數供錨點位移用 ==== */
  (function anchorOffsetVar() {
    const nav = document.querySelector('#navWrap');
    if (!nav) return;
    const setVar = () => {
      const h = nav.offsetHeight || 0;
      document.documentElement.style.setProperty('--nav-h', h + 'px');
    };
    setVar();
    window.addEventListener('resize', setVar);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(setVar);
      ro.observe(nav);
    }
  })();

  // 3) 手機：更新 aria-expanded + 視覺選中態（左鍵）
  const $btnMenu = $('#btnMenu');
  $('#menuModal')
    .on('show.bs.modal', function () {
      $btnMenu.attr('aria-expanded', 'true').addClass('is-active');
      $('.video-area iframe').css('pointer-events', 'none');
    })
    .on('shown.bs.modal', function () { $('body').removeClass('menu-opening'); })
    .on('hide.bs.modal', function () {
      $btnMenu.attr('aria-expanded', 'false').removeClass('is-active');
    })
    .on('hidden.bs.modal', function () {
      $('.video-area iframe').css('pointer-events', '');
      $('body').removeClass('menu-opening');
    });

  // 手機：按下「活動主選單」瞬間先停用影片互動，避免誤觸
  $btnMenu.on('touchstart mousedown', function () {
    $('body').addClass('menu-opening');
    $('.video-area iframe').css('pointer-events', 'none');
  });

  // 3b) 手機：#en 進視窗 → English 選中
  const $btnEn = $('.mobile-bar a[href="#en"]');
  const enSection = document.querySelector('#en');
  if ($btnEn.length && enSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) $btnEn.addClass('is-active').attr('aria-current', 'page');
        else $btnEn.removeClass('is-active').removeAttr('aria-current');
      });
    }, { threshold: 0.4, rootMargin: '-20% 0px -35% 0px' });
    io.observe(enSection);
  }

  // 4) 南瓜圖示：hover / focus 切換（含預載與 active 狀態）
  const linkSel = '.nav-link, .modal-link, .btn-pill';
  $('.pumpkin').each(function () {
    const $img = $(this);
    const hoverSrc = $img.data('hover');
    const activeSrc = $img.data('active');
    if (hoverSrc) { const i = new Image(); i.src = hoverSrc; }
    if (activeSrc) { const i2 = new Image(); i2.src = activeSrc; }
  });
  $(linkSel).each(function () {
    const $link = $(this);
    if ($link.is('.is-active, [aria-current="page"]')) {
      const $img = $link.find('.pumpkin');
      const activeSrc = $img.data('active');
      if (activeSrc) $img.attr('src', activeSrc);
    }
  });
  $(document).on('mouseenter focusin', linkSel, function () {
    const $img = $(this).find('.pumpkin[data-hover]');
    const hoverSrc = $img.data('hover');
    if (hoverSrc) $img.attr('src', hoverSrc);
  });
  $(document).on('mouseleave focusout', linkSel, function () {
    const $link = $(this);
    const $img = $link.find('.pumpkin');
    const isActive = $link.is('.is-active, [aria-current="page"]');
    const normalSrc = $img.data('src');
    const activeSrc = $img.data('active');
    if (isActive && activeSrc) $img.attr('src', activeSrc);
    else if (normalSrc) $img.attr('src', normalSrc);
  });

  // 5) 桌機/光箱：點擊後保持選中（黃色），並更新南瓜圖
  $(document).on('click', '.nav-link, .modal-link', function () {
    const $clicked = $(this);
    $('.nav-link, .modal-link').removeClass('is-active').removeAttr('aria-current');
    $clicked.addClass('is-active').attr('aria-current', 'page');
    const $imgClicked = $clicked.find('.pumpkin');
    const activeSrc = $imgClicked.data('active');
    if (activeSrc) $imgClicked.attr('src', activeSrc);
    $('.nav-link, .modal-link').not($clicked).each(function () {
      const $i = $(this).find('.pumpkin');
      const normalSrc = $i.data('src');
      if (normalSrc) $i.attr('src', normalSrc);
    });
  });

  // 6) 最新消息：hover / 焦點讓白字變 $yellow（舊瀏覽器補強）
  $(document)
    .on('mouseenter focusin', '.news-link', function () { $(this).addClass('is-hover'); })
    .on('mouseleave focusout', '.news-link', function () { $(this).removeClass('is-hover'); });

  // 7) 回到上方按鈕
  const $backTop = $('#backTop');
  const showAfter = 280;
  function toggleBackTop() {
    const y = window.scrollY || $(window).scrollTop();
    if (y > showAfter) $backTop.removeAttr('hidden').addClass('is-show');
    else $backTop.attr('hidden', 'hidden').removeClass('is-show');
  }
  toggleBackTop();
  $(window).on('scroll', toggleBackTop);
  $backTop.on('click', function () {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) window.scrollTo(0, 0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    $(this).blur();
  });

  // 7) 表單：小螢幕時，給可捲動容器加陰影提示
  $('.sched-area .table-responsive').each(function () {
    const $wrap = $(this);
    function onScroll() {
      const atLeft = $wrap.scrollLeft() <= 0;
      const atRight = Math.ceil($wrap.scrollLeft() + $wrap.innerWidth()) >= $wrap[0].scrollWidth;
      $wrap.toggleClass('at-left', atLeft);
      $wrap.toggleClass('at-right', atRight);
    }
    $wrap.on('scroll', onScroll);
    onScroll();
  });

  // 8) 表單：若未手動設定，依表頭文字自動填入 data-label（方便之後做卡片式樣式）
  $('.sched-table').each(function () {
    const $table = $(this);
    const heads = $table.find('thead th').map(function(){ return $(this).text().trim(); }).get();
    $table.find('tbody tr').each(function () {
      $(this).children('td').each(function (i) {
        if (!this.hasAttribute('data-label') && heads[i+1]) {
          $(this).attr('data-label', heads[i+1]); // +1：略過第一欄「日期」
        }
      });
    });
  });

  /* ===== 新增：liveinfo 區塊強化 ===== */

  // 9) liveinfo 圖片：補上 lazy / async（若未設定）
  $('.liveinfo-area img').each(function () {
    if (!this.hasAttribute('loading')) this.setAttribute('loading', 'lazy');
    this.setAttribute('decoding', 'async');
  });

  // 10) liveinfo 卡片：可鍵盤巡覽
  $('.liveinfo-card').attr('tabindex', '0');

  /* ==== ★ 新增 11) 所有頁內錨點，捲動時扣掉導覽列高度 ==== */
  $(document).on('click', 'a[href^="#"]:not([href="#"])', function (e) {
    // 避開 Bootstrap 元件觸發（modal、collapse…）
    if (this.hasAttribute('data-bs-toggle')) return;

    const id = decodeURIComponent(this.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return; // 不是本頁錨點就放行

    e.preventDefault();

    const nav = document.querySelector('#navWrap');
    const navH = nav ? nav.offsetHeight : 0;
    const gap  = 12; // 不要貼邊
    const y = target.getBoundingClientRect().top + window.scrollY - navH - gap;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });

    // 無障礙：焦點跟到目標
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  // ★ 新增 12) 以 #hash 直接載入時，同步補償一次
  $(window).on('load', function () {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;

    const nav = document.querySelector('#navWrap');
    const navH = nav ? nav.offsetHeight : 0;
    const gap  = 12;
    const y = target.getBoundingClientRect().top + window.scrollY - navH - gap;

    window.scrollTo(0, y);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

});



/* ================================================================
 * Mobile Program Schedule → Cards (for #stageListTable)
 * ================================================================ */
(function () {
  'use strict';

  function isMobile() { return window.innerWidth < 992; }

  function ensureCardsContainer() {
    var cards = document.getElementById('stageListCards');
    if (cards) return cards;
    var wrap = document.getElementById('stageListTable');
    if (!wrap) return null;
    cards = document.createElement('div');
    cards.id = 'stageListCards';
    cards.className = 'stage-cards d-none';
    cards.setAttribute('aria-live', 'polite');
    wrap.appendChild(cards);
    return cards;
  }

  function resolveLabels($table) {
    var heads = $table.find('thead th').map(function () {
      return ($(this).text() || '').trim();
    }).get();

    function findHead(regexArr, fallback) {
      for (var i = 0; i < regexArr.length; i++) {
        var rx = regexArr[i];
        var hit = heads.find(function (h) { return rx.test(h); });
        if (hit) return hit;
      }
      return fallback;
    }

    var timeHead  = findHead([/^(Time|時間)$/i], '時間');
    var eventHead = findHead([/^(Event|節目名稱)$/i, /^Performance Program$/i], '節目');
    var venueHead = findHead([/^(Venue|地點)$/i], '地點');

    function colonFor(h) { return /[A-Za-z]/.test(h) ? ': ' : '：'; }

    return {
      time:  timeHead.replace(/\s*\(.+?\)\s*$/, ''),
      event: eventHead.replace(/\s*\(.+?\)\s*$/, ''),
      venue: venueHead.replace(/\s*\(.+?\)\s*$/, ''),
      cTime:  colonFor(timeHead),
      cEvent: colonFor(eventHead),
      cVenue: colonFor(venueHead),
    };
  }

  function buildGroupsFromTable($table) {
    var groups = [], cur = null;

    $table.find('tbody tr').each(function () {
      var $tr = $(this);
      var $th = $tr.children('th[scope="row"]');

      if ($th.length) {
        var dateText = ($th.text() || '').trim();
        var weekday  = ($tr.children('td').eq(0).text() || '').trim();
        cur = { date: dateText, weekday: weekday, items: [] };
        groups.push(cur);

        var time  = ($tr.children('td').eq(1).text() || '').trim();
        var title = ($tr.children('td').eq(2).text() || '').trim();
        var place = ($tr.children('td').eq(3).text() || '').trim();
        if (time || title || place) cur.items.push({ time: time, title: title, place: place });
      } else if (cur) {
        var tds   = $tr.children('td');
        var time  = (tds.eq(0).text() || '').trim();
        var title = (tds.eq(1).text() || '').trim();
        var place = (tds.eq(2).text() || '').trim();
        if (!time && cur.items.length) time = cur.items[cur.items.length - 1].time;
        cur.items.push({ time: time, title: title, place: place });
      }
    });

    return groups;
  }

  function buildGroupTitle(dateText, weekday) {
    var dt = (dateText || '').trim();
    var hasLatin = /[A-Za-z]/.test(dt);
    var hasCJKWd = /[一二三四五六日天]/.test(dt);
    if (hasLatin || hasCJKWd) return dt;
    if (!weekday) return dt;
    return dt + '（' + weekday + '）';
  }

  var builtOnce = false;

  function syncScheduleView() {
    var $wrap  = $('#stageListTable');
    var $table = $wrap.find('.sched-table');
    if (!$wrap.length || !$table.length) return;

    var cards = ensureCardsContainer();
    if (!cards) return;

    if (isMobile()) {
      if (!builtOnce || !cards.children.length) {
        var L = resolveLabels($table);
        var groups = buildGroupsFromTable($table);
        var frag = document.createDocumentFragment();

        groups.forEach(function (g) {
          var sec = document.createElement('section');
          sec.className = 'stage-card';
          sec.setAttribute('tabindex', '0');

          var h = document.createElement('h4');
          h.className = 'stage-card__title';
          h.textContent = buildGroupTitle(g.date, g.weekday);
          sec.appendChild(h);

          var ul = document.createElement('ul');
          ul.className = 'stage-card__list';

          g.items.forEach(function (it) {
            var li = document.createElement('li');
            li.className = 'stage-item';

            var time = document.createElement('div');
            time.className = 'stage-item__time';
            time.innerHTML = '<span class="label">' + L.time  + L.cTime  + '</span>' + (it.time  || '');

            var title = document.createElement('div');
            title.className = 'stage-item__title';
            title.innerHTML = '<span class="label">' + L.event + L.cEvent + '</span>' + (it.title || '');

            var place = document.createElement('div');
            place.className = 'stage-item__place';
            place.innerHTML = '<span class="label">' + L.venue + L.cVenue + '</span>' + (it.place || '');

            var main = document.createElement('div');
            main.className = 'stage-item__main';
            main.appendChild(title);
            main.appendChild(place);

            li.appendChild(time);
            li.appendChild(main);
            ul.appendChild(li);
          });

          sec.appendChild(ul);
          frag.appendChild(sec);
        });

        cards.innerHTML = '';
        cards.appendChild(frag);
        builtOnce = true;
      }

      cards.classList.remove('d-none');
      $wrap.find('.table-responsive').addClass('d-none d-lg-block');
    } else {
      cards.classList.add('d-none');
      $wrap.find('.table-responsive').removeClass('d-none d-lg-block');
    }
  }

  // 綁定事件
  document.addEventListener('DOMContentLoaded', syncScheduleView);
  window.addEventListener('load', syncScheduleView);
  window.addEventListener('resize', syncScheduleView);
  window.addEventListener('orientationchange', syncScheduleView);

  // ★ debug 掛鉤：只在需要時對外暴露，避免全域找不到
  if (!window.__schedule_debug) {
    window.__schedule_debug = {
      sync: syncScheduleView,
      isMobile: function(){ return window.innerWidth < 992; }
    };
  }
})();
