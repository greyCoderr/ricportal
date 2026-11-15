export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
// Milliseconds. A hanging database must not hang the health check.
export const HEALTH_TIMEOUT_MS = 2000;
// BR-19: 5 failures lock the account for 15 minutes.
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;
// The DSWD file is small; 5 MB is the limit for the menu import (sprint plan).
export const MENU_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
// BR-19, P1-T07 (AUD-010): failed logins allowed from one client address in
// 15 minutes, whatever the usernames. Successful logins do not count.
export const LOGIN_IP_MAX_FAILURES = 30;
