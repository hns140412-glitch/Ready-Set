(function(root){
  'use strict';

  const VERSION='CHARACTER_VISUAL_ID_DERIVATIVE_V01';
  const SPECS=Object.freeze({
    portrait_card:Object.freeze({width:768,height:960,aspect:4/5,anchorY:0.05,mode:'TOP_CENTER_CROP'}),
    avatar_square:Object.freeze({width:512,height:512,aspect:1,anchorY:0.04,mode:'HEAD_AND_SHOULDERS_HEURISTIC'})
  });

  function loadImage(url,{ImageCtor=root.Image}={}){
    return new Promise((resolve,reject)=>{
      if(!ImageCtor)return reject(new Error('CHARACTER_DERIVATIVE_IMAGE_DECODER_UNAVAILABLE'));
      const img=new ImageCtor();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('CHARACTER_DERIVATIVE_IMAGE_LOAD_FAILED'));
      img.src=url;
    });
  }

  function sourceRect(img,spec){
    const w=Number(img.naturalWidth||img.width||0);
    const h=Number(img.naturalHeight||img.height||0);
    if(!w||!h)throw new Error('CHARACTER_DERIVATIVE_SOURCE_DIMENSIONS_INVALID');
    const targetAspect=spec.width/spec.height;
    let sw=w,sh=h,sx=0,sy=0;

    if(w/h>targetAspect){
      sw=h*targetAspect;
      sx=(w-sw)/2;
    }else{
      sh=w/targetAspect;
      sy=Math.min(Math.max(0,h-sh),h*Number(spec.anchorY||0));
    }

    if(spec.mode==='HEAD_AND_SHOULDERS_HEURISTIC'){
      const square=Math.min(w,h*0.62);
      sw=square;
      sh=square;
      sx=(w-square)/2;
      sy=Math.min(Math.max(0,h-square),h*Number(spec.anchorY||0));
    }
    return {sx,sy,sw,sh};
  }

  function render(img,spec,{documentImpl=root.document,mime='image/webp',quality=0.9}={}){
    if(!documentImpl?.createElement)throw new Error('CHARACTER_DERIVATIVE_CANVAS_UNAVAILABLE');
    const canvas=documentImpl.createElement('canvas');
    canvas.width=spec.width;
    canvas.height=spec.height;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('CHARACTER_DERIVATIVE_CANVAS_CONTEXT_UNAVAILABLE');
    const r=sourceRect(img,spec);
    ctx.drawImage(img,r.sx,r.sy,r.sw,r.sh,0,0,spec.width,spec.height);
    return {
      data_url:canvas.toDataURL(mime,quality),
      width:spec.width,
      height:spec.height,
      crop:r,
      mime
    };
  }

  async function deriveFromUrl(url,options={}){
    if(!String(url||'').trim())throw new Error('CHARACTER_DERIVATIVE_SOURCE_URL_REQUIRED');
    const img=await loadImage(url,options);
    return Object.freeze({
      contract_version:VERSION,
      source_url:String(url),
      portrait_card:Object.freeze(render(img,SPECS.portrait_card,options)),
      avatar_square:Object.freeze(render(img,SPECS.avatar_square,options))
    });
  }

  const api=Object.freeze({
    version:VERSION,
    owner:'CHARACTER_VISUAL_ID',
    SPECS,
    sourceRect,
    render,
    deriveFromUrl
  });

  root.CharacterVisualIdDerivative=api;
})(typeof globalThis!=='undefined'?globalThis:this);
