(async()=>{
 const data=await(await fetch('/data')).json(),m=data.manifest,stage=document.querySelector('#stage');stage.style.fontFamily=m.fontFamily;
 const photos=new Map(data.photos.map(p=>[p.name,p]));const scenes=data.scenes||data.photos.map(p=>({files:[p.name],duration:m.photoDuration,transition:'fade'}));
 let cursor=0;const timeline=gsap.timeline({paused:true}),ready=[document.fonts.ready],videos=[];
 scenes.forEach((scene,i)=>{
  const start=cursor,duration=scene.duration;cursor+=duration-(i<scenes.length-1?m.transition.duration:0);
  const el=document.createElement('section');el.className=`scene count-${scene.files.length}`;el.style.opacity=i?'0':'1';el.style.zIndex=String(i);
  scene.files.forEach(name=>{const p=photos.get(name),cell=document.createElement('div');cell.className='cell';el.append(cell);
   if(p.type==='image'){const bg=document.createElement('img');bg.src=p.url;bg.className='blur';cell.append(bg);ready.push(bg.decode())}
   const media=document.createElement(p.type==='video'?'video':'img');media.className='main';media.style.transformOrigin=`${p.x*100}% ${p.y*100}%`;cell.append(media);
   if(p.type==='video'){media.muted=true;media.preload='auto';media.playsInline=true;videos.push({el:media,start,duration,offset:p.start||0,url:p.url,name})}else{media.src=p.url;ready.push(media.decode())}
   timeline.fromTo(media,{scale:1},{scale:m.zoom,duration,ease:'none'},start);
  });
  stage.append(el);if(i){const from=scene.transition==='slide'?{opacity:0,xPercent:8}:scene.transition==='rise'?{opacity:0,yPercent:6}:{opacity:0};timeline.fromTo(el,from,{opacity:1,xPercent:0,yPercent:0,duration:m.transition.duration,ease:'none'},start)}
  if(i===0&&data.title){const title=document.createElement('div');title.className='title';title.textContent=data.title;title.style.color=m.title.color;title.style.fontSize=m.title.size+'px';el.append(title);timeline.fromTo(title,{opacity:0},{opacity:1,duration:.6,ease:'none'},start)}
 });
 const captions=data.captions.map(c=>{const e=document.createElement('div');e.className='caption';e.textContent=c.text;Object.assign(e.style,{left:c.x+'%',top:c.y+'%',fontSize:(c.size||40)+'px',color:c.color||'#fff',opacity:'0',zIndex:100});stage.append(e);return [c,e]});
 async function renderAt(t){t=Math.max(0,Math.min(cursor,t));timeline.seek(t,false);captions.forEach(([c,e])=>{const fade=Math.max(0,Math.min(1,(t-c.start)/.35,(c.end-t)/.35));e.style.opacity=String(fade)});const active=videos.filter(v=>t>=v.start&&t<v.start+v.duration);for(const v of videos)if(!active.includes(v)&&v.el.hasAttribute('src')){v.el.removeAttribute('src');v.el.load()}await Promise.all(active.map(async({el,start,offset,url,name})=>{if(!el.hasAttribute('src'))await new Promise((ok,fail)=>{el.onloadeddata=()=>el.videoWidth&&el.videoHeight?ok():fail(Error('영상 화면을 디코딩할 수 없습니다: '+name));el.onerror=()=>fail(Error('영상 디코딩 실패: '+name));el.src=url;el.load()});if(!el.videoWidth||!el.videoHeight)throw Error('영상 화면을 디코딩할 수 없습니다: '+name);const target=Math.min(el.duration-1/m.fps,Math.max(0,offset+t-start));if(Math.abs(el.currentTime-target)<.0001)return;await new Promise((ok,fail)=>{el.onseeked=()=>ok();el.onerror=()=>fail(Error('영상 탐색 실패: '+name));el.currentTime=target})}));}
 window.video={durationSeconds:cursor,ready:Promise.all(ready),renderAt};await window.video.ready;await renderAt(0);
})().catch(e=>{window.videoError=String(e)});
