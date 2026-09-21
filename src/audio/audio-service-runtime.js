(function(root){
  'use strict';

  function create(options={}){
    const player=options.player;
    const soundMap=options.soundMap||{};
    const onStatus=typeof options.onStatus==='function'?options.onStatus:()=>{};

    function setSource(sound){
      if(!player)return;
      const src=soundMap[sound]||'';
      const resolved=src?new URL(src,root.location?.href||'http://localhost/').href:'';
      if(player.src!==resolved){
        player.pause();
        if(src){player.src=src;player.load()}
        else{player.removeAttribute('src');player.load()}
      }
    }

    async function fade(target=0,duration=260){
      if(!player)return;
      const from=Number.isFinite(player.volume)?player.volume:.34;
      const steps=8,delay=Math.max(20,Math.floor(duration/steps));
      for(let i=1;i<=steps;i++){
        player.volume=from+(target-from)*(i/steps);
        await new Promise(resolve=>setTimeout(resolve,delay));
      }
      player.volume=target;
    }

    async function play(sound,{preview=false}={}){
      if(!player)return false;
      if(sound==='OFF'){player.pause();onStatus();return true}
      setSource(sound);
      player.volume=preview?.26:.34;
      try{
        await player.play();
        onStatus();
        return true;
      }catch{
        onStatus('재생하려면 음악 버튼을 한 번 눌러주세요');
        return false;
      }
    }

    async function pause({fadeOut=true}={}){
      if(!player)return;
      if(fadeOut&&!player.paused)await fade(0,220);
      player.pause();
      player.volume=.34;
      onStatus();
    }

    async function resume(sound){
      if(!player||sound==='OFF')return false;
      setSource(sound);
      player.volume=.05;
      try{
        await player.play();
        await fade(.34,260);
        onStatus();
        return true;
      }catch{
        onStatus('재생하려면 음악 버튼을 한 번 눌러주세요');
        return false;
      }
    }

    return Object.freeze({setSource,fade,play,pause,resume});
  }

  root.ReadyRebuildAudioService=Object.freeze({
    version:'READY_REBUILD_AUDIO_SERVICE_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
