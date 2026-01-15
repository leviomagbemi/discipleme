const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'discipleme',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUser', inputVars);
}
createUserRef.operationName = 'CreateUser';
exports.createUserRef = createUserRef;

exports.createUser = function createUser(dcOrVars, vars) {
  return executeMutation(createUserRef(dcOrVars, vars));
};

const getScripturesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetScriptures');
}
getScripturesRef.operationName = 'GetScriptures';
exports.getScripturesRef = getScripturesRef;

exports.getScriptures = function getScriptures(dc) {
  return executeQuery(getScripturesRef(dc));
};

const createChallengeAttemptRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateChallengeAttempt', inputVars);
}
createChallengeAttemptRef.operationName = 'CreateChallengeAttempt';
exports.createChallengeAttemptRef = createChallengeAttemptRef;

exports.createChallengeAttempt = function createChallengeAttempt(dcOrVars, vars) {
  return executeMutation(createChallengeAttemptRef(dcOrVars, vars));
};

const getMyMemorizationPlansRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyMemorizationPlans');
}
getMyMemorizationPlansRef.operationName = 'GetMyMemorizationPlans';
exports.getMyMemorizationPlansRef = getMyMemorizationPlansRef;

exports.getMyMemorizationPlans = function getMyMemorizationPlans(dc) {
  return executeQuery(getMyMemorizationPlansRef(dc));
};
