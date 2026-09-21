(function(root){
  'use strict';

  function install(){
    const dialogs=['categorySheet','soundSheet','pauseSheet','recIntro'];
    let lastFocus=null;

    const focusables=scope=>[...scope.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(el=>!el.hidden&&el.getAttribute('aria-hidden')!=='true');

    function syncPressed(){
      document.querySelectorAll('[data-category],[data-minutes],[data-style],[data-guide-type],[data-guide-voice],[data-sound],[data-weekday]').forEach(el=>{
        el.setAttribute('aria-pressed',el.classList.contains('on')?'true':'false');
      });
    }

    function syncTabs(){
      document.querySelectorAll('[data-planner-tab]').forEach(tab=>{
        const active=tab.classList.contains('on');
        tab.setAttribute('aria-selected',active?'true':'false');
        tab.setAttribute('tabindex',active?'0':'-1');
      });
    }

    function openDialog(el){
      if(!el||el.hidden)return;
      lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
      focusables(el)[0]?.focus({preventScroll:true});
    }

    function closeDialog(el){
      if(!el)return;
      requestAnimationFrame(()=>{
        if(lastFocus&&document.contains(lastFocus))lastFocus.focus({preventScroll:true});
        lastFocus=null;
      });
    }

    const observer=new MutationObserver(records=>{
      let stateDirty=false;
      for(const record of records){
        if(record.type==='attributes'&&record.attributeName==='hidden'&&dialogs.includes(record.target.id)){
          if(record.target.hidden)closeDialog(record.target);else openDialog(record.target);
        }
        if(record.type==='attributes'&&record.attributeName==='class')stateDirty=true;
      }
      if(stateDirty){syncPressed();syncTabs();}
    });

    dialogs.forEach(id=>{
      const el=document.getElementById(id);
      if(el)observer.observe(el,{attributes:true,attributeFilter:['hidden']});
    });
    document.querySelectorAll('[data-category],[data-minutes],[data-style],[data-guide-type],[data-guide-voice],[data-sound],[data-weekday],[data-planner-tab]')
      .forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class']}));

    document.addEventListener('keydown',event=>{
      const dialog=dialogs.map(id=>document.getElementById(id)).find(el=>el&&!el.hidden);
      if(!dialog)return;
      if(event.key==='Escape'){
        event.preventDefault();
        dialog.querySelector('[data-close-sheet],[data-close-sound],[data-close-pause],#cancelRecordBtn')?.click();
        return;
      }
      if(event.key!=='Tab')return;
      const items=focusables(dialog);
      if(items.length===0)return;
      const first=items[0],last=items[items.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    });

    document.addEventListener('keydown',event=>{
      const tabs=[...document.querySelectorAll('[data-planner-tab]')];
      if(!tabs.includes(document.activeElement))return;
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      let index=tabs.indexOf(document.activeElement);
      if(event.key==='Home')index=0;
      else if(event.key==='End')index=tabs.length-1;
      else if(event.key==='ArrowRight')index=(index+1)%tabs.length;
      else index=(index-1+tabs.length)%tabs.length;
      tabs[index].focus();
      tabs[index].click();
    });

    syncPressed();
    syncTabs();
    return Object.freeze({observer,syncPressed,syncTabs});
  }

  root.ReadyRebuildAccessibility=Object.freeze({
    version:'READY_REBUILD_ACCESSIBILITY_V01',
    install
  });
})(typeof globalThis!=='undefined'?globalThis:this);
