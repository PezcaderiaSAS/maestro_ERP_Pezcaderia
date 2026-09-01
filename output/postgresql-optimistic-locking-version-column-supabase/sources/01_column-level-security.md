---
title: "Column Level Security"
source_url: "https://supabase.com/docs/guides/database/postgres/column-level-security"
extracted_at: "2026-09-01T15:11:34.909940+00:00"
domain: "supabase.com"
tech_stack: "PostgreSQL"
tags: ["postgresql-optimistic-locking-version-column-supabase", "postgresql", "official-docs"]
word_count: 594
---

# Column Level Security

Postgres'sRow Level Security (RLS)gives you granular control over who can access rows of data. However, it doesn't give you control over which columns they can access within rows. Sometimes you want to restrict access to specific columns in your database. Column Level Privileges allows you to do that.


This is an advanced feature. We do not recommend using column-level privileges for most users. Instead, we recommend using RLS policies in combination with a dedicated table for handling user roles.


Restricted roles cannot use the wildcard operator (*) on the affected table. Instead of usingSELECT * FROM <restricted_table>;or its API equivalent, you must specify the column names explicitly.


## Policies at the row level#


Policies in Row Level Security (RLS) are used to restrict access to rows in a table. Think of them like adding aWHEREclause to every query.


For example, assume you have apoststable with the following columns:

- id
- user_id
- title
- content
- created_at
- updated_at


You can restrict updates to the user who created it usingRLS, with the following policy:


```
1create policy "Allow update for owners" on posts for2update3  using ((select auth.uid()) = user_id);
```


However, this gives the post owner full access to update the row, including all of the columns.


## Privileges at the column level#


To restrict access to columns, you can usePrivileges.


There are two types of privileges in Postgres:

- table-level: Grants the privilege on all columns in the table.
- column-levelGrants the privilege on a specific column in the table.


You can have both types of privileges on the same table. If you have both, and you revoke the column-level privilege, the table-level privilege will still be in effect.


By default, our table will have a table-levelUPDATEprivilege, which means that theauthenticatedrole can update all the columns in the table.


```
1revoke2update3  on table public.posts4from5  authenticated;67grant8update9  (title, content) on table public.posts to authenticated;
```


In the above example, we are revoking the table-levelUPDATEprivilege from theauthenticatedrole and granting a column-levelUPDATEprivilege on thetitleandcontentcolumns.


If we want to restrict access to updating thetitlecolumn:


```
1revoke2update3  (title) on table public.posts4from5  authenticated;
```


This time, we are revoking the column-levelUPDATEprivilege of thetitlecolumn from theauthenticatedrole. We didn't need to revoke the table-levelUPDATEprivilege because it's already revoked.


## Manage column privileges in the Dashboard#


Column-level privileges are a powerful tool, but they're also quite advanced and in many cases, not the best fit for common access control needs. For that reason, we've intentionally moved the UI for this feature under the Feature Preview section in the dashboard.


You can view and edit the privileges in theSupabase Studio.


## Manage column privileges in migrations#


While you can manage privileges directly from the Dashboard, as your project grows you may want to manage them in your migrations. Read about database migrations in theLocal Developmentguide.


To get started, generate anew migrationto store the SQL needed to create your table along with row and column-level privileges.


```
1supabase migration new create_posts_table
```


This creates a new migration: supabase/migrations/<timestamp>
_create_posts_table.sql.


To that file, add the SQL to create thispoststable with row and column-level privileges.


```
1create table2posts (3id bigint primary key generated always as identity,4user_id text,5title text,6content text,7created_at timestamptz default now(),8updated_at timestamptz default now()9);1011-- Add row-level security12create policy "Allow update for owners" on posts for13update14using ((select auth.uid()) = user_id);1516-- Add column-level security17revoke18update19(title) on table public.posts20from21authenticated;
```


## Considerations when using column-level privileges#

- If you turn off a column privilege you won't be able to use that column at all.
- All operations (insert, update, delete) as well as usingselect *will fail.


### AI Tools