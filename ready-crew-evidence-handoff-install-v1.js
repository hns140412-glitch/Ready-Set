(function(root){
  'use strict';
  const handoff=root.TakyCrewEvidenceHandoffV1;
  const evidence=root.TakyCrewEvidenceRuntime;
  if(!handoff||!evidence)return;
  root.TakyCrewEvidenceHandoffInstall=handoff.install({
    appId:'READY_SET',
    evidenceRuntime:evidence,
    storage:root.localStorage,
    root
  });
})(typeof globalThis!=='undefined'?globalThis:this);
