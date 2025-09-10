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

});
