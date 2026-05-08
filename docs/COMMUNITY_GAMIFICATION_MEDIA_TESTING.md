# Community Media + Gamification Test & Migration Notes

## Scope
This note covers the latest updates for:
- Community icon/cover upload and serving from DB media table
- SEO slug URL behavior for community and thread pages
- XP/Level progress and leaderboard
- Badge awarding and status badge display in thread/comments

## Backend Endpoints
### Media
- `GET /api/community/communities/{community_id}/media/icon`
- `GET /api/community/communities/{community_id}/media/banner`

### Gamification
- `GET /api/community/gamification/progress` (auth required)
- `GET /api/community/gamification/leaderboard?limit=20`
- `GET /api/community/gamification/badges` (auth required)

## Migration Order
1. `backend/community/01_database_schema.sql`
2. `backend/community/02_community_media_schema.sql`
3. `backend/community/03_gamification_indexes.sql`

## Backend Test Command
Run focused tests:

```powershell
c:/Users/abdullah.altunkaynak/Desktop/Agent-Arena/.venv/Scripts/python.exe -m pytest backend/tests/test_gamification_media.py -q
```

## Manual Smoke Checklist
1. Create/update a community with uploaded icon and cover.
2. Verify images render in community list and detail pages.
3. Create thread/comment and like content with an authenticated user.
4. Confirm progress endpoint returns updated points/level.
5. Confirm leaderboard endpoint returns ranked users.
6. Open thread detail page and verify level + status badges appear for author and comments.

## Known Operational Note
If local backend startup fails with a port/process conflict on `10000`, clear the listener process first, then start backend again.
