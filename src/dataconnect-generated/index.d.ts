import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetScripturesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetScripturesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetScripturesData, undefined>;
  operationName: string;
}
export const getScripturesRef: GetScripturesRef;

export function getScriptures(): QueryPromise<GetScripturesData, undefined>;
export function getScriptures(dc: DataConnect): QueryPromise<GetScripturesData, undefined>;

interface CreateChallengeAttemptRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateChallengeAttemptVariables): MutationRef<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateChallengeAttemptVariables): MutationRef<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;
  operationName: string;
}
export const createChallengeAttemptRef: CreateChallengeAttemptRef;

export function createChallengeAttempt(vars: CreateChallengeAttemptVariables): MutationPromise<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;
export function createChallengeAttempt(dc: DataConnect, vars: CreateChallengeAttemptVariables): MutationPromise<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;

interface GetMyMemorizationPlansRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyMemorizationPlansData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyMemorizationPlansData, undefined>;
  operationName: string;
}
export const getMyMemorizationPlansRef: GetMyMemorizationPlansRef;

export function getMyMemorizationPlans(): QueryPromise<GetMyMemorizationPlansData, undefined>;
export function getMyMemorizationPlans(dc: DataConnect): QueryPromise<GetMyMemorizationPlansData, undefined>;

