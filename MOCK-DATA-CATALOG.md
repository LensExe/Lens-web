# Lens mock data catalog

This file is the inventory for the UI-phase mock backend. Each app keeps its own
`src/mock/` seed by design; the records are synchronized by identifiers, names,
styles and lifecycle states without importing data across app boundaries.

## Seed size snapshot

- Portal: 17 photographers, 17 bookings, 67 reviews, 5 galleries, 6 wallet transactions and 5 Lens Xu transactions.
- Admin: 15 users, 6 photographer applications, 8 monitored bookings, 14 withdrawal requests, 6 storage rows and 7 quality rows.
- Landing: 16 photographers, 10 styles, 7 booking examples and 16 reviews.

## Portal

| Domain | Seed | Coverage |
| --- | --- | --- |
| Photographer directory | `apps/portal/src/mock/photographers.ts` | `me` + `p1`–`p16`, all 10 photo styles, featured/non-featured, zero-to-senior experience |
| Reviews | `apps/portal/src/mock/reviews.ts` | Every photographer has 3–5 reviews; 4★ and 5★ ratings are present |
| Achievements | `apps/portal/src/mock/achievements.ts` | Newbie, bronze, silver, gold and diamond ranks; all supported badge ids |
| Bookings | `apps/portal/src/mock/bookings.ts` | Awaiting deposit, pending, confirmed, held, released and cancelled |
| Collaborators | `apps/portal/src/mock/bookings.ts` | Invited, accepted and declined |
| Availability | `apps/portal/src/mock/schedules.ts` | Free, busy and booked slots; working days, days off, all-day and range blocks |
| Galleries | `apps/portal/src/mock/storage.ts` | Normal, expiring soon, locked, Free, Pro and Studio retention states |
| Wallet ledger | `apps/portal/src/mock/wallet.ts` | Payout, refund, withdraw and topup; completed and pending transactions |
| Lens Xu ledger | `apps/portal/src/mock/wallet.ts` | Earn, redeem, expire and adjust movements |
| Profiles | `apps/portal/src/mock/profiles.ts` | Female, male, other and unset gender; varied notification preferences |
| Assistant | `apps/portal/src/mock/assistant.ts` | Enabled and disabled photographer assistants |
| Messages | `apps/portal/src/mock/messages.ts` | Client↔photographer, photographer↔photographer, unread/read and AI on/off threads |

## Admin

| Domain | Seed | Coverage |
| --- | --- | --- |
| Users | `apps/admin/src/mock/users.ts` | Client/photographer roles; active/suspended accounts |
| Photographer applications | `apps/admin/src/mock/applications.ts` | Pending, approved and rejected applications, including review notes |
| Bookings | `apps/admin/src/mock/bookings.ts` | All six escrow states plus invited/accepted/declined collaborators |
| Withdrawals | `apps/admin/src/mock/finance.ts` | Pending, approved and rejected withdrawals |
| Storage | `apps/admin/src/mock/storage.ts` | Free, Pro and Studio plans; over-quota and within-quota rows |
| Quality | `apps/admin/src/mock/quality.ts` | All five ranks; assistant enabled and disabled |
| Reports | `apps/admin/src/mock/reports.ts` | All 10 photo styles and all supported cities |
| Activity | `apps/admin/src/mock/stats.ts` | Signup, booking, application, report and withdrawal events |

## Landing

| Domain | Seed | Coverage |
| --- | --- | --- |
| Photographer showcase | `apps/landing/src/mock/photographers.ts` | Same `p1`–`p16` directory identities and normalized experience values as portal |
| Styles | `apps/landing/src/mock/styles.ts` | All 10 photo styles |
| Bookings | `apps/landing/src/mock/bookings.ts` | Same six booking lifecycle states as portal |
| Reviews | `apps/landing/src/mock/reviews.ts` | Every showcased photographer has at least one review |

## Seed synchronization behavior

Persisted browser mock state is additive: when a new seed row is introduced,
MSW merges the missing row into the existing localStorage store by id (or
booking id for galleries). Existing demo mutations are preserved. This keeps
new fixtures visible without requiring a manual localStorage reset.
