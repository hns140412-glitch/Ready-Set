(function(root){
  'use strict';
  const VERSION='CHARACTER_FORMATION_SCENE_RUNTIME_V01';
  const CREW=Object.freeze({
    dubi:{name:'두비',line:'“좋아! 하나씩 챙겨보자!”'},
    lori:{name:'로리',line:'“괜찮아, 천천히 골라도 돼!”'},
    ink:{name:'잉크',line:'“음… 다른 방법도 있지.”'},
    nova:{name:'노바',line:'“가보자! 하면 되지!”'},
    take:{name:'테이크',line:'“차근차근 같이 해보자.”'},
    zero:{name:'제로',line:'“언제나, 네 이야기를 응원해!”'}
  });
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));
    const getState=options.getState||(()=>({}));
    const assetRegistry=options.assetRegistry||null;
    const rootEl=q('#characterSetupView');
    const scene=q('#cfScene');
    const crewImg=q('#cfCrewAsset');
    const crewName=q('#cfCompanionName');
    const crewLine=q('#cfCompanionLine');
    if(!rootEl||!scene)return Object.freeze({render(){},mount(){},unmount(){}});

    let raf=0,targetX=0,targetY=0,currentX=0,currentY=0,mounted=false;
    const reduced=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    function companionId(){
      const state=getState()||{};
      const raw=String(state.expedition?.primaryCompanionId||state.profile?.primaryCompanionId||'dubi').toLowerCase();
      return CREW[raw]?raw:'dubi';
    }
    function render(status){
      const id=companionId(),crew=CREW[id];
      rootEl.dataset.cfStatus=status||rootEl.dataset.cfStatus||'START';
      rootEl.dataset.cfCrew=id;
      if(crewName)crewName.textContent=crew.name;
      if(crewLine)crewLine.textContent=crew.line;
      if(crewImg){
        crewImg.dataset.cfAssetGroup='crew';
        crewImg.dataset.cfAssetKey=id;
      }
      assetRegistry?.bind?.(scene);
    }
    function apply(){
      raf=0;currentX+=(targetX-currentX)*.08;currentY+=(targetY-currentY)*.08;
      scene.style.setProperty('--cf-x',currentX.toFixed(2));
      scene.style.setProperty('--cf-y',currentY.toFixed(2));
      if(Math.abs(targetX-currentX)>.02||Math.abs(targetY-currentY)>.02)raf=requestAnimationFrame(apply);
    }
    function setTarget(x,y){if(reduced())return;targetX=clamp(x,-1,1);targetY=clamp(y,-1,1);if(!raf)raf=requestAnimationFrame(apply);}
    function pointerMove(e){const r=rootEl.getBoundingClientRect();if(!r.width||!r.height)return;setTarget(((e.clientX-r.left)/r.width-.5)*2,((e.clientY-r.top)/r.height-.5)*2);}
    function pointerLeave(){setTarget(0,0);}
    function orientation(e){if(reduced()||typeof e.gamma!=='number'||typeof e.beta!=='number')return;setTarget(clamp(e.gamma/12,-1,1),clamp((e.beta-45)/12,-1,1));}
    function mount(){
      if(mounted)return;mounted=true;
      rootEl.addEventListener('pointermove',pointerMove,{passive:true});
      rootEl.addEventListener('pointerleave',pointerLeave,{passive:true});
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission!=='function'){
        window.addEventListener('deviceorientation',orientation,{passive:true});
      }
      assetRegistry?.load?.().then(()=>{
        assetRegistry?.bind?.(scene);
        render(rootEl.dataset.cfStatus);
      });
      render(rootEl.dataset.cfStatus);
    }
    function unmount(){
      if(!mounted)return;mounted=false;
      rootEl.removeEventListener('pointermove',pointerMove);
      rootEl.removeEventListener('pointerleave',pointerLeave);
      window.removeEventListener('deviceorientation',orientation);
      if(raf)cancelAnimationFrame(raf);raf=0;
      scene.style.setProperty('--cf-x','0');scene.style.setProperty('--cf-y','0');
    }
    return Object.freeze({version:VERSION,render,mount,unmount});
  }
  root.CharacterFormationSceneRuntime=Object.freeze({version:VERSION,create});
})(typeof globalThis!=='undefined'?globalThis:this);
