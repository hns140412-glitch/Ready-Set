export default {
  userSignup(event){
    const current=Array.isArray(event.user?.appMetadata?.roles)?event.user.appMetadata.roles:[];
    const normalized=current.map(x=>String(x||'').toUpperCase());
    const roles=normalized.includes('PARENT')?['PARENT']:['CHILD'];
    return {
      user:{
        ...event.user,
        appMetadata:{
          ...event.user.appMetadata,
          roles
        }
      }
    };
  }
};
