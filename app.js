(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById('event-data').textContent);
  var EVENTS = DATA.events;
  var USE_CASES = DATA.useCases;

  /* ---------------- theme ---------------- */
  var themeToggle = document.getElementById('themeToggle');
  function setTheme(mode){
    if(mode === 'system'){ document.documentElement.removeAttribute('data-theme'); }
    else { document.documentElement.setAttribute('data-theme', mode); }
    Array.prototype.forEach.call(themeToggle.querySelectorAll('button'), function(b){
      b.classList.toggle('active', b.dataset.theme === mode);
    });
    try{ localStorage.setItem('eig-theme', mode); }catch(e){}
  }
  themeToggle.addEventListener('click', function(e){
    var btn = e.target.closest('button'); if(!btn) return;
    setTheme(btn.dataset.theme);
  });
  (function(){
    var saved = 'system';
    try{ saved = localStorage.getItem('eig-theme') || 'system'; }catch(e){}
    setTheme(saved);
  })();

  /* ---------------- family colors ---------------- */
  var FAMILY_ORDER = ['Logon/Logoff','Account Management','Object Access','Policy Change',
    'DS Access','System','Detailed Tracking','Account Logon','Privilege Use'];
  var FAMILY_COLOR_VAR = {
    'Logon/Logoff':'--slot-blue',
    'Account Management':'--slot-orange',
    'Object Access':'--slot-aqua',
    'Policy Change':'--slot-yellow',
    'DS Access':'--slot-magenta',
    'System':'--slot-green',
    'Detailed Tracking':'--slot-violet',
    'Account Logon':'--slot-red',
    'Privilege Use':'--slot-gray'
  };
  function famColor(fam){
    var v = FAMILY_COLOR_VAR[fam] || '--slot-gray';
    return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  }
  var SEV_ORDER = ['Critical','High','Medium','Low'];
  var SEV_VAR = {Critical:'--st-critical', High:'--st-serious', Medium:'--st-warning', Low:'--slot-gray'};
  var SEV_FUN = {
    Critical: '🐆 Apex Predator',
    High: '🦂 Venomous',
    Medium: '🦝 Opportunist',
    Low: '🐛 Common Critter'
  };
  function sevColor(s){ return getComputedStyle(document.documentElement).getPropertyValue(SEV_VAR[s]||'--slot-gray').trim(); }

  var LOG_ORDER = ['Security','System','Application','PowerShell','Sysmon'];
  var LOG_ICON = {Security:'🔒', System:'⚙️', Application:'🧩', PowerShell:'💻', Sysmon:'🩻'};

  /* ---------------- OS coverage ---------------- */
  var OS_BUCKETS = [
    {key:'legacy', label:'Windows 2000 / XP and later', test:function(s){return /2000|XP/i.test(s);}},
    {key:'vista', label:'Windows Vista / Server 2008 — the Security-auditing baseline', test:function(s){return /vista/i.test(s);}},
    {key:'win7', label:'Windows 7 / Server 2008 R2 and later', test:function(s){return /windows 7/i.test(s);}},
    {key:'win8', label:'Windows 8 / Server 2012 and later', test:function(s){return /windows 8[^.]|windows 8$/i.test(s);}},
    {key:'win81', label:'Windows 8.1 / Server 2012 R2 and later', test:function(s){return /8\.1/.test(s);}},
    {key:'win10', label:'Windows 10 / Server 2016 and later — includes Windows 11 / Server 2019–2022, which kept the same Event ID scheme', test:function(s){return /windows 10/i.test(s);}},
    {key:'sysmon', label:'Sysmon (Sysinternals) — any currently-supported Windows version, client or server', test:function(s){return /sysmon/i.test(s);}},
    {key:'powershell', label:'PowerShell-Operational — depends on the installed PowerShell version, not the Windows release', test:function(s){return /powershell/i.test(s);}}
  ];
  function classifyOS(minOS){
    for(var i=0;i<OS_BUCKETS.length;i++){ if(OS_BUCKETS[i].test(minOS||'')) return OS_BUCKETS[i].key; }
    return 'other';
  }
  function buildOsCoverage(){
    var counts = {};
    EVENTS.forEach(function(e){ var k = classifyOS(e.minOS); counts[k] = (counts[k]||0)+1; });
    return OS_BUCKETS.map(function(b){ return {label:b.label, key:b.key, count: counts[b.key]||0}; }).filter(function(b){return b.count>0;});
  }

  /* ---------------- stat row ---------------- */
  (function(){
    var total = EVENTS.length;
    var critical = EVENTS.filter(function(e){return e.severity==='Critical';}).length;
    var families = new Set(EVENTS.filter(function(e){return e.log==='Security';}).map(function(e){return e.category;})).size;
    var habitats = new Set(EVENTS.map(function(e){return e.log;})).size;
    var stats = [
      [total, 'Specimens catalogued'],
      [habitats, 'Habitats (log sources)'],
      [families, 'Families (audit categories)'],
      [critical, 'Apex predators (critical)']
    ];
    var html = stats.map(function(s){
      return '<div class="stat-tile"><div class="num">'+s[0]+'</div><div class="lbl">'+s[1]+'</div></div>';
    }).join('');
    document.getElementById('statRow').innerHTML = html;

    document.getElementById('ledeText').textContent = total+' specimens from the Security, System, Application, PowerShell and Sysmon logs — cataloged with habitat, threat level, a specimen log, and the attacks they help you catch.';

    document.getElementById('coverageBanner').innerHTML =
      '<span class="cov-icon">🖥️</span><span><strong>OS coverage:</strong> Windows Vista / Server 2008 → Windows 11 / Server 2022+, plus Sysmon (any supported Windows version) and PowerShell 2.0+.</span>'+
      '<span class="cov-more">Full breakdown ↗</span>';
  })();
  document.getElementById('coverageBanner').addEventListener('click', function(){
    document.getElementById('btnAbout').click();
  });

  /* ---------------- tooltip ---------------- */
  var tooltipEl = document.getElementById('tooltip');
  function showTip(x,y,html){ tooltipEl.innerHTML = html; tooltipEl.style.left = x+'px'; tooltipEl.style.top=y+'px'; tooltipEl.classList.add('show'); }
  function hideTip(){ tooltipEl.classList.remove('show'); }

  /* ---------------- bar chart renderer ---------------- */
  function renderBars(containerId, items, opts){
    opts = opts || {};
    var container = document.getElementById(containerId);
    var max = Math.max.apply(null, items.map(function(i){return i.value;}));
    container.innerHTML = items.map(function(it){
      var pct = max ? (it.value/max*100) : 0;
      var fillStyle = it.striped ? '' : ('background:'+it.color+';');
      var fillClass = it.striped ? 'bar-fill stripe-fill' : 'bar-fill';
      return '<div class="bar-row" data-key="'+it.key+'" role="button" tabindex="0" aria-label="'+it.label+': '+it.value+'">'+
        '<div class="lbl">'+it.label+'</div>'+
        '<div class="bar-track"><div class="'+fillClass+'" style="width:'+pct+'%; '+fillStyle+'"></div></div>'+
        '<div class="val">'+it.value+'</div>'+
      '</div>';
    }).join('');
    Array.prototype.forEach.call(container.querySelectorAll('.bar-row'), function(row, idx){
      var it = items[idx];
      row.addEventListener('mouseenter', function(e){
        showTip(e.clientX, e.clientY, '<strong>'+it.label+'</strong><br>'+it.value+' event'+(it.value===1?'':'s'));
      });
      row.addEventListener('mousemove', function(e){ tooltipEl.style.left=e.clientX+'px'; tooltipEl.style.top=e.clientY+'px'; });
      row.addEventListener('mouseleave', hideTip);
      row.addEventListener('click', function(){ if(opts.onClick) opts.onClick(it.key, row); });
      row.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); if(opts.onClick) opts.onClick(it.key, row);} });
    });
  }

  function refreshCharts(){
    var famCounts = {};
    var sevCounts = {Critical:0,High:0,Medium:0,Low:0};
    var logCounts = {};
    EVENTS.forEach(function(e){
      if(e.log==='Security'){ famCounts[e.category] = (famCounts[e.category]||0)+1; }
      sevCounts[e.severity] = (sevCounts[e.severity]||0)+1;
      logCounts[e.log] = (logCounts[e.log]||0)+1;
    });
    var famItems = Object.keys(famCounts).sort(function(a,b){return famCounts[b]-famCounts[a];}).map(function(f){
      return {key:f, label:f, value:famCounts[f], color:famColor(f), striped: f==='Privilege Use'};
    });
    var sevItems = SEV_ORDER.map(function(s){
      return {key:s, label:s+' — '+SEV_FUN[s].split(' ').slice(1).join(' '), value:sevCounts[s]||0, color:sevColor(s)};
    });
    var logItems = LOG_ORDER.filter(function(l){return logCounts[l];}).map(function(l){
      return {key:l, label:(LOG_ICON[l]||'')+' '+l, value:logCounts[l]||0, color: 'var(--accent)'};
    });
    renderBars('chartFamily', famItems, {onClick:function(key){ toggleFamily(key); }});
    renderBars('chartSeverity', sevItems, {onClick:function(key){ toggleSeverityChip(key); }});
    renderBars('chartLog', logItems, {onClick:function(key){ toggleLogChip(key); }});
    markActiveBars();
  }
  function markActiveBars(){
    document.querySelectorAll('#chartFamily .bar-row').forEach(function(r){
      r.classList.toggle('is-active', state.family===r.dataset.key);
    });
    document.querySelectorAll('#chartSeverity .bar-row').forEach(function(r){
      r.classList.toggle('is-active', state.severity===r.dataset.key);
    });
    document.querySelectorAll('#chartLog .bar-row').forEach(function(r){
      r.classList.toggle('is-active', state.log===r.dataset.key);
    });
  }

  /* ---------------- filter state ---------------- */
  var state = { query:'', log:'All', severity:'All', family:null, realOnly:false };

  function toggleFamily(fam){ state.family = (state.family===fam) ? null : fam; applyFilters(); }
  function toggleLogChip(l){ state.log = (state.log===l) ? 'All' : l; renderLogChips(); applyFilters(); }
  function toggleSeverityChip(s){ state.severity = (state.severity===s) ? 'All' : s; renderSevChips(); applyFilters(); }

  function renderLogChips(){
    var counts = {};
    EVENTS.forEach(function(e){ counts[e.log]=(counts[e.log]||0)+1; });
    var chips = ['<button class="chip'+(state.log==='All'?' is-active':'')+'" data-log="All">All habitats</button>']
      .concat(LOG_ORDER.filter(function(l){return counts[l];}).map(function(l){
        return '<button class="chip'+(state.log===l?' is-active':'')+'" data-log="'+l+'">'+(LOG_ICON[l]||'')+' '+l+' ('+counts[l]+')</button>';
      }));
    document.getElementById('logChips').innerHTML = chips.join('');
  }
  function renderSevChips(){
    var realCount = EVENTS.filter(function(e){return e.realExample;}).length;
    var chips = ['<button class="chip'+(state.severity==='All'?' is-active':'')+'" data-sev="All">All threat levels</button>']
      .concat(SEV_ORDER.map(function(s){
        return '<button class="chip'+(state.severity===s?' is-active':'')+'" data-sev="'+s+'"><span class="dot" style="background:'+sevColor(s)+'"></span>'+s+'</button>';
      }))
      .concat(['<button class="chip'+(state.realOnly?' is-active':'')+'" id="realOnlyChip">🧾 Real examples only ('+realCount+')</button>']);
    document.getElementById('sevChips').innerHTML = chips.join('');
  }
  document.getElementById('logChips').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    state.log = b.dataset.log; renderLogChips(); applyFilters();
  });
  document.getElementById('sevChips').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    if(b.id === 'realOnlyChip'){ state.realOnly = !state.realOnly; renderSevChips(); applyFilters(); return; }
    state.severity = b.dataset.sev; renderSevChips(); applyFilters();
  });
  document.getElementById('clearFilters').addEventListener('click', function(){
    state = {query:'', log:'All', severity:'All', family:null, realOnly:false};
    document.getElementById('searchInput').value='';
    renderLogChips(); renderSevChips(); toggleSearchButtons(); applyFilters();
  });
  function toggleSearchButtons(){
    var has = !!state.query;
    document.getElementById('searchClearX').classList.toggle('show', has);
    document.getElementById('removeSearchBtn').classList.toggle('show', has);
  }
  function removeSearchFilter(){
    state.query = '';
    document.getElementById('searchInput').value = '';
    toggleSearchButtons();
    applyFilters();
    document.getElementById('searchInput').focus();
  }
  document.getElementById('searchInput').addEventListener('input', function(e){
    state.query = e.target.value.trim().toLowerCase();
    toggleSearchButtons();
    applyFilters();
  });
  document.getElementById('searchClearX').addEventListener('click', removeSearchFilter);
  document.getElementById('removeSearchBtn').addEventListener('click', removeSearchFilter);

  /* ---------------- table ---------------- */
  var sortState = {key:'id', dir:1};
  function matches(e){
    if(state.log!=='All' && e.log!==state.log) return false;
    if(state.severity!=='All' && e.severity!==state.severity) return false;
    if(state.family && e.category!==state.family) return false;
    if(state.realOnly && !e.realExample) return false;
    if(state.query){
      var q = state.query;
      var hay = (e.id+' '+e.summary+' '+e.category+' '+e.subcategory+' '+e.detail+' '+e.log+' '+(e.useCases||[]).join(' ')).toLowerCase();
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  }
  function sevRank(s){ return SEV_ORDER.indexOf(s); }
  function sortEvents(list){
    var key = sortState.key, dir = sortState.dir;
    return list.slice().sort(function(a,b){
      var av,bv;
      if(key==='severity'){ av=sevRank(a.severity); bv=sevRank(b.severity); }
      else if(key==='id'){ av=a.id; bv=b.id; }
      else { av=(a[key]||'').toString().toLowerCase(); bv=(b[key]||'').toString().toLowerCase(); }
      if(av<bv) return -1*dir;
      if(av>bv) return 1*dir;
      return a.id-b.id;
    });
  }
  function escapeHtml(s){
    return (s||'').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function escapeRegex(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function highlight(text, query){
    var safe = escapeHtml(text);
    if(!query) return safe;
    var re = new RegExp('('+escapeRegex(query)+')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }
  function renderTable(){
    var filtered = sortEvents(EVENTS.filter(matches));
    var countEl = document.getElementById('resultCount');
    countEl.innerHTML = state.query
      ? '<strong>'+filtered.length+'</strong> result'+(filtered.length===1?'':'s')+' for “'+escapeHtml(state.query)+'” (out of '+EVENTS.length+' specimens)'
      : filtered.length+' of '+EVENTS.length+' specimens shown';
    var body = document.getElementById('tableBody');
    if(!filtered.length){
      body.innerHTML = '<tr class="empty-row"><td colspan="5">No specimens match this search. Try a broader term or use "Remove Search Filter".</td></tr>';
      return;
    }
    body.innerHTML = filtered.map(function(e){
      return '<tr data-id="'+e.id+'">'+
        '<td class="id-num">'+highlight(''+e.id, state.query)+(e.realExample ? ' <span class="real-dot" title="Has a real-world log example">🧾</span>' : '')+'</td>'+
        '<td><span class="log-badge">'+(LOG_ICON[e.log]||'')+' '+highlight(e.log, state.query)+'</span></td>'+
        '<td><span class="fam-badge"><span class="dot" style="background:'+famColor(e.category)+'"></span>'+highlight(e.category, state.query)+'</span></td>'+
        '<td><span class="sev-chip" style="background:color-mix(in srgb, '+sevColor(e.severity)+' 16%, transparent); color:'+sevColor(e.severity)+'">'+e.severity+'</span></td>'+
        '<td class="summary-cell">'+highlight(e.summary, state.query)+'</td>'+
      '</tr>';
    }).join('');
    Array.prototype.forEach.call(body.querySelectorAll('tr[data-id]'), function(row){
      row.addEventListener('click', function(){ openModal(parseInt(row.dataset.id,10)); });
    });
  }
  function applyFilters(){ renderTable(); markActiveBars(); }

  document.querySelectorAll('table.evt thead th[data-key]').forEach(function(th){
    th.addEventListener('click', function(){
      var key = th.dataset.key;
      if(sortState.key===key){ sortState.dir *= -1; } else { sortState.key=key; sortState.dir=1; }
      document.querySelectorAll('table.evt thead th .arrow').forEach(function(a){a.textContent='';});
      th.querySelector('.arrow').textContent = sortState.dir===1 ? '▲' : '▼';
      renderTable();
    });
  });

  /* ---------------- word cloud ---------------- */
  var STOPWORDS = new Set(('the a an of to in on for is was were be been being and or but not with as by at from this that these those it its into has have had will would can could should may might account object process security windows event system service information logon subject data name domain'.split(' ')));
  function buildWordCloud(){
    var freq = {};
    EVENTS.forEach(function(e){
      var text = (e.summary+' '+e.category+' '+e.subcategory).toLowerCase();
      text.replace(/[^a-z]+/g,' ').split(' ').forEach(function(w){
        if(w.length<4 || STOPWORDS.has(w)) return;
        freq[w] = (freq[w]||0)+1;
      });
    });
    var words = Object.keys(freq).map(function(w){return {w:w, n:freq[w]};})
      .sort(function(a,b){return b.n-a.n;}).slice(0,55);
    var max = words[0].n, min = words[words.length-1].n;
    // shuffle deterministically for organic layout
    var seed = 42;
    function rnd(){ seed = (seed*9301+49297)%233280; return seed/233280; }
    words.sort(function(){ return rnd()-0.5; });
    var slots = ['--slot-blue','--slot-orange','--slot-aqua','--slot-yellow','--slot-magenta','--slot-green','--slot-violet','--slot-red'];
    var html = words.map(function(item, i){
      var scale = max===min ? 0.5 : (item.n-min)/(max-min);
      var size = 13 + scale*38;
      var colorVar = slots[i % slots.length];
      var rot = (rnd()*6-3).toFixed(1);
      return '<button style="font-size:'+size.toFixed(0)+'px; color:var('+colorVar+'); transform:rotate('+rot+'deg);" data-word="'+item.w+'" title="'+item.n+' occurrences">'+item.w+'</button>';
    }).join('');
    document.getElementById('wordCloud').innerHTML = html;
  }
  document.getElementById('wordCloud').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    document.getElementById('searchInput').value = b.dataset.word;
    state.query = b.dataset.word;
    toggleSearchButtons();
    applyFilters();
    document.getElementById('explore').scrollIntoView({behavior:'smooth', block:'start'});
  });

  /* ---------------- use cases ---------------- */
  function buildUseCases(){
    var byId = {};
    EVENTS.forEach(function(e){ byId[e.id]=e; });
    var html = USE_CASES.map(function(uc){
      var chips = uc.ids.map(function(id){
        var known = byId[id];
        var label = known ? id : (id+'*');
        return '<button class="uc-id-chip" data-id="'+id+'">'+label+'</button>';
      }).join('');
      return '<div class="card uc-card">'+
        '<h3>'+escapeHtml(uc.name)+'</h3>'+
        '<p>'+escapeHtml(uc.description)+'</p>'+
        '<div class="uc-ids">'+chips+'</div>'+
      '</div>';
    }).join('');
    document.getElementById('ucGrid').innerHTML = html;
  }
  document.getElementById('ucGrid').addEventListener('click', function(e){
    var b = e.target.closest('button'); if(!b) return;
    var id = parseInt(b.dataset.id,10);
    var exists = EVENTS.some(function(ev){return ev.id===id;});
    if(exists) openModal(id);
  });

  /* ---------------- modal ---------------- */
  var backdrop = document.getElementById('modalBackdrop');
  var modalCard = document.getElementById('modalCard');
  function openModal(id){
    var e = EVENTS.find(function(ev){return ev.id===id;});
    if(!e) return;
    var fun = SEV_FUN[e.severity] || '';
    modalCard.innerHTML =
      '<div class="modal-head">'+
        '<div class="idbig">'+e.id+'</div>'+
        '<div class="titles">'+
          '<h2>'+escapeHtml(e.summary)+'</h2>'+
          '<div class="modal-badges">'+
            '<span class="log-badge">'+(LOG_ICON[e.log]||'')+' '+e.log+'</span>'+
            '<span class="fam-badge"><span class="dot" style="background:'+famColor(e.category)+'"></span>'+escapeHtml(e.category)+(e.subcategory? ' · '+escapeHtml(e.subcategory):'')+'</span>'+
            '<span class="sev-chip" style="background:color-mix(in srgb, '+sevColor(e.severity)+' 16%, transparent); color:'+sevColor(e.severity)+'">'+e.severity+'</span>'+
          '</div>'+
          '<div class="fun-tag" style="margin-top:6px;">'+fun+'</div>'+
        '</div>'+
        '<button class="modal-close" id="modalCloseBtn" aria-label="Close">✕</button>'+
      '</div>'+
      '<div class="modal-body">'+
        '<div class="modal-section"><h4>Field notes</h4><p>'+escapeHtml(e.detail || e.summary)+'</p></div>'+
        (e.realExample ?
          '<div class="modal-section"><h4>Real-world example <span class="real-badge">🧾 verified capture</span></h4>'+
            '<div class="console console-real">'+escapeHtml(e.realExample)+'</div>'+
            (e.realExampleNote ? '<p class="real-note">'+escapeHtml(e.realExampleNote)+'</p>' : '')+
            '<p class="real-source">Captured by a FortiSIEM Windows Agent / Host Collector, reformatted for legibility · <a href="'+e.realExampleSource+'" target="_blank" rel="noopener">source ↗</a></p>'+
          '</div>' : '')+
        '<div class="modal-section"><h4>'+(e.realExample ? 'Synthesized log example' : 'Specimen log example')+'</h4><div class="console">'+escapeHtml(e.example||'—')+'</div></div>'+
        (e.useCases && e.useCases.length ? '<div class="modal-section"><h4>Spotted in these attacks</h4><div class="uc-ids">'+
          e.useCases.map(function(u){return '<span class="uc-id-chip" style="cursor:default;">'+escapeHtml(u)+'</span>';}).join('')+
        '</div></div>' : '')+
        '<div class="modal-footer-row">'+
          '<span class="minos">Minimum OS: '+escapeHtml(e.minOS||'—')+'</span>'+
          '<a class="btn" href="'+e.link+'" target="_blank" rel="noopener">Learn more ↗</a>'+
        '</div>'+
      '</div>';
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    backdrop.classList.add('open');
  }
  function closeModal(){ backdrop.classList.remove('open'); modalCard.innerHTML=''; }
  backdrop.addEventListener('click', function(e){ if(e.target===backdrop) closeModal(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

  function openInfoModal(title, bodyHtml){
    modalCard.className = 'modal info-modal';
    modalCard.innerHTML =
      '<div class="modal-head">'+
        '<div class="titles"><h2>'+title+'</h2></div>'+
        '<button class="modal-close" id="modalCloseBtn" aria-label="Close">✕</button>'+
      '</div>'+
      '<div class="modal-body"><div class="info-body">'+bodyHtml+'</div></div>';
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    backdrop.classList.add('open');
  }
  var _openModal = openModal;
  openModal = function(id){ modalCard.className='modal'; _openModal(id); };

  /* ---------------- version / release notes / about ---------------- */
  // The Release Notes button renders the ACTUAL RELEASE_NOTES.md file, embedded
  // verbatim in the page and parsed as Markdown here - so the in-app viewer and
  // the repo's markdown file can never drift out of sync with each other.
  var RELEASE_NOTES_MD = document.getElementById('release-notes-md').textContent;

  function mdInline(s){
    s = escapeHtml(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/([\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');
    s = s.replace(/(^|[^"'>=])(https?:\/\/[^\s<()]+)/g, function(m, pre, url){ return pre+'<a href="'+url+'" target="_blank" rel="noopener">'+url+'</a>'; });
    return s;
  }
  function mdToHtml(md){
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var out = [], list = [];
    function flushList(){ if(list.length){ out.push('<ul>'+list.map(function(li){return '<li>'+mdInline(li)+'</li>';}).join('')+'</ul>'); list = []; } }
    lines.forEach(function(line){
      var m;
      if(/^#\s/.test(line)){ flushList(); return; } // doc H1 duplicates the modal's own title
      if((m = line.match(/^##\s+(.+)$/))){
        flushList();
        var text = m[1];
        var current = /\(current\)/i.test(text);
        text = text.replace(/\s*\(current\)\s*$/i, '');
        var vm = text.match(/^(.+?)\s+—\s+(.+)$/);
        out.push('<h4 class="rn-version">'+(vm ? escapeHtml(vm[1])+' <span class="rn-date">— '+escapeHtml(vm[2])+'</span>' : mdInline(text))+
          (current ? ' <span class="rn-current">Current</span>' : '')+'</h4>');
        return;
      }
      if(/^---\s*$/.test(line)){ flushList(); out.push('<hr>'); return; }
      if((m = line.match(/^-\s+(.+)$/))){ list.push(m[1]); return; }
      if(line.trim()===''){ flushList(); return; }
      flushList();
      out.push(/^Built by /.test(line) ? '<div class="credit-card">'+mdInline(line)+'</div>' : '<p>'+mdInline(line)+'</p>');
    });
    flushList();
    return out.join('');
  }

  var APP_VERSION = (RELEASE_NOTES_MD.match(/^##\s+v?([\d.]+)/m) || [,'?'])[1];
  document.getElementById('versionBadge').textContent = 'v'+APP_VERSION;

  document.getElementById('btnReleaseNotes').addEventListener('click', function(){
    openInfoModal('Release notes', mdToHtml(RELEASE_NOTES_MD));
  });
  document.getElementById('versionBadge').addEventListener('click', function(){
    openInfoModal('Release notes', mdToHtml(RELEASE_NOTES_MD));
  });
  document.getElementById('versionBadge').style.cursor = 'pointer';

  var SOURCE_LINKS = [
    ['https://www.ultimatewindowssecurity.com/securitylog/encyclopedia/default.aspx', 'Ultimate Windows Security — Security Log Encyclopedia (per-event "Learn more" links throughout the guide)'],
    ['https://ss64.com/ps/syntax-eventids.html', 'ss64.com — Event ID reference, incl. PowerShell-Operational logging (4103, 4104, 400, 800…)'],
    ['https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor', 'Microsoft Learn — Appendix L: Events to Monitor (AD DS)'],
    ['https://infrasos.com/complete-list-of-windows-event-ids-for-active-directory/', 'InfraSOS — Complete list of Windows Event IDs for Active Directory'],
    ['https://www.tenfold-security.com/en/windows-event-viewer-ids/', 'tenfold Security — Windows Event Viewer IDs'],
    ['https://www.beyondtrust.com/blog/entry/windows-server-events-monitor', 'BeyondTrust — Windows Server events to monitor'],
    ['https://docs.fortinet.com/document/fortisiem/7.6.0/user-guide/229261/sample-windows-agent-logs', 'Fortinet FortiSIEM docs — Sample Windows agent logs (source of the real-world "🧾 verified capture" log examples on select Event IDs)'],
    ['https://gist.github.com/githubfoam/69eee155e4edafb2e679fb6ac5ea47d0', 'GitHub Gist (githubfoam) — Windows Event ID list'],
    ['https://github.com/PerryvandenHondel/windows-event-id-list-csv/blob/master/windows-event-id.csv', 'GitHub (PerryvandenHondel) — windows-event-id-list-csv']
  ];
  function renderAbout(){
    var links = SOURCE_LINKS.map(function(s){
      return '<li><a href="'+s[0]+'" target="_blank" rel="noopener">'+s[0].replace(/^https?:\/\//,'')+'</a> — '+s[1]+'</li>';
    }).join('');
    var osRows = buildOsCoverage().map(function(b){
      return '<li><strong>'+b.count+'</strong> — '+b.label+'</li>';
    }).join('');
    return ''+
      '<h3>Objective</h3>'+
      '<p>The Event ID Field Guide turns the dry, alphabet-soup task of looking up Windows Event IDs into something analysts and students actually want to browse — a searchable, chart-driven, slightly tongue-in-cheek "field guide" that pairs every Event ID with its category, a realistic example log, and the real-world attacks it helps you detect.</p>'+
      '<p><strong>Scope:</strong> the guide\'s core is <strong>Windows Auditing (Security) Logs and Sysmon Logs</strong> — together the two richest sources of security telemetry Windows produces — with supporting coverage of the System, Application and PowerShell-Operational logs, since real investigations constantly need to cross-reference all of them.</p>'+
      '<h3>Real-world log examples</h3>'+
      '<p>Every specimen ships with a synthesized example log, built by filling in Microsoft\'s own message field templates with representative sample data. For '+EVENTS.filter(function(e){return e.realExample;}).length+' of them, marked with a <span class="real-badge">🧾 verified capture</span> badge, the detail panel also shows a second, <em>genuine</em> log line lifted from Fortinet\'s own FortiSIEM documentation of what its Windows Agent actually captures in the field — real hostnames, real process paths, real timestamps. Use the "🧾 Real examples only" filter chip above the table to find them.</p>'+
      '<h3>Windows version coverage</h3>'+
      '<p>Baseline: <strong>Windows Vista / Windows Server 2008</strong> — the release where Microsoft introduced the modern audit-subcategory model and the 4xxx/5xxx-series Security Event IDs used throughout this guide. Coverage continues forward through every later release up to <strong>Windows 11 and Server 2022</strong>, since Microsoft has not changed this Event ID numbering scheme since Windows 10 shipped (newer releases just aren\'t individually re-stamped in the source documentation). Events with a later "minimum OS" below were introduced in that specific release and won\'t appear on older systems.</p>'+
      '<ul>'+osRows+'</ul>'+
      '<p><strong>Not covered:</strong> the legacy pre-Vista Event ID numbering used on Windows 2000, XP and Server 2003 (e.g. logon used ID 528/540, not 4624) — Microsoft renumbered almost the entire Security auditing scheme in Vista, and that older scheme is a different, out-of-scope taxonomy. A handful of System-log events (the Eventlog service, Service Control Manager, User32 shutdown tracking) do trace back to Windows 2000/XP, since those providers predate the Vista overhaul.</p>'+
      '<h3>Built with</h3>'+
      '<ul>'+
        '<li><strong>Claude Code (Anthropic, Claude Sonnet 5)</strong> — the AI engineering agent that designed and wrote the entire application: the data pipeline, the visual design system, the charts, the word cloud, and all search/filter/sort logic.</li>'+
        '<li><strong>Python 3 + openpyxl</strong> — a build script that parsed the source Excel workbook ("Security Audit Events" and "Complete Event Messages" sheets), classified severity and attack use-cases, and synthesized realistic example log entries by filling in Microsoft\'s own message field templates.</li>'+
        '<li><strong>Vanilla HTML5 / CSS3 / JavaScript</strong> — no frameworks, no build step and no runtime dependencies; the '+EVENTS.length+'-event dataset is embedded directly in the page as JSON and every chart, filter and the word cloud are hand-rolled.</li>'+
        '<li><strong>Google Fonts</strong> — Fraunces (display serif), IBM Plex Sans (body/UI) and IBM Plex Mono (Event IDs and log examples).</li>'+
      '</ul>'+
      '<h3>Research &amp; data sources</h3>'+
      '<p>The core taxonomy — every Security-log category, subcategory, Event ID and field description — comes from the bundled Microsoft Security Auditing reference spreadsheet. The sites below were used as the research sources for the curated System / Application / PowerShell / Sysmon entries, the threat-level ratings, the attack-playbook mappings, and the per-event "Learn more" links:</p>'+
      '<ul>'+links+'</ul>'+
      '<hr>'+
      '<div class="credit-card">Built by <strong>Claude AI</strong> (Anthropic) from an idea and direction by <strong>Rafael Righi</strong> — <a href="mailto:rrighi@fortinet.com">rrighi@fortinet.com</a>.</div>';
  }
  document.getElementById('btnAbout').addEventListener('click', function(){
    openInfoModal('About this guide', renderAbout());
  });

  /* ---------------- export (CSV / TXT, respects active filters) ---------------- */
  function csvEscape(v){
    v = (v===null||v===undefined) ? '' : String(v);
    if(/[",\n\r]/.test(v)) v = '"'+v.replace(/"/g,'""')+'"';
    return v;
  }
  function buildCSV(rows){
    var headers = ['Event ID','Habitat','Family','Subcategory','Severity','Summary','Minimum OS','Use Cases','Learn More'];
    var lines = [headers.map(csvEscape).join(',')];
    rows.forEach(function(e){
      lines.push([e.id, e.log, e.category, e.subcategory||'', e.severity, e.summary, e.minOS||'', (e.useCases||[]).join('; '), e.link||''].map(csvEscape).join(','));
    });
    return lines.join('\r\n');
  }
  function buildTXT(rows){
    var sep = new Array(64).join('-');
    return rows.map(function(e){
      var lines = [
        'Event ID: '+e.id,
        'Habitat: '+e.log,
        'Family / Category: '+e.category+(e.subcategory ? ' > '+e.subcategory : ''),
        'Threat level: '+e.severity,
        'Summary: '+e.summary,
        'Minimum OS: '+(e.minOS||'-')
      ];
      if(e.useCases && e.useCases.length) lines.push('Attack use cases: '+e.useCases.join('; '));
      lines.push('Learn more: '+(e.link||'-'));
      return lines.join('\n');
    }).join('\n'+sep+'\n');
  }
  function currentResults(){ return sortEvents(EVENTS.filter(matches)); }
  function exportFilename(ext){
    var d = new Date();
    var pad = function(n){ return (n<10?'0':'')+n; };
    var stamp = d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+'-'+pad(d.getHours())+pad(d.getMinutes());
    return 'event-id-field-guide_'+stamp+'.'+ext;
  }
  function downloadFile(filename, mimeType, content){
    function fallback(){
      try{
        var blob = new Blob([content], {type: mimeType});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
      }catch(err){ window.alert('Could not export file: '+err.message); }
    }
    if(window.claude && typeof window.claude.use === 'function'){
      window.claude.use('downloads').then(function(d){
        if(!d){ fallback(); return; }
        var blob = new Blob([content], {type: mimeType});
        d.save({filename: filename, data: blob}).catch(fallback);
      }, fallback);
    } else {
      fallback();
    }
  }
  document.getElementById('exportCsvBtn').addEventListener('click', function(){
    downloadFile(exportFilename('csv'), 'text/csv', buildCSV(currentResults()));
  });
  document.getElementById('exportTxtBtn').addEventListener('click', function(){
    downloadFile(exportFilename('txt'), 'text/plain', buildTXT(currentResults()));
  });

  /* ---------------- settings: local network access ---------------- */
  var NET_KEY = 'eig-network-settings';
  function loadNetSettings(){
    try{ var raw = localStorage.getItem(NET_KEY); return raw ? JSON.parse(raw) : {ip:'', port:''}; }
    catch(e){ return {ip:'', port:''}; }
  }
  function saveNetSettings(s){ try{ localStorage.setItem(NET_KEY, JSON.stringify(s)); }catch(e){} }
  function copyText(text, btn){
    function done(ok){
      var orig = btn.textContent;
      btn.textContent = ok ? 'Copied!' : 'Copy failed';
      setTimeout(function(){ btn.textContent = orig; }, 1500);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){done(true);}, function(){done(false);});
    } else {
      try{
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
        done(true);
      }catch(e){ done(false); }
    }
  }
  function updateNetworkBanner(){
    var s = loadNetSettings();
    var el = document.getElementById('networkBanner');
    if(s.ip && s.port){
      el.style.display = 'flex';
      var url = 'http://'+s.ip+':'+s.port+'/';
      el.innerHTML = '📡 Also configured to run on your network at <a href="'+escapeHtml(url)+'">'+escapeHtml(url)+'</a><button id="netBannerSettingsBtn" type="button">Edit</button>';
      document.getElementById('netBannerSettingsBtn').addEventListener('click', openSettingsModal);
    } else {
      el.style.display = 'none';
      el.innerHTML = '';
    }
  }
  function renderSettings(){
    var s = loadNetSettings();
    var hasBoth = s.ip && s.port;
    return ''+
      '<h3>Local network access</h3>'+
      '<p>This page is a self-contained file with no server of its own, so it can\'t bind itself to a network address by clicking a button here. What it <em>can</em> do is remember the address you plan to host it at and hand you ready-to-copy commands to launch it there — either containerized with Docker or as a quick one-line test server — then any device on that network can open the Access URL below.</p>'+
      '<div class="settings-row">'+
        '<div class="settings-field">'+
          '<label for="settingsIp">Interface IP</label>'+
          '<input type="text" id="settingsIp" placeholder="e.g. 192.168.3.100" value="'+escapeHtml(s.ip||'')+'" autocomplete="off">'+
          '<div class="hint">The LAN IP of the machine that will host this file. Use 0.0.0.0 to listen on every interface.</div>'+
        '</div>'+
        '<div class="settings-field" style="max-width:130px;">'+
          '<label for="settingsPort">Port</label>'+
          '<input type="number" id="settingsPort" placeholder="8080" min="1" max="65535" value="'+escapeHtml(s.port||'')+'" autocomplete="off">'+
        '</div>'+
      '</div>'+
      '<div class="settings-field">'+
        '<label>Access URL (share this with your team)</label>'+
        '<div class="settings-output"><span id="settingsUrlOut">'+(hasBoth ? escapeHtml('http://'+s.ip+':'+s.port+'/') : '— fill in the IP and port above —')+'</span>'+
          '<button class="copy-btn" id="copyUrlBtn" type="button">Copy</button></div>'+
      '</div>'+
      '<div class="settings-field">'+
        '<label>Launch command — Docker (recommended)</label>'+
        '<div class="settings-output"><span id="settingsDockerOut">'+(hasBoth ? escapeHtml('HOST_IP='+s.ip+' HOST_PORT='+s.port+' docker compose up -d') : '— fill in the IP and port above —')+'</span>'+
          '<button class="copy-btn" id="copyDockerBtn" type="button">Copy</button></div>'+
        '<div class="hint">Run this from a terminal in the project folder (it has a Dockerfile and docker-compose.yml) on the machine at that IP. Builds a small nginx-based image and serves the app on the Access URL above.</div>'+
      '</div>'+
      '<div class="settings-field">'+
        '<label>Launch command — Python (quick test, no Docker)</label>'+
        '<div class="settings-output"><span id="settingsCmdOut">'+(hasBoth ? escapeHtml('python3 -m http.server '+s.port+' --bind '+s.ip) : '— fill in the IP and port above —')+'</span>'+
          '<button class="copy-btn" id="copyCmdBtn" type="button">Copy</button></div>'+
        '<div class="hint">Run this from a terminal, inside the folder that contains this app\'s index.html, on the machine at that IP — any browser on the same network can then reach the Access URL above.</div>'+
      '</div>'+
      '<div class="settings-note">Saved only in this browser (local storage) as a reminder of where you\'ve deployed the app — it does not change where the page you\'re looking at right now is running.</div>';
  }
  function wireSettingsModal(){
    function refreshOutputs(){
      var ip = document.getElementById('settingsIp').value.trim();
      var port = document.getElementById('settingsPort').value.trim();
      saveNetSettings({ip:ip, port:port});
      var urlOut = document.getElementById('settingsUrlOut');
      var cmdOut = document.getElementById('settingsCmdOut');
      var dockerOut = document.getElementById('settingsDockerOut');
      if(ip && port){
        urlOut.textContent = 'http://'+ip+':'+port+'/';
        cmdOut.textContent = 'python3 -m http.server '+port+' --bind '+ip;
        dockerOut.textContent = 'HOST_IP='+ip+' HOST_PORT='+port+' docker compose up -d';
      } else {
        urlOut.textContent = '— fill in the IP and port above —';
        cmdOut.textContent = '— fill in the IP and port above —';
        dockerOut.textContent = '— fill in the IP and port above —';
      }
      updateNetworkBanner();
    }
    document.getElementById('settingsIp').addEventListener('input', refreshOutputs);
    document.getElementById('settingsPort').addEventListener('input', refreshOutputs);
    document.getElementById('copyUrlBtn').addEventListener('click', function(){ copyText(document.getElementById('settingsUrlOut').textContent, this); });
    document.getElementById('copyCmdBtn').addEventListener('click', function(){ copyText(document.getElementById('settingsCmdOut').textContent, this); });
    document.getElementById('copyDockerBtn').addEventListener('click', function(){ copyText(document.getElementById('settingsDockerOut').textContent, this); });
  }
  function openSettingsModal(){
    openInfoModal('Settings', renderSettings());
    wireSettingsModal();
  }
  document.getElementById('btnSettings').addEventListener('click', openSettingsModal);

  /* ---------------- init ---------------- */
  renderLogChips();
  renderSevChips();
  refreshCharts();
  renderTable();
  buildWordCloud();
  buildUseCases();
  updateNetworkBanner();
})();
