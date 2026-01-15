# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createUser, getScriptures, createChallengeAttempt, getMyMemorizationPlans } from '@dataconnect/generated';


// Operation CreateUser:  For variables, look at type CreateUserVars in ../index.d.ts
const { data } = await CreateUser(dataConnect, createUserVars);

// Operation GetScriptures: 
const { data } = await GetScriptures(dataConnect);

// Operation CreateChallengeAttempt:  For variables, look at type CreateChallengeAttemptVars in ../index.d.ts
const { data } = await CreateChallengeAttempt(dataConnect, createChallengeAttemptVars);

// Operation GetMyMemorizationPlans: 
const { data } = await GetMyMemorizationPlans(dataConnect);


```