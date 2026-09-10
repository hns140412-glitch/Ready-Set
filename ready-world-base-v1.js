(() => {
'use strict';
const VERSION='2026.09.10-world-base-v1';
const url=new URL(location.href);
const hadWorld=url.searchParams.has('world');
if(!hadWorld){url.searchParams.set('world','1');history.replaceState(history.state,'',url)}
const style=document.createElement('style');
style.id='readyWorldBaseStyle';
style.textContent=`
#homeView.worldShell{background:#78cfff!important}
#homeView.worldShell>.topbar{position:absolute;z-index:40;left:0;right:0;top:0;background:transparent!important;color:#103f64;padding-top:max(18px,env(safe-area-inset-top));pointer-events:none}
#homeView.worldShell>.topbar .brand,#homeView.worldShell>.topbar .tagline,#homeView.worldShell>.topbar .avatarButton{display:none!important}
#homeView.worldShell .homeMain{padding:0!important;margin:0!important;max-width:none!important;width:100%!important}
#homeView.worldShell .worldStage{padding:0!important;min-height:100dvh!important;background:#78cfff}
#homeView.worldShell .worldSky{min-height:100dvh!important;border-radius:0!important;border:0!important;box-shadow:none!important}
#homeView.worldShell .worldTop{padding-top:max(34px,calc(env(safe-area-inset-top) + 20px))!important}
#homeView.worldShell .worldJourney{height:calc(100dvh - 175px)!important;min-height:560px}
#homeView.worldShell .worldIsland{top:190px}
#homeView.worldShell .worldDock{bottom:max(88px,calc(env(safe-area-inset-bottom) + 76px))!important}
#homeView.worldShell>.bottomNav{z-index:45;background:rgba(255,255,255,.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
#homeView.worldShell .worldJourneyOverlay{position:fixed!important;inset:0!important;border-radius:0!important;z-index:60!important}
@media(max-width:390px){#homeView.worldShell .worldJourney{height:calc(100dvh - 160px)!important;min-height:535px}#homeView.worldShell .worldIsland{top:178px}}
`;
document.head.appendChild(style);
const clean=()=>{if(hadWorld)return;const u=new URL(location.href);u.searchParams.delete('world');history.replaceState(history.state,'',u)};
window.addEventListener('load',()=>setTimeout(clean,1200),{once:true});
window.ReadyWorldBaseV1={version:VERSION,validate:()=>({nativeWorldBase:true,noCardShell:true,sceneTransition:true,legacyBaseUnderlay:false})};
})();