(function(root){
  'use strict';

  function create(options={}){
    const drawAvatar=options.drawAvatar||(async()=>{});
    const currentMissionLabels=options.currentMissionLabels||(()=>[]);
    const resultSource=options.resultSource||(()=>null);
    const resultOutcomeProfile=options.resultOutcomeProfile||(()=>({done:false,label:'결과',shareTitle:'오늘의 탐험',historyLabel:'결과',shareText:'Ready & Set'}));
    const shareTheme=options.shareTheme||(()=> 'cloud');
    const formatTime=options.formatTime||((x)=>String(x||0));
    const roundRect=options.roundRect||(()=>{});
    const toast=options.toast||(()=>{});

    function themeCopy(theme,kind,r=null){
      if(kind==='result'){
        const profile=resultOutcomeProfile(r||{});
        if(!profile.done)return {title:profile.shareTitle,sub:profile.historyLabel};
        return theme==='sail'
          ?{title:'멋진 항해였어요!',sub:'오늘의 섬 탐험 완료'}
          :{title:'오늘의 할 일이 도착했어요!',sub:'오늘의 섬 탐험 완료'};
      }
      return theme==='sail'
        ?{title:'오늘의 할 일을 찾아 항해해볼까?',sub:'바다를 따라 오늘의 섬으로'}
        :{title:'오늘의 할 일을 발견하러 가볼까?',sub:'아래로 내려가 오늘의 섬으로'};
    }

    function drawIslandScene(ctx,theme){
      const sky=ctx.createLinearGradient(0,0,0,430);sky.addColorStop(0,'#64c9ff');sky.addColorStop(1,'#dff7ff');
      ctx.fillStyle=sky;ctx.fillRect(0,0,900,430);ctx.fillStyle='#25aee8';ctx.fillRect(0,300,900,130);
      ctx.fillStyle='#55b96a';ctx.beginPath();ctx.ellipse(560,300,245,100,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#87735e';ctx.beginPath();ctx.moveTo(370,305);ctx.lineTo(750,305);ctx.lineTo(670,410);ctx.lineTo(430,410);ctx.closePath();ctx.fill();
      ctx.fillStyle='#fff';ctx.fillRect(545,220,28,105);ctx.fillStyle='#ff6a45';ctx.beginPath();ctx.moveTo(570,225);ctx.lineTo(630,245);ctx.lineTo(570,258);ctx.fill();
      if(theme==='sail'){
        ctx.fillStyle='#8a5b35';ctx.fillRect(145,320,210,18);ctx.fillStyle='#fff7dc';ctx.beginPath();ctx.moveTo(245,150);ctx.lineTo(245,318);ctx.lineTo(110,295);ctx.closePath();ctx.fill();ctx.strokeStyle='#7a5a3c';ctx.lineWidth=7;ctx.stroke();
      }else{
        ctx.fillStyle='rgba(255,255,255,.88)';
        for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(100+i*165,75+(i%2)*45,105,38,0,0,Math.PI*2);ctx.fill()}
      }
    }

    async function render(kind='result'){
      const r=kind==='result'?resultSource():null;
      const theme=shareTheme();
      const copy=themeCopy(theme,kind,r);
      const canvas=document.createElement('canvas');canvas.width=900;canvas.height=600;
      const ctx=canvas.getContext('2d');

      ctx.fillStyle='#fff';ctx.fillRect(0,0,900,600);drawIslandScene(ctx,theme);
      ctx.fillStyle='rgba(255,255,255,.92)';roundRect(ctx,28,24,238,54,27);ctx.fill();ctx.fillStyle='#102d55';ctx.font='900 27px sans-serif';ctx.textAlign='left';ctx.fillText('Ready & Set',55,60);
      ctx.fillStyle='#0a3265';ctx.font='900 46px sans-serif';ctx.fillText(copy.title,40,145);ctx.font='700 23px sans-serif';ctx.fillText(copy.sub,42,182);
      await drawAvatar(ctx,theme==='sail'?300:245,theme==='sail'?325:285,58);

      const tasks=kind==='result'?[...(r?.selected||[]),...(r?.tasks||[])]:currentMissionLabels();
      const profile=kind==='result'?resultOutcomeProfile(r||{}):null;
      const total=Math.max(1,tasks.length);
      const done=kind==='result'&&profile?.done?total:0;
      const focus=kind==='result'&&r?formatTime(r.focusMs||0):'00:00';
      const stars=kind==='result'&&profile?.done?Math.max(1,Math.min(30,done*5)):0;

      ctx.fillStyle='#fff';roundRect(ctx,0,430,900,170,0);ctx.fill();ctx.strokeStyle='#e5edf5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,430);ctx.lineTo(900,430);ctx.stroke();
      const stats=[
        [kind==='result'?(profile?.done?done+'/'+total:profile.label):total+'개',kind==='result'?(profile?.done?'완료 미션':'결과 상태'):'오늘의 미션'],
        [focus,'집중 시간'],
        ['+'+stars,'획득 별']
      ];
      stats.forEach((v,i)=>{
        const cx=150+i*300;ctx.textAlign='center';ctx.fillStyle='#0d3569';ctx.font='900 35px sans-serif';ctx.fillText(v[0],cx,495);
        ctx.fillStyle='#718098';ctx.font='700 18px sans-serif';ctx.fillText(v[1],cx,528);
        if(i<2){ctx.strokeStyle='#e2e8ef';ctx.beginPath();ctx.moveTo(cx+150,458);ctx.lineTo(cx+150,540);ctx.stroke()}
      });
      ctx.textAlign='left';ctx.fillStyle='#223d62';ctx.font='700 18px sans-serif';ctx.fillText(tasks.slice(0,3).join(' · ')||'오늘의 탐험',35,574);
      return canvas;
    }

    async function share(kind='result'){
      const canvas=await render(kind);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.94));
      const file=new File([blob],`Ready_Set_${shareTheme()}_${kind}_${Date.now()}.png`,{type:'image/png'});
      const text=kind==='result'?resultOutcomeProfile(resultSource()||{}).shareText:'Ready & Set · 오늘의 탐험을 시작해요!';
      try{
        if(navigator.canShare?.({files:[file]})){
          await navigator.share({files:[file],title:'Ready & Set',text});
          return {ok:true,method:'SHARE'};
        }
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download=file.name;a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        toast('공유 카드를 이미지로 저장했어요.');
        return {ok:true,method:'DOWNLOAD'};
      }catch(error){
        if(error?.name!=='AbortError')toast('공유를 완료하지 못했어요.');
        return {ok:false,reason:error?.name||'SHARE_FAILED'};
      }
    }

    return Object.freeze({themeCopy,drawIslandScene,render,share});
  }

  root.ReadyRebuildShareCard=Object.freeze({
    version:'READY_REBUILD_SHARE_CARD_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
