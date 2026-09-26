export function carryPolicyForState(state){
  const s=String(state||'').trim();
  return Object.freeze({
    state:s,
    carryEligible:['PARTIAL','DEFERRED'].includes(s),
    resolutionRequired:['BLOCKED','WAITING_FOR_PARENT'].includes(s),
    resolvesOpenCarry:s==='COMPLETED'
  });
}
export function carryEscalation({nextDepth=0,deadline=null,targetDate=null,maxAutoDepth=3}={}){
  const depth=Math.max(0,Number(nextDepth)||0);
  const maxDepth=Math.max(1,Number(maxAutoDepth)||3);
  const exceeded=!!deadline&&!!targetDate&&String(targetDate)>String(deadline);
  const near=!!deadline&&!!targetDate&&(()=>{
    const d=new Date(String(deadline)+'T12:00:00');
    d.setDate(d.getDate()-1);
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return String(targetDate)>=`${y}-${m}-${day}`;
  })();
  if(exceeded)return {required:true,reason:'DEADLINE_EXCEEDED'};
  if(depth>maxDepth)return {required:true,reason:'REPEATED_CARRY_LIMIT'};
  if(near&&depth>=maxDepth)return {required:true,reason:'REPEATED_CARRY_NEAR_DEADLINE'};
  return {required:false,reason:null};
}
