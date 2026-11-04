'use client';
import { useEffect, useState } from 'react';

export default function GarageLoading({visible,progress,stage}:{visible:boolean;progress:number;stage:string}) {
  const [dismissed,setDismissed]=useState(false);
  useEffect(()=>{if(visible)setDismissed(false);},[visible]);
  if(dismissed)return null;
  const value=visible?Math.min(99,Math.max(0,Math.round(progress))):100;
  return <div className={`arrival-screen ${visible?'':'is-ready'}`} role="status" aria-live="polite" onTransitionEnd={event=>{if(event.target===event.currentTarget&&!visible)setDismissed(true);}}>
    <div className="arrival-grid" aria-hidden="true"/>
    <div className="arrival-top"><span>PORSCHE HOME<span className="arrival-red">.</span></span><span>YOUR PRIVATE WORLD</span></div>
    <div className="arrival-content">
      <p className="arrival-kicker"><i/> CURVES. STORIES. HOME.</p>
      <h2>每一段热爱，<br/><span>都有归处。</span></h2>
      <div className="arrival-car" aria-hidden="true">
        <svg viewBox="0 0 800 240" fill="none"><defs><linearGradient id="arrival-stroke"><stop stopColor="#e7e7dc" stopOpacity=".18"/><stop offset=".5" stopColor="#e7e7dc" stopOpacity=".95"/><stop offset="1" stopColor="#e7e7dc" stopOpacity=".3"/></linearGradient><filter id="headlight-glow"><feGaussianBlur stdDeviation="7"/></filter></defs>
          <path className="arrival-outline" d="M71 158C78 136 99 128 137 125L221 117C254 112 272 88 304 74C343 57 391 56 426 63C463 71 489 92 522 112L629 125C678 131 700 142 715 163L730 170V187H669C664 159 644 147 620 147C594 147 574 160 570 187H257C253 159 233 147 207 147C181 147 160 161 157 187H78L65 177V163Z" stroke="url(#arrival-stroke)" strokeWidth="2.3"/>
          <path d="M252 117C276 103 291 88 314 80C349 67 389 67 420 73C451 80 471 95 494 112L252 117ZM393 72L397 112M94 156L144 148M664 146L698 151M282 135L550 132M276 175H548" stroke="#c4c9c1" strokeOpacity=".32" strokeWidth="1.3"/>
          <circle cx="207" cy="187" r="32" stroke="#ccd2ca" strokeOpacity=".65" strokeWidth="2"/><circle cx="620" cy="187" r="32" stroke="#ccd2ca" strokeOpacity=".65" strokeWidth="2"/>
          <circle cx="207" cy="187" r="20" stroke="#ccd2ca" strokeOpacity=".22"/><circle cx="620" cy="187" r="20" stroke="#ccd2ca" strokeOpacity=".22"/>
          <path d="M80 153L146 145" stroke="#d6e7dc" strokeWidth="7" filter="url(#headlight-glow)"/><path d="M82 154L143 147" stroke="#edf6ec" strokeWidth="2.4"/>
          <path className="arrival-tail" d="M671 148L705 157" stroke="#e42e3e" strokeWidth="3"/><path d="M64 222H741" stroke="#d3d9d0" strokeOpacity=".12"/>
        </svg>
        <div className="arrival-light-sweep"/>
      </div>
      <div className="arrival-progress"><div><span className="arrival-stage">{visible?stage:'欢迎回家。'}</span><span className="arrival-percent">{String(value).padStart(3,'0')}<small>%</small></span></div><div className="arrival-track" role="progressbar" aria-label="场景加载进度" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${value}%`}}/></div><div className="arrival-chapters"><span className={value>=20?'done':''}>01 / 铺开山野</span><span className={value>=45?'done':''}>02 / 唤醒 911</span><span className={value>=95?'done':''}>03 / 点亮归处</span></div></div>
    </div>
    <div className="arrival-bottom"><span>为爱车留一个位置，也为朋友留一盏灯。</span><span>DESIGNED AROUND YOUR PASSION</span></div>
  </div>;
}
