<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
| Define scheduled commands here.
*/

// Sync pending deposits with provider (every 5 minutes)
Schedule::command('flyerx:sync-deposits')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Sync pending withdrawals with provider (every 5 minutes)
Schedule::command('flyerx:sync-withdrawals')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Expire stale balance reservations (every minute)
Schedule::command('flyerx:expire-reservations')
    ->everyMinute()
    ->withoutOverlapping();

// Daily reconciliation (at 3 AM)
Schedule::command('flyerx:reconcile')
    ->dailyAt('03:00')
    ->runInBackground();

// Cleanup expired sessions (daily at 4 AM)
Schedule::command('sanctum:prune-expired --hours=24')
    ->dailyAt('04:00');

// Cleanup old audit logs (weekly)
Schedule::command('flyerx:cleanup-audit-logs --days=365')
    ->weekly()
    ->runInBackground();
