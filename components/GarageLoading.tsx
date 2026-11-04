'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import GarageShowroom from './GarageShowroom';

export default function GarageLoading({visible,progress,stage,onEnter}:{visible:boolean;progress:number;stage:string;onEnter:()=>void}){
  const [entered,setEntered]=useState(false),[dismissed,setDismissed]=useState(false),[heroReady,setHeroReady]=useState(false);const enterButton=useRef<HTMLButtonElement>(null);
  const ready=!visible&&heroReady;
  useEffect(()=>{if(ready)enterButton.current?.focus({preventScroll:true});},[ready]);
  if(dismissed)return null;
  const value=ready?100:Math.min(99,Math.max(0,Math.round(progress)));
  const enter=()=>{if(!ready)return;setEntered(true);onEnter();if(matchMedia('(prefers-reduced-motion: reduce)').matches)setDismissed(true);};
  return <section className={`arrival-screen arrival-cinematic ${entered?'is-entered':''}`} aria-label="保时捷之家欢迎界面" onTransitionEnd={event=>{if(event.target===event.currentTarget&&entered)setDismissed(true);}}>
    <div className="arrival-grid" aria-hidden="true"/><div className="arrival-top"><span>PORSCHE HOME<span className="arrival-red">.</span></span><span>THE ART OF COMING HOME</span></div>
    <GarageShowroom paused={entered} onReady={()=>setHeroReady(true)}/>
    <div className="cinematic-copy"><p className="arrival-kicker"><i/> YOUR PASSION. YOUR PLACE.</p><h2>热爱，<br/>即刻<span>有了归处。</span></h2><p className="cinematic-description">从一条熟悉的车身弧线，<br/>驶入只属于你的世界。</p><div className="cinematic-progress"><div><span>{ready?'你的私人车库已就绪':stage}</span><strong>{String(value).padStart(3,'0')}<small>%</small></strong></div><div className="arrival-track" role="progressbar" aria-label="场景加载进度" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${value}%`}}/></div></div><button ref={enterButton} className={`enter-world-button ${ready?'is-ready':''}`} disabled={!ready} onClick={enter}><span>{ready?'进入我的世界':'正在唤醒车库'}</span>{ready?<ArrowUpRight size={21}/>:<span className="entry-pulse"/>}</button><p className="cinematic-ready-note">{ready?<><Check size={11}/> 你的 911 与四处风景，已在等你。</>:<>场景与车型准备完成后，即可进入。</>}</p></div>
    <div className="arrival-bottom"><span>CURVES. STORIES. HOME.</span><span>为爱车留一个位置，也为朋友留一盏灯。</span></div>
  </section>;
}
