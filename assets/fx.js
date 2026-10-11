/* Visual FX v0.0.4 // deterministic opt-out, bounded CPU and no third-party JS. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const mobile = window.matchMedia('(max-width: 600px)').matches;
  const $ = selector => document.querySelector(selector);
  const motionOn = () => !document.hidden && !document.body.classList.contains('motion-off') && !reduced.matches;
  const R = (a, b) => Math.random() * (b - a) + a;

  // Scroll reveals never hide content until JS is ready; an observer can always undo them.
  const revealTargets = [...document.querySelectorAll('.reveal-me')];
  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin:'0px 0px 70px 0px', threshold:.08 });
    revealTargets.forEach(element => observer.observe(element));
    document.body.classList.add('fx-ready');
  }

  // Typewritten signal; static fallback remains legible when motion is disabled.
  const typed = $('#typingSignal');
  if (typed) {
    const phrases = ['DESKTOP APPLICATIONS.', 'AUTOMATION SYSTEMS.', 'WEB APPLICATIONS.', 'GAME DEVELOPMENT.', 'APPLIED AI.'];
    let phrase = 0, position = phrases[0].length, remove = true;
    const typeLoop = () => {
      if (!motionOn()) {
        typed.textContent = phrases[0];
        window.setTimeout(typeLoop, 900);
        return;
      }
      if (remove) position = Math.max(0, position - 1);
      else position = Math.min(phrases[phrase].length, position + 1);
      typed.textContent = phrases[phrase].slice(0, position);
      let delay = remove ? 46 : 82;
      if (position === 0 && remove) { phrase = (phrase + 1) % phrases.length; remove = false; delay = 350; }
      else if (position === phrases[phrase].length && !remove) { remove = true; delay = 2400; }
      window.setTimeout(typeLoop, delay);
    };
    window.setTimeout(typeLoop, 2000);
  }

  // Simulated packets are decorative; never imply real packet capture or live security monitoring.
  const feed = $('#packetFeed');
  if (feed) {
    const packets = [
      ['SYS','00A1 / 1B08 / 009F'],['I/O','40C2 / FF18 / 12B0'],['TRACE','0020 / 8A1B / 006D'],
      ['DATA','11FF / 902C / 0A48'],['NODE','11A3 / 9800 / 0012'],['PROC','0B31 / FA22 / 109C'],
      ['SYS','0A00 / 10F2 / 0B8D'],['TRACE','10C3 / 0F3D / 8E1B'],['DATA','92D0 / AA12 / 0B04']
    ];
    let counter = 0;
    const addPacket = () => {
      if (!motionOn()) return;
      const date = new Date();
      const time = date.toLocaleTimeString('en-GB', {hour12:false});
      const packet = packets[counter++ % packets.length];
      const line = document.createElement('div');
      line.className = 'packet-line';
      line.append(document.createTextNode(`${time} `));
      const kind = document.createElement('span');
      kind.textContent = `[${packet[0]}]`;
      line.append(kind, document.createTextNode(` // ${packet[1]}`));
      feed.append(line);
      while (feed.children.length > 4) feed.firstElementChild.remove();
    };
    addPacket();
    window.setInterval(addPacket, 1800);
  }

  // Re-trigger short, staggered card arrival animations after a search/filter rerender.
  const grid = $('#projectsGrid');
  if (grid && window.MutationObserver) {
    const watch = new MutationObserver(() => {
      if (!motionOn()) return;
      grid.querySelectorAll('.project-card').forEach((card, index) => {
        if (card.dataset.animated) return;
        card.dataset.animated = 'yes';
        card.style.setProperty('--card-delay', `${Math.min(index, 10) * 45}ms`);
        card.classList.add('is-card-entering');
        card.addEventListener('animationend', () => card.classList.remove('is-card-entering'), { once:true });
      });
    });
    watch.observe(grid, {childList:true});
  }

  // Canvas helpers: capped device pixel ratio, capped update rates, no frame when hidden/off.
  function initCanvas(id, render, fps) {
    const canvas = $(id);
    if (!canvas) return;
    const context = canvas.getContext('2d', {alpha:true});
    if (!context) return;
    let w = 1, h = 1, prev = 0, active = true;
    function resize() {
      const area = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(area.width));
      h = Math.max(1, Math.round(area.height));
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.3 : 1.75);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      context.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    window.addEventListener('resize', resize, {passive:true});
    if (canvas.id === 'radarCanvas' && window.IntersectionObserver) {
      new IntersectionObserver(entries => {active = entries[0].isIntersecting;}).observe(canvas);
    }
    function loop(t) {
      if (!motionOn()) {
        prev = t;
        window.setTimeout(() => requestAnimationFrame(loop), 180);
        return;
      }
      requestAnimationFrame(loop);
      if (!active || t - prev < (1000 / fps)) return;
      prev = t;
      render(context, w, h, t);
    }
    requestAnimationFrame(loop);
    return {canvas, context};
  }

  // Subtle background constellation, no O(N^2) work for hundreds of nodes.
  const nodes = [];
  const count = mobile ? 22 : 57;
  for (let i = 0; i < count; i++) {
    nodes.push({x:Math.random(), y:Math.random(), vx:R(-.000022,.000022), vy:R(-.000025,.000025), size:R(.5,1.8), tint:i%8===0?'#ad82ff':'#fd375e'});
  }
  initCanvas('#ambientCanvas', (ctx,w,h) => {
    ctx.clearRect(0,0,w,h);
    for (const node of nodes) {
      node.x += node.vx; node.y += node.vy;
      if (node.x < -.03 || node.x > 1.03) node.vx *= -1;
      if (node.y < -.03 || node.y > 1.03) node.vy *= -1;
      ctx.fillStyle = node.tint;
      ctx.globalAlpha = .48;
      ctx.beginPath();ctx.arc(node.x*w,node.y*h,node.size,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='#fa2d50';ctx.globalAlpha=.09;
    for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
      const dx=(nodes[i].x-nodes[j].x)*w, dy=(nodes[i].y-nodes[j].y)*h;
      if (Math.abs(dx)>130 || Math.abs(dy)>130 || dx*dx+dy*dy>16900) continue;
      ctx.beginPath();ctx.moveTo(nodes[i].x*w,nodes[i].y*h);ctx.lineTo(nodes[j].x*w,nodes[j].y*h);ctx.stroke();
    }
    ctx.globalAlpha=1;
  }, mobile ? 20 : 30);

  // Radar beam pulses around identity node.
  initCanvas('#radarCanvas', (ctx,w,h,time) => {
    ctx.clearRect(0,0,w,h);
    const radius = Math.min(w,h)*.45;
    const theta=(time/6500)*(Math.PI*2);
    const cx=w/2, cy=h/2;
    const gradient=ctx.createConicGradient(theta,cx,cy);
    gradient.addColorStop(0,'#ff2b6277');
    gradient.addColorStop(.06,'#f9234b00');
    gradient.addColorStop(.92,'#ff2b6200');
    gradient.addColorStop(1,'#ff2b6244');
    ctx.fillStyle=gradient;
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#f7345f';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(theta)*radius,cy+Math.sin(theta)*radius);ctx.stroke();
  }, 25);

  // Cursor sparks: limited particles and only for pointer:fine. Ignores touch screens.
  if (finePointer && !mobile) {
    const sparks=[];
    let lastMouse = 0;
    document.addEventListener('pointermove', event => {
      if (!motionOn() || performance.now()-lastMouse < 24) return;
      lastMouse=performance.now();
      for(let i=0;i<2;i++) sparks.push({x:event.clientX,y:event.clientY,vx:R(-1.2,1.2),vy:R(-1.2,1.2),life:R(15,28),max:28});
      if (sparks.length > 68) sparks.splice(0,sparks.length-68);
    }, {passive:true});
    document.addEventListener('pointerdown', event => {
      if (!motionOn()) return;
      for(let i=0;i<15;i++) sparks.push({x:event.clientX,y:event.clientY,vx:R(-3,3),vy:R(-3,3),life:R(16,30),max:30});
      if(sparks.length>68) sparks.splice(0,sparks.length-68);
    }, {passive:true});
    initCanvas('#cursorTrail', (ctx,w,h) => {
      ctx.clearRect(0,0,w,h);
      for(let i=sparks.length-1;i>=0;i--){
        const p=sparks[i];p.x+=p.vx;p.y+=p.vy;p.life--;
        if(p.life<=0){sparks.splice(i,1);continue;}
        ctx.globalAlpha=Math.min(1,p.life/p.max)*.78;
        ctx.fillStyle=i%5===0?'#9a77ff':'#fa345e';
        ctx.fillRect(p.x,p.y,Math.min(2.7,p.life/12),Math.min(2.7,p.life/12));
      }
      ctx.globalAlpha=1;
    }, 35);
  }
  // Avoid scroll/event based DOM relayout. The main UI continues functioning when all FX are disabled.
})();
