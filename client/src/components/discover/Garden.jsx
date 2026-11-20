import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Pause, Play, Settings2 } from 'lucide-react';
import useTimer from '@/hooks/useTimer';
import { plannedMs } from '@/lib/pomodoro';
import './collection.css';

const varieties = {
  poppy: { name: 'California poppy', petals: 5, color: '#ff9a56' },
  cosmos: { name: 'Pink cosmos', petals: 8, color: '#ef9bbb' },
  daisy: { name: 'Oxeye daisy', petals: 13, color: '#fff3c8' },
};
function Bloom({ x, y, size, variety, growth }) {
  const { petals, color } = varieties[variety];
  const height = 19 + 82 * growth;
  const flower = Math.max(0, (growth - .55) / .45);
  return <g transform={'translate(' + x + ' ' + y + ') scale(' + size + ')'}>
    <g className="flex-stem">
      <path d={'M0 0 Q-12 ' + (-height*.55) + ' 0 ' + -height} fill="none" stroke="#355e42" strokeWidth="3"/>
      <path d={'M-3 -9 Q-29 -10 -32 -32 Q-7 -30 -3 -9 M-4 -17 Q9 -43 27 -44 Q23 -23 -4 -17'} fill="#41774c" transform={'scale(' + (.4 + growth*.6) + ')'}/>
      <g transform={'translate(0 ' + -height + ')'}>
        <ellipse rx="5" ry="8" fill="#5a8051"/>
        <g transform={'scale(' + flower + ')'}>{Array.from({length:petals},(_,i)=><ellipse key={i} cx="0" cy="-11" rx={petals > 10 ? 4 : 9} ry="14" transform={'rotate(' + i*360/petals + ')'} fill={color} stroke="#b16e3e" strokeOpacity=".28"/>)}<circle r="6" fill="#e5af43"/><circle r="2" fill="#755134"/></g>
      </g>
    </g>
  </g>;
}
function Meadow({ variety, days, growth, moving, atmosphere }) {
  const scene = useRef(null);
  useEffect(() => {
    const el = scene.current;
    if (!moving) { el.style.setProperty('--lean','0deg'); return; }
    let frame, lean=0, velocity=0, previous=0, gust=0;
    function tick(t) {
      const dt=Math.min(.032,(t-previous)/1000); previous=t;
      const target=Math.sin(t/1250)*2 + Math.sin(t/620)*.65 + gust;
      velocity+=((target-lean)*22-velocity*6)*dt;
      lean+=velocity*dt; gust*=Math.exp(-dt*2.5);
      el.style.setProperty('--lean',lean.toFixed(2)+'deg');
      frame=requestAnimationFrame(tick);
    }
    function breeze(e) { gust=Math.max(-8,Math.min(8,e.movementX*.5)); }
    function visibility() {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame=requestAnimationFrame(tick);
    }
    visibility(); el.addEventListener('pointermove',breeze);
    document.addEventListener('visibilitychange',visibility);
    return ()=>{cancelAnimationFrame(frame);el.removeEventListener('pointermove',breeze);document.removeEventListener('visibilitychange',visibility);};
  },[moving]);
  return <svg ref={scene} className="meadow" viewBox="0 0 640 270" role="img" aria-label={varieties[variety].name + ' growing in a sunlit meadow'}>
    <defs><linearGradient id="meadowSky" x2="0" y2="1"><stop stopColor="#acd6d4"/><stop offset="1" stopColor="#fff1c5"/></linearGradient></defs>
    <rect width="640" height="270" fill="url(#meadowSky)"/><circle cx="480" cy="53" r="30" fill="#fff1c3"/>
    <path d="M0 143 Q97 75 190 124 T380 118 T640 105 V270 H0" fill="#91afa1"/>
    <path d="M0 170 Q120 101 244 151 T469 149 T640 130 V270 H0" fill="#789982"/>
    <path d="M0 172 Q148 127 323 180 T640 146 V270 H0" fill="#9ab17a"/>
    {Array.from({length:75},(_,i)=>{const x=(i*83)%647, y=173+(i*39)%96;return <path key={i} d={'M'+x+' '+y+'q-3 -6 -2 -10 m2 10 q3 -7 6 -9'} stroke="#5e8056" opacity=".43" fill="none"/>;})}
    {Array.from({length:Math.min(14,Math.floor(days/5))},(_,i)=><Bloom key={i} x={i%2 ? 424+(i*49)%190 : 28+(i*47)%195} y={212+(i*31)%54} size={.45+(i%4)*.08} variety={Object.keys(varieties)[i%3]} growth={1}/>)}
    <ellipse cx="320" cy="248" rx="41" ry="6" fill="#64865d" opacity=".55"/>
    <Bloom x={320} y={246} size={1.28} variety={variety} growth={growth}/>
    {atmosphere && <g aria-hidden="true" pointerEvents="none">
      {[34, 133, 231, 352, 459, 546].map((x, i) => <g key={x} transform={'translate(' + x + ' 0)'}>
        <g className="meadow-drift" style={{animationDuration:(24 + i * 2) + 's', animationDelay:-(i * 7 + 3) + 's'}}>
          {atmosphere === 'snow'
            ? <circle r={1.4 + i % 3 * .4} fill="#fffdf5"/>
            : <path d="M-4 0 Q-1 -4 4 -2 Q3 2 -1 2 Q-3 2 -4 0" fill={i % 2 ? '#f2c4bd' : '#fff0cf'}/>}
        </g>
      </g>)}
    </g>}
  </svg>;
}
const lastHint = new Map();

function GardenShortcut({ owner, allowMotion, children }) {
  const link = useRef(null);
  useEffect(() => {
    if (!allowMotion) return;
    const element = link.current;
    const key = 'study-garden:shortcut-hint:' + owner;
    let visible = false;
    let timeout;
    let animation;
    function schedule() {
      clearTimeout(timeout);
      if (!visible || document.hidden) return;
      const now = new Date();
      const day = now.toLocaleDateString('en-CA');
      let seen = lastHint.get(key) === day;
      try { seen ||= localStorage.getItem(key) === day; } catch { /* Memory fallback. */ }
      if (!seen) {
        lastHint.set(key, day);
        try { localStorage.setItem(key, day); } catch { /* Already marked in memory. */ }
        animation = element.animate([
          { transform: 'translateY(0)' },
          { transform: 'translateY(-3px) scale(1.025)', offset: .45 },
          { transform: 'translateY(0)' },
        ], { duration: 800, easing: 'ease-in-out' });
      }
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timeout = setTimeout(schedule, midnight - now + 100);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.intersectionRatio >= .8;
      schedule();
    }, { threshold: .8 });
    observer.observe(element);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      observer.disconnect();
      clearTimeout(timeout);
      animation?.cancel();
      document.removeEventListener('visibilitychange', schedule);
    };
  }, [owner, allowMotion]);
  return <Link ref={link} className="timer-meadow" to="/garden" aria-label="Open study garden">
    <span className="timer-meadow-label">Open garden <ArrowUpRight size={12} aria-hidden="true"/></span>
    <span className="timer-meadow-art">{children}</span>
  </Link>;
}

export default function Garden({streak,user,compact=false}) {
  const timer=useTimer(), {state}=timer;
  const key='study-garden:'+String(user._id || user.id);
  const [options,setOptions]=useState(()=>{try{return JSON.parse(localStorage.getItem(key)) || {};}catch{return {};}});
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(media.matches);media.addEventListener('change',change);return ()=>media.removeEventListener('change',change);},[]);
  function configure(value){const next={...options,...value};setOptions(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* Device preferences are optional. */}}
  const variety=Object.hasOwn(varieties,options.variety)?options.variety:'poppy';
  const focus=state.phase==='focus';
  const target=plannedMs(state) || 25*60000;
  const growth=focus ? Math.min(1,timer.elapsed/target) : 1;
  const seconds=Math.max(0,Math.ceil((timer.left ?? timer.elapsed)/1000));
  const clock=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
  const days=streak?.gardenDays || 0;
  const motionAllowed=!reduced && options.motion!==false;
  const atmosphere=options.atmosphere || 'petals';
  const meadow=<Meadow variety={variety} days={days} growth={growth} moving={focus && state.running && motionAllowed}
    atmosphere={motionAllowed && atmosphere!=='clear' && (!compact || state.running) ? atmosphere : null}/>;
  if (compact) return <GardenShortcut owner={user._id || user.id} allowMotion={!reduced && options.motion!==false}>{meadow}</GardenShortcut>;
  return <div className="garden-layout">
    <div className="specimen">{meadow}
      <div className="specimen-caption"><div><small>{focus ? (growth >= .85 ? 'Flowering' : growth >= .55 ? 'Opening bud' : growth > 0 ? 'Growing' : 'Ready to grow') : 'Rest period'}</small><h2>{varieties[variety].name}</h2></div><strong className="garden-clock">{clock}</strong></div>
    </div>
    <div className="garden-actions"><button className="btn btn-primary" disabled={timer.saving} onClick={state.running?timer.pause:timer.start}>{state.running?<Pause size={16}/>:<Play size={16}/>} {state.running?'Pause':timer.isPaused?'Resume':focus?'Start focus':'Start break'}</button>
      {(state.firstStartedAt || !focus) && <button className="btn btn-secondary" disabled={timer.saving} onClick={timer.finish}>{focus?'Finish session':'End break'}</button>}
    </div>
    <p>{focus ? 'Your flower opens as the focus timer runs.' : 'Your focus block is over. Take a break before planting again.'} Every five recorded days of 25 minutes adds a permanent meadow flower.</p>
    <div className="garden-count"><span>{days} focused days</span><span>{Math.floor(days/5)} permanent blooms</span></div>
    <details className="garden-options"><summary><Settings2 size={16}/> Garden settings</summary><div>
      <label>Flower variety<select className="input" value={variety} onChange={e=>configure({variety:e.target.value})}>{Object.entries(varieties).map(([id,v])=><option key={id} value={id}>{v.name}</option>)}</select></label>
      <label>Focus timer<select className="input" value={state.presetId} disabled={Boolean(state.firstStartedAt) || !focus} onChange={e=>timer.dispatch({type:'preset',presetId:e.target.value})}>{[['classic','25 minutes'],['deep','50 minutes'],['marathon','90 minutes'],['stopwatch','Stopwatch'],...(state.presetId==='custom'?[['custom','Custom duration']]:[])].map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label>Scenery<select className="input" value={atmosphere} onChange={e=>configure({atmosphere:e.target.value})}>
        <option value="petals">Drifting petals</option><option value="snow">Soft snow</option><option value="clear">Clear meadow</option>
      </select></label>
      <label><input type="checkbox" checked={options.motion!==false} onChange={e=>configure({motion:e.target.checked})}/> Animate the garden</label>
    </div></details></div>;
}
