# Migrate `@vercel/postgres` to `@neondatabase/serverless`

This repo demonstrates migrating from Vercel Postgres (now deprecated) to [Neon's serverless driver](https://www.npmjs.com/package/@neondatabase/serverless).

Note that, for new projects, we strongly recommend using `@neondatabase/serverless` driver API directly.

There are two main strategies:


(1) If you use only `import { sql } from '@vercel/postgres'`, do this:

```bash
npm remove @vercel/postgres
npm install @neondatabase/serverless
```

Then replace all instances of

```typescript
import { sql } from '@vercel/postgres'`
```

with

```typescript
import { neon } from '@neondatabase/serverless'
const sql = neon(process.env.POSTGRES_URL!, { fullResults: true });  // remove the `!` if using plain JS, not TypeScript
```


(2) If you import and use any other features of `@vercel/postgres` -- such as `db`, `createClient` or `createPool` -- do this:

```bash
npm remove @vercel/postgres
npm install @neondatabase/serverless
```

Then, if you're using Vercel's Edge runtime (not Node.js):

* Copy `vercel-postgres-compat.ts` to your project (it's in the `api` folder here).

* Replace all instances of:

```typescript
import { ... } from '@vercel/postgres';
```

with 

```typescript
import { ... } from './vercel-postgres-compat';  // add `.js` to filename if using plain JS, not TypeScript
```

Otherwise, if you're using Vercel's Node.js runtime:

```bash
npm install ws @types/ws  # remove @types/ws if using plain JS, not TypeScript
```

* Copy `vercel-postgres-compat.ts` **and** `vercel-postgres-compat-node.ts` to your project (they're in the `api` folder here).

* Replace all instances of:

```typescript
import { ... } from '@vercel/postgres';
```

with 

```typescript
import { ... } from './vercel-postgres-compat-node';  // add `.js` to filename if using plain JS, not TypeScript
```


## Deploy this repo

* Ensure the `psql` client is installed

* Create a Neon database and make a note of the connection string

* Clone this repo, then:

```bash
# get dependencies
npm install

# set up Vercel
npx vercel login
npx vercel link

# create POSTGRES_URL environment variable, remote and local
npx vercel env add POSTGRES_URL  # paste in the connection string: postgres://...
npx vercel env pull .env.local  # now bring it down into ./.env.local for local use

# create the schema and copy data to DB
(source .env.local \
  && echo "CREATE TABLE posts (id serial primary key, body text not null); INSERT INTO posts (body) VALUES ('Post 1'), ('Post 2');" \
  | psql $DATABASE_URL)

# ... and deploy
npx vercel deploy
```

* Now visit the deployed app
