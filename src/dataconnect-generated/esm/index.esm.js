import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'discipleme',
  location: 'us-central1'
};

export const createUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser', inputVars);
}
createUserRef.operationName = 'CreateUser';

export function createUser(dcOrVars, vars) {
  return executeMutation(createUserRef(dcOrVars, vars));
}

export const getScripturesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetScriptures');
}
getScripturesRef.operationName = 'GetScriptures';

export function getScriptures(dc) {
  return executeQuery(getScripturesRef(dc));
}

export const createChallengeAttemptRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateChallengeAttempt', inputVars);
}
createChallengeAttemptRef.operationName = 'CreateChallengeAttempt';

export function createChallengeAttempt(dcOrVars, vars) {
  return executeMutation(createChallengeAttemptRef(dcOrVars, vars));
}

export const getMyMemorizationPlansRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyMemorizationPlans');
}
getMyMemorizationPlansRef.operationName = 'GetMyMemorizationPlans';

export function getMyMemorizationPlans(dc) {
  return executeQuery(getMyMemorizationPlansRef(dc));
}

