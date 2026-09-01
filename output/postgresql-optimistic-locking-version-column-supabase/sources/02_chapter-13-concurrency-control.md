---
title: "Chapter 13. Concurrency Control"
source_url: "https://www.postgresql.org/docs/current/mvcc.html"
extracted_at: "2026-09-01T15:11:36.102267+00:00"
domain: "www.postgresql.org"
tech_stack: "PostgreSQL"
tags: ["postgresql-optimistic-locking-version-column-supabase", "postgresql", "official-docs"]
word_count: 91
---

# Chapter 13. Concurrency Control

This chapter describes the behavior of the PostgreSQL database system when two or more sessions try to access the same data at the same time. The goals in that situation are to allow efficient access for all sessions while maintaining strict data integrity. Every developer of database applications should be familiar with the topics covered in this chapter.

              If you see anything in the documentation that is not correct, does not match
              your experience with the particular feature or requires further clarification,
              please use
              [this form](/account/comments/new/18/mvcc.html/)
              to report a documentation issue.