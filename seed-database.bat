@echo off
title CampusConnect Database Seed
echo ====================================================
echo Seeding CampusConnect Database...
echo ====================================================
echo.
npx prisma db push --force-reset
npx prisma db execute --file prisma/sql/advanced.sqlite.sql
npx tsx prisma/seed.ts
echo.
echo Database seeded successfully!
pause

