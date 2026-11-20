import { useEffect, useRef, useState } from 'react';
import { Download, LockKeyhole, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import './collection.css';

const badges = [
  {name:'First bloom', target:1, tone:'#ecbc77', ground:'#203e36', mark:'seed'},
  {name:'Field keeper', target:5, tone:'#ddaba3', ground:'#51373c', mark:'flower'},
  {name:'Sun seeker', target:15, tone:'#edce77', ground:'#3a4035', mark:'sun'},
  {name:'North star', target:30, tone:'#b5cbea', ground:'#29394c', mark:'star'},
];
function drawCard(canvas, badge, days) {
  const ctx=canvas.getContext('2d');
  const {tone,ground,mark,target}=badge;
  const earned=days>=target;
  ctx.fillStyle=ground;ctx.fillRect(0,0,900,540);
  ctx.strokeStyle=tone;ctx.lineWidth=1;ctx.strokeRect(19,19,862,502);
  ctx.save();ctx.globalAlpha=.09;
  for(let i=0;i<11;i++){ctx.beginPath();ctx.ellipse(760,240,180+i*16,260+i*12,-.5,0,2*Math.PI);ctx.stroke();}
  ctx.restore();
  function label(text,x,y,size,color,font='sans-serif'){
    ctx.fillStyle=color;ctx.font=size+'px '+font;ctx.fillText(text,x,y);
  }
  label('TRACK HERE   /   FIELD COLLECTION',50,65,19,tone);
  ctx.save();ctx.translate(450,222);
  const circle=(r,stroke)=>{ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.strokeStyle=stroke;ctx.stroke();};
  ctx.lineWidth=2;circle(102,tone);circle(86,tone);
  for(let i=0;i<48;i++){ctx.rotate(Math.PI/24);ctx.fillStyle=tone;ctx.fillRect(-1,-98,2,i%4===0?8:4);}
  ctx.fillStyle=tone;ctx.strokeStyle=tone;ctx.lineWidth=5;
  if(mark==='seed'){
    ctx.beginPath();ctx.moveTo(0,47);ctx.quadraticCurveTo(-8,6,14,-37);ctx.stroke();
    ctx.fill(new Path2D('M-3 16 Q-52 10 -49 -32 Q-4 -32 -3 16 M4 -8 Q8 -57 58 -53 Q51 -14 4 -8'));
  }else if(mark==='flower'){
    for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.ellipse(0,-31,12,24,0,0,2*Math.PI);ctx.fill();}
    ctx.fillStyle=ground;ctx.beginPath();ctx.arc(0,0,15,0,2*Math.PI);ctx.fill();circle(11,tone);
  }else if(mark==='sun'){
    ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.fill();
    for(let i=0;i<16;i++){ctx.rotate(Math.PI/8);ctx.fillRect(-2,-56,4,15);}
  }else{
    ctx.fill(new Path2D('M0 -63 L11 -12 54 0 11 12 0 63 -11 12 -54 0 -11 -12 Z'));
    circle(37,tone);
  }
  ctx.restore();ctx.textAlign='center';
  label(badge.name,450,398,62,'#fff4dc','Georgia, serif');
  label(target+' focused '+(target===1?'day':'days'),450,439,23,tone);
  ctx.textAlign='left';label(earned?'EARNED':'MILESTONE PREVIEW',50,490,16,tone);
  ctx.textAlign='right';label('FIELD NOTE   '+String(badges.indexOf(badge)+1).padStart(2,'0'),850,490,16,tone);
  ctx.textAlign='left';
}
export default function Achievements({streak}){
  const days=streak.gardenDays || 0;
  const [selected,setSelected]=useState(()=>Math.max(0,badges.filter(b=>days>=b.target).length-1));
  const [error,setError]=useState('');
  const canvas=useRef(null);
  const badge=badges[selected],earned=days>=badge.target;
  useEffect(()=>{drawCard(canvas.current,badge,days);},[badge,days]);
  async function download(){
    try{
      const blob=await new Promise(resolve=>canvas.current.toBlob(resolve,'image/png'));
      if(!blob) throw new Error();
      const url=URL.createObjectURL(blob);
      const link=Object.assign(document.createElement('a'),{href:url,download:'track-here-'+badge.mark+'-badge.png'});
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
    }catch{setError('Could not create the image. Please try again.');}
  }
  return <div className="badge-gallery">
    <canvas ref={canvas} width="900" height="540" role="img" aria-label={badge.name+' achievement card, '+(earned?'earned':'locked')}/>
    <div className="badge-tabs" aria-label="Choose a badge">{badges.map((item,i)=><button key={item.mark} type="button" aria-pressed={i===selected} onClick={()=>{setSelected(i);setError('');}}>{days>=item.target?<Check size={14}/>:<LockKeyhole size={14}/>} {item.name}</button>)}</div>
    <div className="badge-info"><div><h2>{earned?'Badge earned':Math.max(0,badge.target-days)+' more focused '+(badge.target-days===1?'day':'days')}</h2><p>A day counts at 25 minutes of recorded study.</p></div>
    {earned?<button className="btn btn-primary" onClick={download}><Download size={16}/> Download PNG</button>:<Link className="btn btn-primary" to="/garden">Start growing</Link>}</div>
    {error && <p role="alert">{error}</p>}</div>;
}
