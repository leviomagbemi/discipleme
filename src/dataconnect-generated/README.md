# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetScriptures*](#getscriptures)
  - [*GetMyMemorizationPlans*](#getmymemorizationplans)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*CreateChallengeAttempt*](#createchallengeattempt)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetScriptures
You can execute the `GetScriptures` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getScriptures(): QueryPromise<GetScripturesData, undefined>;

interface GetScripturesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetScripturesData, undefined>;
}
export const getScripturesRef: GetScripturesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getScriptures(dc: DataConnect): QueryPromise<GetScripturesData, undefined>;

interface GetScripturesRef {
  ...
  (dc: DataConnect): QueryRef<GetScripturesData, undefined>;
}
export const getScripturesRef: GetScripturesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getScripturesRef:
```typescript
const name = getScripturesRef.operationName;
console.log(name);
```

### Variables
The `GetScriptures` query has no variables.
### Return Type
Recall that executing the `GetScriptures` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetScripturesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetScripturesData {
  scriptures: ({
    id: UUIDString;
    reference: string;
    text: string;
  } & Scripture_Key)[];
}
```
### Using `GetScriptures`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getScriptures } from '@dataconnect/generated';


// Call the `getScriptures()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getScriptures();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getScriptures(dataConnect);

console.log(data.scriptures);

// Or, you can use the `Promise` API.
getScriptures().then((response) => {
  const data = response.data;
  console.log(data.scriptures);
});
```

### Using `GetScriptures`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getScripturesRef } from '@dataconnect/generated';


// Call the `getScripturesRef()` function to get a reference to the query.
const ref = getScripturesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getScripturesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.scriptures);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.scriptures);
});
```

## GetMyMemorizationPlans
You can execute the `GetMyMemorizationPlans` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyMemorizationPlans(): QueryPromise<GetMyMemorizationPlansData, undefined>;

interface GetMyMemorizationPlansRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyMemorizationPlansData, undefined>;
}
export const getMyMemorizationPlansRef: GetMyMemorizationPlansRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyMemorizationPlans(dc: DataConnect): QueryPromise<GetMyMemorizationPlansData, undefined>;

interface GetMyMemorizationPlansRef {
  ...
  (dc: DataConnect): QueryRef<GetMyMemorizationPlansData, undefined>;
}
export const getMyMemorizationPlansRef: GetMyMemorizationPlansRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyMemorizationPlansRef:
```typescript
const name = getMyMemorizationPlansRef.operationName;
console.log(name);
```

### Variables
The `GetMyMemorizationPlans` query has no variables.
### Return Type
Recall that executing the `GetMyMemorizationPlans` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyMemorizationPlansData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyMemorizationPlansData {
  memorizationPlans: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    startDate?: DateString | null;
    endDate?: DateString | null;
  } & MemorizationPlan_Key)[];
}
```
### Using `GetMyMemorizationPlans`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyMemorizationPlans } from '@dataconnect/generated';


// Call the `getMyMemorizationPlans()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyMemorizationPlans();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyMemorizationPlans(dataConnect);

console.log(data.memorizationPlans);

// Or, you can use the `Promise` API.
getMyMemorizationPlans().then((response) => {
  const data = response.data;
  console.log(data.memorizationPlans);
});
```

### Using `GetMyMemorizationPlans`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyMemorizationPlansRef } from '@dataconnect/generated';


// Call the `getMyMemorizationPlansRef()` function to get a reference to the query.
const ref = getMyMemorizationPlansRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyMemorizationPlansRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.memorizationPlans);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.memorizationPlans);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface CreateUserRef {
  ...
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation requires an argument of type `CreateUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserVariables {
  username: string;
  email: string;
}
```
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser, CreateUserVariables } from '@dataconnect/generated';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  username: ..., 
  email: ..., 
};

// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser(createUserVars);
// Variables can be defined inline as well.
const { data } = await createUser({ username: ..., email: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect, createUserVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser(createUserVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef, CreateUserVariables } from '@dataconnect/generated';

// The `CreateUser` mutation requires an argument of type `CreateUserVariables`:
const createUserVars: CreateUserVariables = {
  username: ..., 
  email: ..., 
};

// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef(createUserVars);
// Variables can be defined inline as well.
const ref = createUserRef({ username: ..., email: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect, createUserVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## CreateChallengeAttempt
You can execute the `CreateChallengeAttempt` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createChallengeAttempt(vars: CreateChallengeAttemptVariables): MutationPromise<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;

interface CreateChallengeAttemptRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateChallengeAttemptVariables): MutationRef<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;
}
export const createChallengeAttemptRef: CreateChallengeAttemptRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createChallengeAttempt(dc: DataConnect, vars: CreateChallengeAttemptVariables): MutationPromise<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;

interface CreateChallengeAttemptRef {
  ...
  (dc: DataConnect, vars: CreateChallengeAttemptVariables): MutationRef<CreateChallengeAttemptData, CreateChallengeAttemptVariables>;
}
export const createChallengeAttemptRef: CreateChallengeAttemptRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createChallengeAttemptRef:
```typescript
const name = createChallengeAttemptRef.operationName;
console.log(name);
```

### Variables
The `CreateChallengeAttempt` mutation requires an argument of type `CreateChallengeAttemptVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateChallengeAttemptVariables {
  scriptureId: UUIDString;
  challengeType: string;
  durationSeconds?: number | null;
  hintsUsed?: number | null;
  score: number;
}
```
### Return Type
Recall that executing the `CreateChallengeAttempt` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateChallengeAttemptData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateChallengeAttemptData {
  challengeAttempt_insert: ChallengeAttempt_Key;
}
```
### Using `CreateChallengeAttempt`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createChallengeAttempt, CreateChallengeAttemptVariables } from '@dataconnect/generated';

// The `CreateChallengeAttempt` mutation requires an argument of type `CreateChallengeAttemptVariables`:
const createChallengeAttemptVars: CreateChallengeAttemptVariables = {
  scriptureId: ..., 
  challengeType: ..., 
  durationSeconds: ..., // optional
  hintsUsed: ..., // optional
  score: ..., 
};

// Call the `createChallengeAttempt()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createChallengeAttempt(createChallengeAttemptVars);
// Variables can be defined inline as well.
const { data } = await createChallengeAttempt({ scriptureId: ..., challengeType: ..., durationSeconds: ..., hintsUsed: ..., score: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createChallengeAttempt(dataConnect, createChallengeAttemptVars);

console.log(data.challengeAttempt_insert);

// Or, you can use the `Promise` API.
createChallengeAttempt(createChallengeAttemptVars).then((response) => {
  const data = response.data;
  console.log(data.challengeAttempt_insert);
});
```

### Using `CreateChallengeAttempt`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createChallengeAttemptRef, CreateChallengeAttemptVariables } from '@dataconnect/generated';

// The `CreateChallengeAttempt` mutation requires an argument of type `CreateChallengeAttemptVariables`:
const createChallengeAttemptVars: CreateChallengeAttemptVariables = {
  scriptureId: ..., 
  challengeType: ..., 
  durationSeconds: ..., // optional
  hintsUsed: ..., // optional
  score: ..., 
};

// Call the `createChallengeAttemptRef()` function to get a reference to the mutation.
const ref = createChallengeAttemptRef(createChallengeAttemptVars);
// Variables can be defined inline as well.
const ref = createChallengeAttemptRef({ scriptureId: ..., challengeType: ..., durationSeconds: ..., hintsUsed: ..., score: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createChallengeAttemptRef(dataConnect, createChallengeAttemptVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.challengeAttempt_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.challengeAttempt_insert);
});
```

