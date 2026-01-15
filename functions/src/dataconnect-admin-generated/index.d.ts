import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface ChallengeAttempt_Key {
  id: UUIDString;
  __typename?: 'ChallengeAttempt_Key';
}

export interface CreateChallengeAttemptData {
  challengeAttempt_insert: ChallengeAttempt_Key;
}

export interface CreateChallengeAttemptVariables {
  scriptureId: UUIDString;
  challengeType: string;
  durationSeconds?: number | null;
  hintsUsed?: number | null;
  score: number;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  username: string;
  email: string;
}

export interface GetMyMemorizationPlansData {
  memorizationPlans: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    startDate?: DateString | null;
    endDate?: DateString | null;
  } & MemorizationPlan_Key)[];
}

export interface GetScripturesData {
  scriptures: ({
    id: UUIDString;
    reference: string;
    text: string;
  } & Scripture_Key)[];
}

export interface MemorizationPlan_Key {
  id: UUIDString;
  __typename?: 'MemorizationPlan_Key';
}

export interface PlanScripture_Key {
  memorizationPlanId: UUIDString;
  scriptureId: UUIDString;
  __typename?: 'PlanScripture_Key';
}

export interface Scripture_Key {
  id: UUIDString;
  __typename?: 'Scripture_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createUser(dc: DataConnect, vars: CreateUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createUser(vars: CreateUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetScriptures' Query. Allow users to execute without passing in DataConnect. */
export function getScriptures(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetScripturesData>>;
/** Generated Node Admin SDK operation action function for the 'GetScriptures' Query. Allow users to pass in custom DataConnect instances. */
export function getScriptures(options?: OperationOptions): Promise<ExecuteOperationResponse<GetScripturesData>>;

/** Generated Node Admin SDK operation action function for the 'CreateChallengeAttempt' Mutation. Allow users to execute without passing in DataConnect. */
export function createChallengeAttempt(dc: DataConnect, vars: CreateChallengeAttemptVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateChallengeAttemptData>>;
/** Generated Node Admin SDK operation action function for the 'CreateChallengeAttempt' Mutation. Allow users to pass in custom DataConnect instances. */
export function createChallengeAttempt(vars: CreateChallengeAttemptVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateChallengeAttemptData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyMemorizationPlans' Query. Allow users to execute without passing in DataConnect. */
export function getMyMemorizationPlans(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyMemorizationPlansData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyMemorizationPlans' Query. Allow users to pass in custom DataConnect instances. */
export function getMyMemorizationPlans(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyMemorizationPlansData>>;

