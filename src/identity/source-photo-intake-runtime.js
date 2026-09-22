(function(root){
  'use strict';

  const VERSION='READY_SOURCE_PHOTO_INTAKE_V01';
  const DEFAULTS=Object.freeze({
    maxInputBytes:12*1024*1024,
    maxDimension:1280,
    outputMime:'image/jpeg',
    outputQuality:0.88
  });

  function estimateDataUrlBytes(dataUrl=''){
    const base64=String(dataUrl).split(',')[1]||'';
    return Math.floor(base64.length*3/4);
  }

  function fallbackHash(text=''){
    let h=2166136261;
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return 'fnv1a-'+(h>>>0).toString(16).padStart(8,'0');
  }

  async function sha256(text,cryptoImpl=root.crypto){
    try{
      if(!cryptoImpl?.subtle)return fallbackHash(text);
      const bytes=new TextEncoder().encode(text);
      const digest=await cryptoImpl.subtle.digest('SHA-256',bytes);
      return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
    }catch(_){
      return fallbackHash(text);
    }
  }

  function validateFile(file,{maxInputBytes=DEFAULTS.maxInputBytes}={}){
    if(!file)return {ok:false,reason:'NO_FILE'};
    const type=String(file.type||'').toLowerCase();
    if(type&&!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(type)){
      return {ok:false,reason:'UNSUPPORTED_IMAGE_TYPE',type};
    }
    if(Number(file.size||0)>maxInputBytes){
      return {ok:false,reason:'SOURCE_PHOTO_TOO_LARGE',bytes:Number(file.size||0),limit:maxInputBytes};
    }
    return {ok:true,type:type||'image/unknown',bytes:Number(file.size||0)};
  }

  function fitSize(width,height,maxDimension=DEFAULTS.maxDimension){
    const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1);
    const scale=Math.min(1,maxDimension/Math.max(w,h));
    return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale)),scale};
  }

  function readAsDataUrl(file,FileReaderCtor=root.FileReader){
    return new Promise((resolve,reject)=>{
      if(!FileReaderCtor)return reject(new Error('FILEREADER_UNAVAILABLE'));
      const reader=new FileReaderCtor();
      reader.onerror=()=>reject(new Error('SOURCE_PHOTO_READ_FAILED'));
      reader.onload=()=>resolve(String(reader.result||''));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl,ImageCtor=root.Image){
    return new Promise((resolve,reject)=>{
      if(!ImageCtor)return reject(new Error('IMAGE_DECODER_UNAVAILABLE'));
      const img=new ImageCtor();
      img.onerror=()=>reject(new Error('SOURCE_PHOTO_DECODE_FAILED'));
      img.onload=()=>resolve(img);
      img.src=dataUrl;
    });
  }

  function canvasDataUrl(img,size,{documentImpl=root.document,outputMime=DEFAULTS.outputMime,outputQuality=DEFAULTS.outputQuality}={}){
    if(!documentImpl?.createElement)throw new Error('CANVAS_UNAVAILABLE');
    const canvas=documentImpl.createElement('canvas');
    canvas.width=size.width;canvas.height=size.height;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('CANVAS_CONTEXT_UNAVAILABLE');
    ctx.drawImage(img,0,0,size.width,size.height);
    return canvas.toDataURL(outputMime,outputQuality);
  }

  async function normalize(file,options={}){
    const validation=validateFile(file,options);
    if(!validation.ok)return validation;
    const raw=await readAsDataUrl(file,options.FileReaderCtor||root.FileReader);
    const img=await loadImage(raw,options.ImageCtor||root.Image);
    const size=fitSize(img.naturalWidth||img.width,img.naturalHeight||img.height,options.maxDimension||DEFAULTS.maxDimension);
    const normalized=canvasDataUrl(img,size,{
      documentImpl:options.documentImpl||root.document,
      outputMime:options.outputMime||DEFAULTS.outputMime,
      outputQuality:options.outputQuality??DEFAULTS.outputQuality
    });
    const sourceHash=await sha256(normalized,options.cryptoImpl||root.crypto);
    return {
      ok:true,
      version:VERSION,
      identityAuthority:'SOURCE_PHOTO',
      source_hash:sourceHash,
      data_url:normalized,
      width:size.width,
      height:size.height,
      bytes:estimateDataUrlBytes(normalized),
      mime:options.outputMime||DEFAULTS.outputMime,
      original:{
        name:String(file.name||''),
        type:validation.type,
        bytes:validation.bytes
      }
    };
  }

  root.ReadySourcePhotoIntake=Object.freeze({
    version:VERSION,
    DEFAULTS,
    validateFile,
    fitSize,
    estimateDataUrlBytes,
    normalize
  });
})(typeof globalThis!=='undefined'?globalThis:this);
