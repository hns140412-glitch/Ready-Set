(function(root){
  'use strict';
  function create(options={}){
    const q=options.query||((s)=>document.querySelector(s));

    function renderAuth(session={}){
      const badge=q('#authStateBadge'),text=q('#authStatusText');
      const login=q('#authLoginControls'),logged=q('#authLoggedInControls'),link=q('#familyLinkChildSection');
      if(badge)badge.textContent=session.authenticated?(session.role==='PARENT'?'보호자':'학생'):'로컬 모드';
      if(text){
        text.textContent=session.authenticated
          ? `${session.role==='PARENT'?'PARENT':'CHILD'} 계정으로 로그인됨 · 가족 ${session.family_id||'-'}`
          : '로그인하지 않아도 이 기기에서 CHILD 로컬 모드로 사용할 수 있습니다.';
      }
      if(login)login.hidden=!!session.authenticated;
      if(logged)logged.hidden=!session.authenticated;
      if(link)link.hidden=!(session.authenticated&&session.role==='PARENT');
    }

    function renderSync({status={},pending=0,conflicts=0}={}){
      const badge=q('#syncStateBadge'),text=q('#syncStatusText');
      if(badge){
        badge.textContent=status.state==='CONNECTED'?'클라우드 연결':status.state==='ERROR'?'연결 오류':'로컬 저장';
        badge.dataset.state=status.state;
      }
      if(text){
        text.textContent=status.state==='CONNECTED'
          ?'클라우드 동기화 서버와 연결되어 Outbox를 전송할 수 있습니다.'
          :status.state==='ERROR'
            ?'클라우드 연결에 문제가 있어 로컬 저장을 유지하고 있습니다. 데이터는 지워지지 않습니다.'
            :'현재 이 기기에 안전하게 저장 중이에요. 클라우드 동기화는 아직 연결되지 않았습니다.';
      }
      const p=q('#syncPendingCount');if(p)p.textContent=String(pending);
      const c=q('#syncConflictCount');if(c)c.textContent=String(conflicts);
    }

    return Object.freeze({renderAuth,renderSync});
  }

  root.ReadyRebuildAuthSyncView=Object.freeze({
    version:'READY_REBUILD_AUTH_SYNC_VIEW_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
