(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(root) root.ReadyRecordingContextV1=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function kindFromLabels(labels=[]){
    const text=(Array.isArray(labels)?labels:[labels]).join(' ').toLowerCase();
    return /spelling\s*bee|spelling|bee/.test(text)?'spelling Bee':'grammar';
  }
  function filename({name='Judy',labels=[],date=new Date(),ext='m4a'}={}){
    const safe=String(name||'Judy').replace(/[\\/:*?"<>|]/g,'_');
    const day=`${date.getFullYear()} ${String(date.getMonth()+1).padStart(2,'0')} ${String(date.getDate()).padStart(2,'0')}`;
    return `${safe}’s Bricks ${kindFromLabels(labels)} recording ${day}.${ext}`;
  }
  return Object.freeze({kindFromLabels,filename});
});
