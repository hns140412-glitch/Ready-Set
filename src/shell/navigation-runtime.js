(function(root){
  'use strict';
  function create(options={}){
    const views=options.views||{};
    const before=typeof options.before==='function'?options.before:()=>({});
    const after=typeof options.after==='function'?options.after:()=>{};
    const guard=typeof options.guard==='function'?options.guard:(name=>({ok:true,name}));
    function show(requested,context={}){
      const verdict=guard(requested,context)||{ok:false,reason:'NAV_GUARD_REJECTED'};
      if(!verdict.ok)return verdict;
      const name=verdict.name||requested;
      const nodes=[...document.querySelectorAll('.view')];
      const target=nodes.find(v=>v.dataset.view===name);
      if(!target)return {ok:false,reason:'VIEW_NOT_FOUND',name};
      before(name,context);
      for(const node of nodes)node.classList.toggle('active',node===target);
      window.scrollTo(0,0);
      const render=views[name];
      if(typeof render==='function')render(context);
      after(name,context);
      return {ok:true,name};
    }
    return Object.freeze({show});
  }
  root.ReadyRebuildNavigation=Object.freeze({
    version:'READY_REBUILD_NAVIGATION_V01',
    create
  });
})(typeof globalThis!=='undefined'?globalThis:this);
