(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Sarah's pipeline: hero board and sticky rail ---------- */
  var STAGES = [
    { name: 'Connect', text: 'HubSpot is your Default CRM. Warm-up has started.', note: 'Found in HubSpot list' },
    { name: 'Capture', text: '640 verified founders match your profile.', note: 'Verified and enriched' },
    { name: 'Engage', text: 'Plan approved. First emails are going out.', note: 'Email 1 sent' },
    { name: 'Qualify', text: 'Four replies, each sorted.', note: 'Positive reply' },
    { name: 'Hand off', text: 'This objection needs a person.', note: 'You took control' },
    { name: 'Measure', text: 'Two more meetings booked today.', note: 'Meeting booked' },
    { name: 'Sync', text: "Ava's lead and history go to HubSpot.", note: 'Synced to HubSpot' }
  ];
  var heroBtns = $$('#heroCols .stagebtn');
  var railBtns = $$('#railCols .stagebtn');
  var ava = $('#ava');
  var heroStage = 2;

  function placeAva(i) {
    var col = heroBtns[i] && heroBtns[i].parentElement;
    if (!col || !ava) return;
    var board = $('#heroCols').getBoundingClientRect();
    var r = col.getBoundingClientRect();
    var x = r.left - board.left + (r.width - ava.offsetWidth) / 2;
    x = Math.max(0, Math.min(x, board.width - ava.offsetWidth));
    ava.style.transform = 'translateX(' + x + 'px)';
    drawTrail(x);
  }
  function drawTrail(x) {
    var path = $('#trailPath'); if (!path) return;
    var cols = $('#heroCols'), sync = heroBtns[6];
    var cr = cols.getBoundingClientRect(), sr = sync.getBoundingClientRect();
    var gut = ava.offsetLeft;
    var x0 = gut + x + ava.offsetWidth, y0 = ava.offsetTop + 40;
    var x1 = sr.left - cr.left + gut + sr.width / 2, y1 = 52;
    if (x1 - x0 < 40) { path.setAttribute('d', ''); return; }
    var mx = (x0 + x1) / 2;
    path.setAttribute('d', 'M' + x0 + ' ' + y0 + ' C ' + mx + ' ' + (y0 + 60) + ', ' + mx + ' ' + (y1 - 10) + ', ' + x1 + ' ' + (y1 + 18));
  }
  function setHero(i) {
    heroStage = i;
    heroBtns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    $('#avaStage').textContent = STAGES[i].name;
    $('#avaNote').textContent = STAGES[i].note;
    $('#bubbleStage').textContent = STAGES[i].name;
    $('#bubbleText').textContent = STAGES[i].text;
    $('#mavaStage').textContent = STAGES[i].name;
    $('#mavaNote').textContent = STAGES[i].note;
    placeAva(i);
  }
  heroBtns.forEach(function (b) {
    b.addEventListener('click', function () { stopPlay(); setHero(+b.dataset.i); });
  });

  var timer = null;
  var playBtn = $('#playBtn');
  function startPlay() {
    if (timer) return;
    playBtn.setAttribute('aria-pressed', 'true');
    $('#playLabel').textContent = 'Pause Sarah';
    $('#playIcon use').setAttribute('href', '#i-pause');
    setHero((heroStage + 1) % STAGES.length);
    timer = setInterval(function () { setHero((heroStage + 1) % STAGES.length); }, 2600);
  }
  function stopPlay() {
    if (!timer) return;
    clearInterval(timer); timer = null;
    playBtn.setAttribute('aria-pressed', 'false');
    $('#playLabel').textContent = 'Watch Sarah work';
    $('#playIcon use').setAttribute('href', '#i-play');
  }
  playBtn.addEventListener('click', function () { timer ? stopPlay() : startPlay(); });
  window.addEventListener('resize', function () { placeAva(heroStage); });
  setHero(2);

  /* rail follows the chapter in view; the lead's path draws as you read */
  var stages = $$('.stage');
  var voice = $('#railVoice');
  function setRail(i) {
    railBtns.forEach(function (b, k) {
      b.classList.toggle('is-on', k === i);
      if (k === i) { b.setAttribute('aria-current', 'step'); } else { b.removeAttribute('aria-current'); }
    });
    if (voice && stages[i]) voice.textContent = stages[i].dataset.voice;
    moveRailAva(i);
    var on = railBtns[i];
    if (on && on.parentElement.scrollWidth > on.parentElement.clientWidth) {
      on.parentElement.scrollTo({ left: on.offsetLeft - on.parentElement.clientWidth / 2 + on.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setRail(+e.target.dataset.stage); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    stages.forEach(function (s) { io.observe(s); });
  }
  var railAva = $('#railAva');
  function moveRailAva(i) {
    if (!railAva) return;
    var b = railBtns[i];
    var x = b.offsetLeft + (b.offsetWidth - railAva.offsetWidth) / 2;
    x = Math.max(0, Math.min(x, b.parentElement.clientWidth - railAva.offsetWidth));
    railAva.style.transform = 'translateX(' + x + 'px)';
    $('#railAvaNote').textContent = i === 6 ? 'In your CRM' : STAGES[i].note;
    railAva.classList.toggle('done', i === 6);
  }
  window.addEventListener('resize', function () { var on = railBtns.findIndex(function (b) { return b.classList.contains('is-on'); }); moveRailAva(on < 0 ? 0 : on); });
  moveRailAva(0);

  /* ---------- helpers ---------- */
  function pressGroup(btns, active) {
    btns.forEach(function (b) { b.setAttribute('aria-pressed', b === active ? 'true' : 'false'); });
  }
  function pinsInto(fig, pins) {
    $$('.pin', fig).forEach(function (p) { p.remove(); });
    pins.forEach(function (p) {
      var s = document.createElement('span');
      s.className = 'pin'; s.textContent = p[0]; s.style.left = p[1] + '%'; s.style.top = p[2] + '%';
      fig.insertBefore(s, fig.querySelector('figcaption'));
    });
  }
  function notesInto(list, pins, notes) {
    list.innerHTML = '';
    notes.forEach(function (t, k) {
      var li = document.createElement('li');
      var pin = document.createElement('span'); pin.className = 'pin'; pin.textContent = pins[k][0];
      li.appendChild(pin); li.appendChild(document.createTextNode(t));
      list.appendChild(li);
    });
  }

  /* ---------- rivals ---------- */
  var table = $('#rivalTable');
  function highlight(col) {
    $$('tr', table).forEach(function (tr) {
      $$('th,td', tr).forEach(function (c, k) { c.classList.toggle('hl', k === col); c.classList.toggle('me', k === 4); });
    });
  }
  $$('.rivals .chip').forEach(function (b, _, all) {
    b.addEventListener('click', function () { pressGroup(all, b); highlight(+b.dataset.col); });
  });
  highlight(3);

  /* ---------- journey ---------- */
  var J = {
    stages: ['Plan outreach', 'Set up', 'Launch', 'Replies arrive', 'Lead qualified', 'Report'],
    think: ['Who should we target?', 'Is my domain safe?', 'Who will we contact?', 'Which ones need me?', 'Is it in our CRM?', 'Can I show my boss?'],
    v: [[3, 2, 2, 1, 2, 2], [5, 4, 4, 4, 4, 4]],
    chip: [['Lists built by hand', 'Several tools to stitch', 'Every email written', 'Every reply on my desk', 'Copied into the CRM', 'Spreadsheets'],
      ['Brief Sarah once', 'Four guided steps', 'Plan, then approval', 'Only what needs me', 'One default CRM', 'Funnel and meetings']],
    aria: ['By hand: the manager carries every step, and stress peaks when replies arrive.', 'With Sarah: the manager only steps in for decisions, and confidence stays high.']
  };
  function pts(v) { return v.map(function (n, i) { return (65 + i * 130) + ',' + (150 - (n - 1) * 32.5); }).join(' '); }
  function setJourney(k) {
    $('#jOn').setAttribute('points', pts(J.v[k]));
    $('#jOff').setAttribute('points', pts(J.v[1 - k]));
    $('#jsvg').setAttribute('aria-label', J.aria[k]);
    $('#jgrid').innerHTML = J.stages.map(function (s, i) {
      return '<div><b>' + s + '</b><i>' + J.think[i] + '</i><em>' + J.chip[k][i] + '</em></div>';
    }).join('');
  }
  $$('[data-j]').forEach(function (b, _, all) {
    b.addEventListener('click', function () { pressGroup(all, b); setJourney(+b.dataset.j); });
  });
  setJourney(0);

  /* ---------- decision 1: onboarding ---------- */
  var OB = [
    { why: 'She introduces herself like a new teammate, not a form.', screens: [
      { label: 'Intro', src: 'img/ob1.jpg', alt: "Step 1 of 4: I'm your SDR, and I'm new here. Sarah explains she needs a few things set up before she contacts anyone, with one Continue Setup button.", pins: [[1, 70.5, 39], [2, 81, 57], [3, 59, 82.6]], notes: ['Speaks as a new teammate', 'Says why setup matters', 'One clear next step'] }] },
    { why: 'She asks for your CRM and says why. Trust comes first.', screens: [
      { label: 'CRM choice', src: 'img/ob2.png', alt: 'Step 2 of 4: Which CRM should I connect to? Zoho CRM or HubSpot, with a progress bar, a 7-minute estimate and an option to set it up later.', pins: [[1, 80, 9.4], [2, 13, 46.4], [3, 31, 88.2]], notes: ['Progress and a 7-minute estimate', 'Why she needs access', 'Skip it, never stuck'] },
      { label: 'Trust panel', src: 'img/d1-trust.png', alt: 'The Connect Zoho panel: this page redirects to Zoho, your data is private and secure, and you stay in control of your data.', pins: [[1, 89, 21], [2, 47, 55]], notes: ['Explains the redirect first', 'Privacy in plain words'] },
      { label: 'Connected', src: 'img/ob3.png', alt: 'Zoho CRM shows Connected on its card, Sarah confirms the connection, and Continue is enabled.', pins: [[1, 31.5, 55], [2, 40, 79.2]], notes: ['Connected, right on the card', 'Sarah confirms, Continue unlocks'] },
      { label: 'Meeting link', src: 'img/ob4.png', alt: 'Where should prospects book meetings with you? A field for a scheduling link, with Back, Continue and set it up later.', pins: [[1, 56.5, 33.3], [2, 39.5, 88.2]], notes: ['Used when a reply is positive', 'Back, Continue or later'] }] },
    { why: 'She learns the rules. Safety is locked. Style is yours.', screens: [
      { label: 'Core rules', src: 'img/ob5.png', alt: 'Step 3 of 4: six locked guardrails, from a daily sending limit to verified contacts only, and an agreement checkbox.', pins: [[1, 8.5, 45], [2, 39.5, 80.7]], notes: ['Six rules, locked', 'Agree before you continue'] },
      { label: 'Your rules', src: 'img/ob6.png', alt: 'Optional guardrails as switches: unsubscribe links, competitor mentions, tone moderation and a follow-up limit.', pins: [[1, 84, 42.8], [2, 27.5, 41.3]], notes: ['Switch rules on or off', 'Unsubscribe link stays locked'] }] },
    { why: 'She protects your brand and warms up before any outreach.', screens: [
      { label: 'Your domain', src: 'img/ob7.png', alt: 'Step 4 of 4: Which domains should I send emails from? Organization name, domain and preferred domain styles.', pins: [[1, 91.5, 22], [2, 31.5, 67.6]], notes: ['Use a separate outreach domain', 'Style hints for suggestions'] },
      { label: 'Pick domains', src: 'img/ob8.png', alt: 'Sarah suggests sending domains. The user picks up to 10, with one domain being dragged into the selected list.', pins: [[1, 70, 51.7], [2, 50, 61], [3, 39.5, 51.7]], notes: ['Up to 10 domains', 'Tap or drag to add', 'Find more suggestions'] },
      { label: 'Inboxes', src: 'img/ob9.png', alt: 'Three sender names, each assigned to ten inboxes, with the selected domains listed alongside.', pins: [[1, 60.5, 26.8], [2, 81.5, 46.6]], notes: ['3 names, 10 inboxes each', 'Chosen domains carry over'] },
      { label: 'Warm-up plan', src: 'img/ob10.png', alt: 'All done: a 21-day warm-up schedule with start and end dates, the selected domains, every inbox, Start Warmup and an onboarding rating.', pins: [[1, 35, 33.3], [2, 69, 32], [3, 31, 92.2]], notes: ['21-day warm-up schedule', 'Every inbox listed', 'Start, then rate the setup'] }] }
  ];
  var obStep = 0;
  function showScreen(sc) {
    var img = $('#obImg');
    img.src = sc.src; img.alt = sc.alt;
    pinsInto($('#obShot'), sc.pins);
    notesInto($('#obNotes'), sc.pins, sc.notes);
  }
  function setOb(k) {
    obStep = k;
    $('#obWhy').textContent = OB[k].why;
    var th = $('#obThumbs'); th.innerHTML = '';
    OB[k].screens.forEach(function (sc, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = sc.label; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { pressGroup($$('button', th), b); showScreen(sc); });
      th.appendChild(b);
    });
    th.hidden = OB[k].screens.length < 2;
    showScreen(OB[k].screens[0]);
  }
  $$('[data-ob]').forEach(function (b, _, all) {
    b.addEventListener('click', function () { pressGroup(all, b); setOb(+b.dataset.ob); });
  });
  setOb(0);

  /* ---------- decisions 2 and 4: first pass and final ---------- */
  var D2 = [
    { src: 'img/d2-flat.png', alt: "First pass: Sarah's settings list with Email Server, Zoho CRM and HubSpot, each with its own Make Default button.", pins: [[1, 73, 16.4], [2, 73, 82.3]], notes: ['Make Default on every row', 'Leads could land anywhere'] },
    { src: 'img/d2-grouped.png', alt: 'Final: a CRM Integration group with Zoho, HubSpot marked Default CRM, and Salesforce. Make Default appears only on the others.', pins: [[1, 25.5, 60], [2, 71.8, 40.2], [3, 16.5, 10.1]], notes: ['One Default CRM, in a badge', 'Switch default in one click', 'CRMs grouped, apart from email'] }
  ];
  var D4 = [
    { src: 'img/d4-compact.png', alt: 'First pass: a compact thread with one line per email and a Take Control reply box.', pins: [[4, 71, 10.1], [5, 65.1, 94.6]], notes: ['One line per email', 'Reply box and AI suggestion'] },
    { src: 'img/d4-expanded.png', alt: 'Final: a full email with sender, CC, the whole message and its attachments.', pins: [[4, 52.2, 30.8], [5, 94.5, 50], [6, 51.5, 75.6]], notes: ['CC visible', 'Full message', 'Attachments visible'] }
  ];
  function toggler(attr, data, img, fig, list) {
    function set(k) {
      var d = data[k]; var el = $(img); el.src = d.src; el.alt = d.alt;
      pinsInto($(fig), d.pins); notesInto($(list), d.pins, d.notes);
    }
    $$('[' + attr + ']').forEach(function (b, _, all) {
      b.addEventListener('click', function () { pressGroup(all, b); set(+b.getAttribute(attr)); });
    });
    set(1);
  }
  toggler('data-d2', D2, '#d2Img', '#d2Shot', '#d2Notes');
  toggler('data-d4', D4, '#d4Img', '#d4Shot', '#d4Notes');

  /* ---------- CRM capability map ---------- */
  var CAPS = [
    { title: 'Integration', sub: 'Connect a CRM, one default', kind: 'Settings list', src: 'img/d2-grouped.png', what: 'CRMs grouped in one list. One carries the Default badge, so leads never split across systems.' },
    { title: 'Lead capture', sub: 'ICP in chat, prospect lists', kind: 'Data table', src: 'img/prospects.png', what: 'The prospects Sarah found, one per row, so a manager can see who she is going to contact.' },
    { title: 'Lead status', sub: 'Seven reply categories', kind: 'Status labels', src: 'img/d3-cycle3.png', what: 'Seven reply categories in words. Each one tells the manager what to do next.' },
    { title: 'Activity history', sub: 'Email thread, CC, attachments', kind: 'Email thread', src: 'img/d4-expanded.png', what: 'The full email with sender, CC, message and attachments, so a person can take over with context.' },
    { title: 'Handoff', sub: 'Auto, Manual, Take Control', kind: 'Action row', src: 'img/takeover-rows.png', what: 'Each reply row shows Auto or Manual in words, with a Take Control action to step in.' },
    { title: 'Pipeline stages', sub: 'Six-stage campaign tracker', kind: 'Stage tracker', src: 'img/stage-tracker.png', what: 'A six-stage tracker shows where a campaign is, in plain words instead of a tool icon.' },
    { title: 'Reporting', sub: 'Funnel, meetings, inbox health', kind: 'Campaign view', src: 'img/d5-campaigns.png', what: 'Campaign results in one place: funnel, meetings and inbox health.' }
  ];
  var caps = $('#caps');
  CAPS.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cap';
    b.setAttribute('aria-label', 'Open full size: ' + c.title);
    b.innerHTML = '<span class="th"><img src="' + c.src + '" alt="" loading="lazy"></span><span class="bd"><b>' + c.title + '</b><span>' + c.sub + '</span><small>' + c.kind + '</small></span>';
    b.addEventListener('click', function () { openLb(CAPS.map(function (x) { return { src: x.src, title: x.title, text: x.kind + ': ' + x.what }; }), i, b); });
    caps.appendChild(b);
  });

  /* ---------- CRM sync concept ---------- */
  var SYNC = [
    { cls: 'ok', label: 'Synced to HubSpot', when: '2 min ago', fail: false },
    { cls: 'wait', label: 'Waiting to sync', when: 'Queued', fail: false },
    { cls: 'fail', label: 'Sync failed', when: 'HubSpot connection expired', fail: true }
  ];
  $$('[data-s]').forEach(function (b, _, all) {
    b.addEventListener('click', function () {
      pressGroup(all, b);
      var s = SYNC[+b.dataset.s];
      var st = $('#syncState'); st.className = 'state ' + s.cls; st.textContent = s.label;
      $('#syncWhen').textContent = s.when;
      $('#syncRetry').hidden = !s.fail;
    });
  });

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), lbSet = [], lbI = 0, lbReturn = null;
  function lbShow() {
    var x = lbSet[lbI];
    $('#lbImg').src = x.src; $('#lbImg').alt = x.text;
    $('#lbTitle').textContent = x.title;
    $('#lbText').textContent = x.text;
    $('#lbCount').textContent = lbSet.length > 1 ? (lbI + 1) + ' of ' + lbSet.length : '';
    $('#lbPrev').hidden = $('#lbNext').hidden = lbSet.length < 2;
  }
  function openLb(set, i, from) {
    lbSet = set; lbI = i; lbReturn = from || null; lbShow();
    if (typeof lb.showModal === 'function') { lb.showModal(); } else { lb.setAttribute('open', ''); }
  }
  $('#lbClose').addEventListener('click', function () { lb.close(); });
  $('#lbPrev').addEventListener('click', function () { lbI = (lbI + lbSet.length - 1) % lbSet.length; lbShow(); });
  $('#lbNext').addEventListener('click', function () { lbI = (lbI + 1) % lbSet.length; lbShow(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' && lbSet.length > 1) $('#lbNext').click();
    if (e.key === 'ArrowLeft' && lbSet.length > 1) $('#lbPrev').click();
  });
  lb.addEventListener('close', function () { if (lbReturn) lbReturn.focus(); });

  $$('.shot').forEach(function (fig) {
    function open() {
      var img = $('img', fig);
      var title = fig.closest('.decision') ? $('h3', fig.closest('.decision')).textContent.replace(/^\d+\.\s*/, '') : 'Product screen';
      openLb([{ src: img.getAttribute('src'), title: title, text: img.alt }], 0, fig);
    }
    fig.addEventListener('click', open);
    fig.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'Open screen full size');
  });
})();
