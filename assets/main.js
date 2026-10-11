(() => {
  'use strict';

  const account = 'LonzilFox';
  const CATEGORY_TOPICS = {
    tools: 'DEV / TOOLS', game: 'GAMES / MODS', ai: 'AI / VISION',
    automation: 'AUTOMATION', web: 'WEB / APPS', creative: 'CREATIVE',
    security: 'SECURITY', unclassified: 'UNCLASSIFIED'
  };
  const CATEGORY_ORDER = Object.keys(CATEGORY_TOPICS);
  const CATEGORY_COLORS = ['#f6324e', '#ac7cff', '#51c8dd', '#e7b36c', '#ff6d9d', '#a0bb80'];
  const $ = selector => document.querySelector(selector);
  const grid = $('#projectsGrid');
  let allProjects = [];
  let filter = 'all';
  let search = '';
  let sort = 'featured';
  let liveFeed = false;
  let dataSource = 'INITIALIZING';
  function readMotionPreference() { try { return window.localStorage.getItem('lf-motion'); } catch { return null; } }
  function saveMotionPreference(value) { try { window.localStorage.setItem('lf-motion', value); } catch {} }
  let motion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && readMotionPreference() !== 'off';
  document.body.classList.toggle('motion-off', !motion);

  function safeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function validCategories(topics) {
    const result = [...new Set((Array.isArray(topics) ? topics : [])
      .map(topic => /^category-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(String(topic).toLowerCase()))
      .filter(Boolean).map(match => match[1]))];
    return result.length ? result : ['unclassified'];
  }
  function displayCategory(category) {
    return CATEGORY_TOPICS[category] || category.replaceAll('-', ' ').toUpperCase();
  }
  function badgeColor(category) {
    const ix = CATEGORY_ORDER.indexOf(category);
    if (category === 'unclassified') return '#8c828a';
    if (ix >= 0) return CATEGORY_COLORS[ix % CATEGORY_COLORS.length];
    let hash = 0;
    for (const chr of category) hash = (hash * 31 + chr.charCodeAt(0)) >>> 0;
    return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
  }
  function normalize(repo) {
    if (!repo || typeof repo.name !== 'string') return null;
    if (repo.name.toLowerCase() === account.toLowerCase() || repo.name.toLowerCase() === `${account.toLowerCase()}.github.io`) return null;
    if (repo.private || (repo.visibility && repo.visibility !== 'public')) return null;
    const topics = Array.isArray(repo.topics) ? repo.topics.filter(topic => typeof topic === 'string').map(s => s.toLowerCase()) : [];
    if (repo.fork && !validCategories(topics).some(category => category !== 'unclassified')) return null;
    return {
      name: repo.name,
      html_url: `https://github.com/${account}/${encodeURIComponent(repo.name)}`,
      description: repo.description || '', topics,
      language: repo.language || '',
      stargazers_count: repo.stargazers_count || 0,
      updated_at: repo.pushed_at || repo.updated_at || '',
      archived: Boolean(repo.archived),
      categories: validCategories(topics)
    };
  }
  function setProjects(repos, source) {
    allProjects = repos.map(normalize).filter(Boolean);
    liveFeed = source === 'GITHUB LIVE API';
    dataSource = source;
    makeFilters();
    renderProjects();
    $('#feedIndicator').innerHTML = `<span class="live-dot"></span> ${safeText(source)}`;
  }
  function categoryKeys() {
    const present = new Set(allProjects.flatMap(project => project.categories));
    return [ ...CATEGORY_ORDER.filter(k => present.has(k) && k !== 'unclassified'),
      ...[...present].filter(k => !CATEGORY_ORDER.includes(k)).sort(),
      ...(present.has('unclassified') ? ['unclassified'] : []) ];
  }
  function makeFilters() {
    const categories = categoryKeys();
    if (filter !== 'all' && !categories.includes(filter)) filter = 'all';
    $('#filterList').innerHTML = [
      `<button class="filter ${filter==='all'?'active':''}" data-filter="all" type="button" aria-pressed="${filter==='all'}">ALL SIGNALS <span>↗</span></button>`,
      ...categories.map(category => `<button class="filter ${filter===category?'active':''}" style="--category-color:${badgeColor(category)}" data-filter="${category}" type="button" aria-pressed="${filter===category}">${safeText(displayCategory(category))} <small>${allProjects.filter(p=>p.categories.includes(category)).length}</small></button>`)
    ].join('');
  }
  function getVisible() {
    const needle = search.trim().toLowerCase();
    const projects = allProjects.filter(project => {
      if (filter !== 'all' && !project.categories.includes(filter)) return false;
      return !needle || [project.name, project.description, project.language, ...project.categories, ...project.topics].join(' ').toLowerCase().includes(needle);
    });
    projects.sort((a,b) => {
      if (sort === 'recent') return Date.parse(b.updated_at||0)-Date.parse(a.updated_at||0) || a.name.localeCompare(b.name);
      if (sort === 'stars') return b.stargazers_count-a.stargazers_count || a.name.localeCompare(b.name);
      if (sort === 'name') return a.name.localeCompare(b.name);
      const af = Number(a.topics.includes('portfolio-featured') || a.topics.includes('featured'));
      const bf = Number(b.topics.includes('portfolio-featured') || b.topics.includes('featured'));
      return bf-af || b.stargazers_count-a.stargazers_count || a.name.localeCompare(b.name);
    });
    return projects;
  }
  function projectCard(project,index) {
    const category = project.categories[0];
    const labels = project.categories.map(cat => `<span class="card-category" style="--category-color:${badgeColor(cat)}">${safeText(displayCategory(cat))}</span>`).join('');
    const topics = project.topics.filter(t=>!t.startsWith('category-') && t !== 'featured' && t !== 'portfolio-featured');
    const tech = [...topics.slice(0,4), ...(project.language && !topics.includes(project.language.toLowerCase()) ? [project.language] : [])].slice(0,5);
    return `<article class="project-card" style="--category-color:${badgeColor(category)}" aria-label="${safeText(project.name)}">
      <div class="card-top"><span class="card-index">◈ / ${String(index+1).padStart(2,'0')}</span><div class="card-categories">${labels}</div></div>
      <a class="card-title" href="${safeText(project.html_url)}" target="_blank" rel="noopener noreferrer">${safeText(project.name)}</a>
      <div class="card-tagline">// ${project.archived ? 'ARCHIVED · ' : ''}${safeText(project.language || 'REPOSITORY')} / SOURCE SIGNAL</div>
      <p class="card-description">${safeText(project.description || 'No description supplied. Explore the repository for more information.')}</p>
      <div class="card-tags">${tech.map(t=>`<span>${safeText(t)}</span>`).join('') || '<span>NO ADDITIONAL TOPICS</span>'}</div>
      <div class="card-bottom"><span>★ ${project.stargazers_count} / GITHUB PUBLIC</span><a class="card-arrow" href="${safeText(project.html_url)}" target="_blank" rel="noopener noreferrer" aria-label="View ${safeText(project.name)} on GitHub">↗</a></div>
    </article>`;
  }
  function renderProjects() {
    const visible=getVisible();
    grid.innerHTML=visible.map(projectCard).join('');
    $('#projectsEmpty').hidden=visible.length>0;
    $('#projectTotal').textContent=String(allProjects.length).padStart(2,'0');
    $('#projectStatus').textContent=`${String(visible.length).padStart(2,'0')} VISIBLE / ${dataSource} / TOPICS-ONLY CLASSIFICATION`;
  }
  async function loadSnapshot() {
    try {
      const response=await fetch('./data/projects.json', {cache:'no-cache'});
      if (!response.ok) throw new Error('Snapshot unavailable');
      const payload=await response.json();
      if (!Array.isArray(payload.repos)) throw new Error('Malformed snapshot');
      setProjects(payload.repos,'SCHEDULED INDEX');
    } catch(error) { console.info('[LonzilFox] Snapshot unavailable:',error.message); }
  }
  async function loadLive() {
    try {
      const repos=[];
      for(let page=1;page<=30;page++) {
        const controller=new AbortController();
        const cancel=setTimeout(()=>controller.abort(),9500);
        let response;
        try {
          response=await fetch(`https://api.github.com/users/${encodeURIComponent(account)}/repos?per_page=100&page=${page}&sort=updated&type=owner`, {
            headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}, signal:controller.signal
          });
        } finally {clearTimeout(cancel);}
        if(!response.ok) throw new Error(`GitHub API returned ${response.status}`);
        const batch=await response.json();
        if(!Array.isArray(batch)) throw new Error('GitHub returned unexpected data');
        repos.push(...batch);
        if(batch.length<100) break;
      }
      if(!repos.length) throw new Error('No public repositories returned');
      setProjects(repos,'GITHUB LIVE API');
    } catch(error) {
      console.info('[LonzilFox] Live API unavailable:',error.message);
      $('#feedIndicator').innerHTML=`<span class="live-dot"></span> ${allProjects.length?'SCHEDULED INDEX / LIVE OFFLINE':'GITHUB API UNAVAILABLE'}`;
      if(!allProjects.length) {dataSource='API UNAVAILABLE';renderProjects();}
    }
  }
  $('#filterList').addEventListener('click', event=>{
    const button=event.target.closest('button[data-filter]');
    if(!button) return;
    filter=button.dataset.filter;
    makeFilters();renderProjects();
  });
  $('#projectSearch').addEventListener('input',event=>{search=event.target.value;renderProjects();});
  $('#projectSort').addEventListener('change',event=>{sort=event.target.value;renderProjects();});
  makeFilters();renderProjects();
  // A checked-in snapshot loads first; live Topics overwrite it when reachable.
  (async()=>{await loadSnapshot();await loadLive();})();

  // CRT / Matrix rainfall: no external libraries, capped frame rate and number of columns.
  const canvas = $('#matrixCanvas');
  const ctx = canvas.getContext('2d');
  let columns = [];
  let columnSize = 18;
  let frameId = 0;
  let lastFrame = 0;
  let canvasActive = true;
  function sizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(bounds.width * scale));
    canvas.height = Math.max(1, Math.floor(bounds.height * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.ceil(bounds.width / columnSize);
    columns = Array.from({length: count}, (_, i) => ({ x: i * columnSize, y: -Math.random() * (bounds.height / columnSize), speed: .25 + Math.random() * .55 }));
  }
  const glyphs = '01アイウエカケコﾊﾐﾑﾒﾓ++<>/#X$!';
  function drawMatrix(time) {
    frameId = requestAnimationFrame(drawMatrix);
    if (!motion || !canvasActive || time - lastFrame < 48) return;
    lastFrame = time;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    ctx.fillStyle = 'rgba(9,4,8,.13)';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${columnSize - 5}px monospace`;
    for (const col of columns) {
      const char = glyphs[Math.floor(Math.random() * glyphs.length)];
      ctx.fillStyle = Math.random() > .985 ? '#ffb2c2' : (Math.random() > .95 ? '#6de2ef' : (Math.random() > .65 ? '#9a2540' : '#e22c4d'));
      ctx.fillText(char, col.x, col.y * columnSize);
      col.y += col.speed;
      if (col.y * columnSize > height && Math.random() > .972) col.y = -Math.random() * 30;
    }
  }
  if (ctx) {
    sizeCanvas();
    if ('ResizeObserver' in window) new ResizeObserver(sizeCanvas).observe(canvas);
    else window.addEventListener('resize', sizeCanvas, { passive: true });
    frameId = requestAnimationFrame(drawMatrix);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { canvasActive = entries[0]?.isIntersecting || false; }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', () => { canvasActive = !document.hidden; });
  }
  const motionToggle = $('#motionToggle');
  function updateMotionButton() {
    motionToggle.textContent = motion ? 'FX: ON' : 'FX: OFF';
    motionToggle.setAttribute('aria-label', motion ? 'Disable animations' : 'Enable animations');
    motionToggle.setAttribute('aria-pressed', String(motion));
    document.body.classList.toggle('motion-off', !motion);
    if (!motion && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  motionToggle.addEventListener('click', () => {
    motion = !motion;
    saveMotionPreference(motion ? 'on' : 'off');
    updateMotionButton();
  });
  updateMotionButton();

  // Cursor illumination only for precise pointers, not touch screens.
  if (window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('pointermove', event => {
      const halo = $('#cursorHalo');
      halo.style.left = `${event.clientX}px`;
      halo.style.top = `${event.clientY}px`;
    }, { passive: true });
  }
  function updateClock() {
    $('#localClock').textContent = new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
  }
  updateClock();
  setInterval(updateClock, 1000);
  $('#copyrightYear').textContent = new Date().getFullYear();

  // Command shell: purely local, no eval, no arbitrary code execution.
  const output = $('#terminalOutput');
  const commandInput = $('#terminalInput');
  const terminalMessages = {
    help: ['AVAILABLE COMMANDS:', 'help       list supported commands', 'categories list GitHub Topic sectors', 'refresh    reload public project signals', 'whoami     identify the operator', 'projects   move to project archive', 'github     open public GitHub account', 'status     show node / archive status', 'matrix     toggle the blood-rain animation', 'clear      clear terminal output', 'date       display local system time'],
    whoami: ['USER       LonzilFox / Tiasmi', 'ROLE       Independent developer', 'CATEGORY   GitHub category-* Topics', 'MISSION    Build strange but useful things.'],
    status: () => [`NODE       ONLINE`, `PUBLIC REPOS  ${allProjects.length}`, `DATA SOURCE   ${dataSource}`, `VISUAL FX     ${motion ? 'enabled' : 'disabled'}`],
    date: () => [new Date().toLocaleString()],
    categories: () => ['CATEGORY-* TOPIC SECTORS:', ...categoryKeys().map(category => `  ${displayCategory(category)} / ${allProjects.filter(p => p.categories.includes(category)).length} REPOSITORIES`)],
  };
  function line(text, kind = '') {
    const div = document.createElement('div');
    div.className = `terminal-response ${kind}`.trim();
    div.textContent = text;
    output.appendChild(div);
    while (output.children.length > 100) output.firstElementChild.remove();
    output.scrollTop = output.scrollHeight;
  }
  $('#terminalForm').addEventListener('submit', event => {
    event.preventDefault();
    const raw = commandInput.value.trim();
    commandInput.value = '';
    if (!raw) return;
    line(`guest@lonzilfox:~$ ${raw}`, 'command');
    const name = raw.split(/\s+/)[0].toLowerCase();
    if (name === 'clear') { output.textContent = ''; return; }
    if (name === 'refresh') { line('RELOADING PUBLIC REPOSITORY TOPICS...', 'accent'); loadLive(); return; }
    if (name === 'projects') { line('OPENING PROJECT ARCHIVE...', 'accent'); $('#projects').scrollIntoView({ behavior: motion ? 'smooth':'instant' }); return; }
    if (name === 'github') { line('OPENING GITHUB PROFILE...', 'accent'); window.open(`https://github.com/${encodeURIComponent(account)}`, '_blank', 'noopener,noreferrer'); return; }
    if (name === 'matrix') { motionToggle.click(); line(`VISUAL FX: ${motion ? 'ON' : 'OFF'}`, 'accent'); return; }
    const handler = terminalMessages[name];
    if (handler) { for (const message of (typeof handler === 'function' ? handler() : handler)) line(message, 'accent'); }
    else line(`command not found: ${name} // type 'help'`, 'error');
  });
  document.querySelectorAll('.primary-nav a').forEach(link => link.addEventListener('click', () => {
    // Native anchor navigation; commands need no custom router.
  }));
  // Periodic subtle RGB glitch, disabled via accessibility / FX toggle.
  setInterval(() => {
    if (!motion || document.hidden) return;
    const title = $('.hero-supertext h1');
    if (!title) return;
    title.classList.add('is-glitching');
    setTimeout(() => title.classList.remove('is-glitching'), 420);
  }, 6500);
})();
