$(function () {

  // 大menu。開始
  // 1) 進場掉落動畫（尊重 prefers-reduced-motion）
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
    $('.nav-link').each(function (i) {
      const el = $(this);
      setTimeout(function () {
        el.addClass('is-show');
      }, 200 + i * 120); // 依序掉落，絲滑一點
    });
  } else {
    $('.nav-link').addClass('is-show');
  }

  // 2) 捲動後吸頂（補強 position:sticky；同時加陰影/樣式用）
  const $wrap = $('#navWrap');
  const anchorTop = $('#navAnchor').offset().top;
  const fixOnScroll = () => {
    if ($(window).scrollTop() > anchorTop + 10) {
      if (!$wrap.hasClass('is-fixed')) $wrap.addClass('is-fixed');
    } else {
      $wrap.removeClass('is-fixed');
    }
  };
  fixOnScroll();
  $(window).on('scroll', fixOnScroll);

  // 3) 手機：更新 aria-expanded + 視覺選中態（左鍵）
  const $btnMenu = $('#btnMenu');
  $('#menuModal')
    .on('show.bs.modal', function () {
      $btnMenu.attr('aria-expanded', 'true').addClass('is-active');
      // 開啟期間避免誤觸底下影片
      $('.video-area iframe').css('pointer-events', 'none');
    })
    .on('shown.bs.modal', function () {
      $('body').removeClass('menu-opening');
    })
    .on('hide.bs.modal', function () {
      $btnMenu.attr('aria-expanded', 'false').removeClass('is-active');
    })
    .on('hidden.bs.modal', function () {
      $('.video-area iframe').css('pointer-events', '');
      $('body').removeClass('menu-opening');
    });

  // 手機：按下「活動主選單」瞬間就先停用影片互動，避免誤觸（iOS 上特別必要）
  $btnMenu.on('touchstart mousedown', function () {
    $('body').addClass('menu-opening');
    $('.video-area iframe').css('pointer-events', 'none');
  });

  // 3b) 手機：#en 進入視窗區時，English 按鈕選中
  const $btnEn = $('.mobile-bar a[href="#en"]');
  const enSection = document.querySelector('#en');
  if ($btnEn.length && enSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          $btnEn.addClass('is-active').attr('aria-current', 'page');
        } else {
          $btnEn.removeClass('is-active').removeAttr('aria-current');
        }
      });
    }, { threshold: 0.4, rootMargin: '-20% 0px -35% 0px' });
    io.observe(enSection);
  }
  // 大menu。結束


  // 4) 南瓜圖示：hover / focus 切換（含預載與 active 狀態）
  // 需要的 HTML 屬性：<img class="pumpkin" data-src="..." data-hover="..." data-active="...">
  const linkSel = '.nav-link, .modal-link, .btn-pill'; // 桌機選單 + 手機光箱選單 + 手機兩顆按鈕

  // 預先載入 hover/active 圖，避免閃爍
  $('.pumpkin').each(function () {
    const $img = $(this);
    const hoverSrc = $img.data('hover');
    const activeSrc = $img.data('active');
    if (hoverSrc) { const i = new Image(); i.src = hoverSrc; }
    if (activeSrc) { const i2 = new Image(); i2.src = activeSrc; }
  });

  // 初始：把當前頁項目的南瓜換成 active 圖
  $(linkSel).each(function () {
    const $link = $(this);
    if ($link.is('.is-active, [aria-current="page"]')) {
      const $img = $link.find('.pumpkin');
      const activeSrc = $img.data('active');
      if (activeSrc) $img.attr('src', activeSrc);
    }
  });

  // hover / focusin → 換成 hover 圖
  $(document).on('mouseenter focusin', linkSel, function () {
    const $img = $(this).find('.pumpkin[data-hover]');
    const hoverSrc = $img.data('hover');
    if (hoverSrc) $img.attr('src', hoverSrc);
  });

  // mouseleave / focusout → 還原（或保持 active）
  $(document).on('mouseleave focusout', linkSel, function () {
    const $link = $(this);
    const $img = $link.find('.pumpkin');
    const isActive = $link.is('.is-active, [aria-current="page"]');
    const normalSrc = $img.data('src');
    const activeSrc = $img.data('active');
    if (isActive && activeSrc) $img.attr('src', activeSrc);
    else if (normalSrc) $img.attr('src', normalSrc);
  });

  // 5) 桌機大選單：點擊後保持選中（黃色），並更新南瓜圖
  $(document).on('click', '.nav-link, .modal-link', function () {
    const $clicked = $(this);

    // 文字選中態
    $('.nav-link, .modal-link').removeClass('is-active').removeAttr('aria-current');
    $clicked.addClass('is-active').attr('aria-current', 'page');

    // 圖示切換：被點的換 active，其餘換回 normal
    const $imgClicked = $clicked.find('.pumpkin');
    const activeSrc = $imgClicked.data('active');
    if (activeSrc) $imgClicked.attr('src', activeSrc);

    $('.nav-link, .modal-link').not($clicked).each(function () {
      const $i = $(this).find('.pumpkin');
      const normalSrc = $i.data('src');
      if (normalSrc) $i.attr('src', normalSrc);
    });
  });

});
