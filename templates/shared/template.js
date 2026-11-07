(async () => {
  const data = await (await fetch('/data')).json(), m = data.manifest, stage = document.querySelector('#stage');
  stage.style.background = m.background; stage.style.fontFamily = m.fontFamily; stage.className = m.style;
  const step = m.photoDuration - m.transition.duration, duration = m.photoDuration + step * (data.photos.length - 1);
  const timeline = gsap.timeline({paused:true}), ready = [document.fonts.ready], videos = [];
  data.photos.forEach((p,i) => {
    const scene=document.createElement('div'); scene.className='scene'; scene.style.opacity=i?'0':'1';
    const createMedia = (cls) => {
      const el=document.createElement(p.type==='video'?'video':'img'); el.className=cls; el.src=p.url;
      if(p.type==='video') { el.muted=true; el.preload='auto'; el.playsInline=true; ready.push(new Promise((ok,fail)=>{el.onloadeddata=()=>{if(p.start>=el.duration) fail(new Error('Video start exceeds duration: '+p.url));else ok()};el.onerror=()=>fail(new Error('Video could not be decoded: '+p.url))})); videos.push({el,p,start:i*step}); }
      else ready.push(el.decode());
      scene.append(el); return el;
    };
    if(m.style==='scrapbook') createMedia('backdrop');
    const img=createMedia('photo');img.style.objectPosition=`${p.x*100}% ${p.y*100}%`;img.style.transformOrigin=`${p.x*100}% ${p.y*100}%`;
    if(i===0&&data.title){const title=document.createElement('div');title.className='title';title.textContent=data.title;title.style.color=m.title.color;title.style.fontSize=m.title.size+'px';scene.append(title);timeline.fromTo(title,{opacity:0},{opacity:1,duration:.6,ease:'none'},0)}
    stage.append(scene);const start=i*step;if(i)timeline.to(scene,{opacity:1,duration:m.transition.duration,ease:'none'},start);timeline.fromTo(img,{scale:1},{scale:m.zoom,duration:m.photoDuration,ease:'none'},start);
  });
  const captions=data.captions.map(c=>{const el=document.createElement('div');el.className='caption';el.textContent=c.text;Object.assign(el.style,{left:c.x+'%',top:c.y+'%',fontSize:(c.size||40)+'px',color:c.color||'#fff',opacity:'0'});stage.append(el);return [c,el]});
  async function renderAt(t){t=Math.max(0,Math.min(duration,t));timeline.seek(t,false);captions.forEach(([c,e])=>e.style.opacity=t>=c.start&&t<c.end?'1':'0');await Promise.all(videos.filter(v=>t>=v.start&&t<=v.start+m.photoDuration).map(({el,p,start})=>new Promise((ok,fail)=>{const target=Math.max(0,Math.min(el.duration-0.001,p.start+t-start));if(Math.abs(el.currentTime-target)<0.0001){ok();return}el.onseeked=()=>ok();el.onerror=()=>fail(new Error('Video seek failed'));el.currentTime=target})));}
  window.video={durationSeconds:duration,ready:Promise.all(ready),renderAt};await window.video.ready;await renderAt(0);
})().catch(e=>{window.videoError=String(e)});
