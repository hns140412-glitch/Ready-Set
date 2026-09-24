(function(root){
  'use strict';

  function create(options={}){
    const view=options.view;
    const query=options.query||((s)=>root.document?.querySelector?.(s));
    const familySession=options.familySession||(()=>({authenticated:false,role:'CHILD'}));
    const familyApi=options.familyApi||(()=>root.ReadyFamilySession);
    const syncAdapter=options.syncAdapter||(()=>root.ReadySetSyncAdapter);
    const localFirst=options.localFirst||(()=>root.ReadySetLocalFirst);
    const requireParentUi=options.requireParentUi||(()=>false);
    const renderPlanner=options.renderPlanner||(()=>{});
    const toast=options.toast||(()=>{});
    const eventTarget=options.eventTarget||root;
    let bound=false;
    if(!view)throw new Error('AUTH_SYNC_CONTROLLER_DEPENDENCY_MISSING');

    function renderAuthStatus(){
      return view.renderAuth(familySession());
    }

    async function renderSyncStatus(){
      const adapter=syncAdapter();
      const local=localFirst();
      if(!adapter||!local)return {ok:false,reason:'SYNC_RUNTIME_MISSING'};
      const status=adapter.status();
      const [outbox,conflicts]=await Promise.all([local.outbox(),local.conflicts()]);
      const memberScope=root.ReadyMemberScope||null;
      const activeMember=memberScope?.memberId?.()||null;
      const belongsToActiveMember=row=>{
        const parsed=memberScope?.parseSyncScope?.(row.scope)||{member_id:null,scope:row.scope};
        return activeMember?parsed.member_id===activeMember:parsed.member_id==null;
      };
      const pending=outbox.filter(belongsToActiveMember).filter(x=>!['SENT','SUPERSEDED','ACKED'].includes(x.status)).length;
      const openConflictRows=conflicts.filter(belongsToActiveMember).filter(x=>x.status==='OPEN');
      view.renderSync({status,pending,conflicts:openConflictRows.length,conflictRows:openConflictRows});
      return {ok:true,status,pending,conflicts:openConflictRows.length,conflictRows:openConflictRows};
    }

    function googleLogin(){
      const result=familyApi()?.googleLogin?.();
      if(!result?.ok)toast('Google 로그인을 시작하지 못했습니다.');
      return result||{ok:false,reason:'GOOGLE_LOGIN_UNAVAILABLE'};
    }

    async function login(){
      const email=query('#authEmailInput')?.value.trim();
      const password=query('#authPasswordInput')?.value||'';
      if(!email||!password){toast('이메일과 비밀번호를 확인해 주세요.');return {ok:false,reason:'INVALID_INPUT'};}
      const result=await familyApi()?.login?.({email,password});
      if(result?.ok){
        toast('가족 계정으로 로그인했어요.');
        renderAuthStatus();renderPlanner();await renderSyncStatus();
        return result;
      }
      const message=result?.reason==='FAMILY_MEMBERSHIP_REQUIRED'
        ? '아직 가족 연결이 완료되지 않은 계정입니다.'
        : result?.reason==='IDENTITY_ROLE_INVALID'
          ? '계정 역할 설정을 확인해 주세요.'
          : '로그인 정보를 확인해 주세요.';
      toast(message);
      return result||{ok:false,reason:'LOGIN_FAILED'};
    }

    async function signup(){
      const name=query('#authNameInput')?.value.trim();
      const email=query('#authEmailInput')?.value.trim();
      const password=query('#authPasswordInput')?.value||'';
      if(!email||password.length<8){toast('이메일과 8자 이상 비밀번호를 확인해 주세요.');return {ok:false,reason:'INVALID_INPUT'};}
      const result=await familyApi()?.signup?.({name,email,password});
      toast(result?.ok?'가입 확인 메일을 확인해 주세요. 가입 후 기본 역할은 CHILD입니다.':'계정 생성에 실패했습니다.');
      return result||{ok:false,reason:'SIGNUP_FAILED'};
    }

    async function logout(){
      await familyApi()?.logout?.();
      toast('로그아웃했습니다. 로컬 CHILD 모드로 전환합니다.');
      renderAuthStatus();renderPlanner();await renderSyncStatus();
      return {ok:true};
    }

    async function linkChild(){
      if(!requireParentUi())return {ok:false,reason:'PARENT_REQUIRED'};
      const input=query('#familyChildEmailInput');
      const email=input?.value.trim();
      if(!email){toast('연결할 CHILD 이메일을 입력해 주세요.');return {ok:false,reason:'INVALID_INPUT'};}
      const result=await familyApi()?.linkChild?.(email);
      if(result?.ok){
        toast('CHILD 계정을 가족에 연결했습니다.');
        if(input)input.value='';
        return result;
      }
      const message=result?.reason==='CHILD_ACCOUNT_NOT_FOUND'
        ? '먼저 CHILD 계정을 가입·확인한 뒤 연결해 주세요.'
        : result?.reason==='TARGET_ALREADY_IN_OTHER_FAMILY'
          ? '이미 다른 가족에 연결된 계정입니다.'
          : 'CHILD 계정을 연결하지 못했습니다.';
      toast(message);
      return result||{ok:false,reason:'LINK_CHILD_FAILED'};
    }

    async function resolveSyncConflict(conflictId,resolution){
      const local=localFirst();
      if(!local?.resolveConflict)return {ok:false,reason:'SYNC_RUNTIME_MISSING'};
      const result=await local.resolveConflict(conflictId,resolution);
      if(!result?.ok){
        toast('동기화 충돌을 해결하지 못했어요.');
        await renderSyncStatus();
        return result||{ok:false,reason:'CONFLICT_RESOLUTION_FAILED'};
      }
      if(resolution==='KEEP_LOCAL'){
        toast('이 기기의 내용을 유지했어요. 다음 동기화 때 다시 전송합니다.');
        await renderSyncStatus();
        return result;
      }
      toast('클라우드 내용을 적용했어요. 화면을 다시 불러옵니다.');
      await renderSyncStatus();
      if(result.reload_required)root.location.reload();
      return result;
    }

    async function onConflictClick(event){
      const button=event.target?.closest?.('[data-sync-conflict-resolution]');
      if(!button)return;
      const conflictId=button.dataset.syncConflictId;
      const resolution=button.dataset.syncConflictResolution;
      if(!conflictId||!['KEEP_LOCAL','ACCEPT_REMOTE'].includes(resolution))return;
      await resolveSyncConflict(conflictId,resolution);
    }

    async function checkSync(){
      const adapter=syncAdapter();
      const local=localFirst();
      const status=adapter?.status?.();
      if(!status?.configured||!status?.enabled){
        toast('클라우드 동기화는 아직 연결되지 않았어요. 로컬 저장은 정상입니다.');
        await renderSyncStatus();
        return {ok:false,reason:'SYNC_NOT_CONFIGURED'};
      }
      const health=await adapter.health();
      if(health.ok){
        const flushed=await local.flush();
        toast(`동기화 연결 확인 · 전송 ${flushed.sent||0}건`);
      }else{
        toast('클라우드 연결을 확인하지 못했어요. 로컬 저장을 유지합니다.');
      }
      await renderSyncStatus();
      return health;
    }

    function bind(){
      if(bound)return false;
      bound=true;
      eventTarget.addEventListener?.('readyset-family-session',()=>{
        renderAuthStatus();renderPlanner();renderSyncStatus().catch(()=>{});
      });
      eventTarget.addEventListener?.('readyset-sync-status',()=>renderSyncStatus().catch(()=>{}));
      eventTarget.addEventListener?.('click',onConflictClick);
      query('#authGoogleLoginBtn')?.addEventListener('click',googleLogin);
      query('#authLoginBtn')?.addEventListener('click',login);
      query('#authSignupBtn')?.addEventListener('click',signup);
      query('#authLogoutBtn')?.addEventListener('click',logout);
      query('#familyLinkChildBtn')?.addEventListener('click',linkChild);
      query('#checkSyncBtn')?.addEventListener('click',checkSync);
      return true;
    }

    return Object.freeze({renderAuthStatus,renderSyncStatus,resolveSyncConflict,googleLogin,login,signup,logout,linkChild,checkSync,bind});
  }

  root.ReadyRebuildAuthSyncController=Object.freeze({
    version:'READY_REBUILD_AUTH_SYNC_CONTROLLER_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
