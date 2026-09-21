export function createIntegrationGate(config = {}) {
  const app = config.app || 'ready-set';
  const allowed = new Set(config.allowedContractVersions || []);

  function validateContract(value) {
    if (!value || typeof value !== 'object') return { ok:false, reason:'CONTRACT_NOT_OBJECT' };
    if (!value.contract_version || !allowed.has(value.contract_version)) {
      return { ok:false, reason:'CONTRACT_VERSION_NOT_ALLOWED' };
    }
    return { ok:true, app, contract_version:value.contract_version };
  }

  return Object.freeze({ app, validateContract });
}
