# Wiki Submission Checklist - Logging Page

## Before Submitting

Use this checklist to ensure your wiki page is complete and ready for submission.

### ✅ Wiki Page Content (All Required Elements)

- [ ] **Project Logging Strategy** - Description included in wiki
- [ ] **Logging Framework Description** - Winston v3.18.3 documented
- [ ] **Logging Console Description** - Sumo Logic documented
- [ ] **CI Run Permalink** - Link to GitHub Actions run with debug logs
- [ ] **4 Code Permalinks** - Links to different granularity levels
  - [ ] ERROR level permalink
  - [ ] WARN level permalink  
  - [ ] INFO level permalink
  - [ ] DEBUG level permalink
- [ ] **Logging Console URL** - Sumo Logic URL included
- [ ] **Access Note** - Mention credentials in Brightspace

### 📝 Content to Update in Wiki Page

Before copying to GitHub Wiki, update these items in `WIKI_LOGGING_PAGE.md`:

#### 1. CI Run Permalink
**Current**: `[RUN_ID]` placeholder
**Action**: Replace with actual GitHub Actions run ID

**How to get**:
1. Go to: https://github.com/CSCI-40500-Fall-2025/ForgeArena/actions
2. Click on a recent "Continuous Deployment" run
3. Copy the URL (looks like: `https://github.com/.../actions/runs/123456789`)
4. Replace `[RUN_ID]` in the wiki with the actual number

**Line to update**:
```markdown
https://github.com/CSCI-40500-Fall-2025/ForgeArena/actions/runs/[RUN_ID]
```

#### 2. Code Permalinks
**Current**: Generic links to main branch
**Action**: Update with your actual repository permalinks

**Permalinks needed**:
1. ERROR: `server/index.js` line 107
2. WARN: `server/index.js` line 148
3. INFO: `server/index.js` line 171
4. DEBUG: `server/index.js` line 86
5. HTTP: `server/index.js` line 27

**Format**:
```
https://github.com/CSCI-40500-Fall-2025/ForgeArena/blob/main/server/index.js#L107
```

### 🔐 Brightspace Submission

Create a Brightspace submission with:

#### File to Submit
- [ ] **URL of wiki page** (after creating it on GitHub Wiki)

#### Credentials Document
Create a text file with:

```
ForgeArena Logging Console Access

Service: Sumo Logic
URL: https://service.sumologic.com/

Username: [Your Sumo Logic Email]
Password: [Your Unique Sumo Logic Password]

Note: This password is unique and not used elsewhere.

Quick Access:
1. Login to Sumo Logic
2. Go to "Log Search"
3. Query: _sourceCategory=forgearena/production
4. Time Range: Last 1 Hour
5. Click "Start"
```

- [ ] Upload credentials file to Brightspace

### 🌐 Creating the GitHub Wiki Page

#### Steps:

1. **Go to your repository Wiki**:
   ```
   https://github.com/CSCI-40500-Fall-2025/ForgeArena/wiki
   ```

2. **Create new page**:
   - Click "New Page" button
   - Title: `Logging`

3. **Copy content**:
   - Open `WIKI_LOGGING_PAGE.md`
   - Update the placeholders (CI run, permalinks)
   - Copy all content
   - Paste into wiki editor

4. **Format check**:
   - Preview the page
   - Verify all links work
   - Check code blocks render correctly
   - Ensure tables display properly

5. **Save the page**:
   - Click "Save Page"

6. **Get wiki URL**:
   - Copy the URL (e.g., `https://github.com/.../wiki/Logging`)
   - This is what you submit to Brightspace

### 📋 Verification Before Submission

#### Test All Links
- [ ] CI run link opens and shows debug logs
- [ ] All 4 code permalinks go to correct lines
- [ ] Sumo Logic URL is accessible
- [ ] Repository links work

#### Test Sumo Logic Access
- [ ] Can login with provided credentials
- [ ] Can see logs when searching for `_sourceCategory=forgearena/production`
- [ ] Logs are recent (within last hour/day)
- [ ] Can run sample queries

#### Content Completeness
- [ ] All sections filled out
- [ ] No placeholder text remaining
- [ ] Code examples are accurate
- [ ] Statistics are current
- [ ] Links point to correct repository

### 📊 Required Evidence

Make sure you can demonstrate:

1. **CI Logs at Debug Level**:
   - Show GitHub Actions run
   - Point to console output with debug logs
   - Highlight where `CI=true` enables debug level

2. **Different Granularities in Code**:
   - ERROR: Critical failures with stack traces
   - WARN: Validation issues, already-completed actions
   - INFO: Business events (level ups, completions)
   - DEBUG: Detailed diagnostics

3. **Real-Time Monitoring**:
   - Logs in Sumo Logic
   - Recent timestamps
   - Searchable/filterable

4. **CI Exclusion**:
   - CI logs visible in GitHub Actions
   - Same logs NOT in Sumo Logic (production only)

### 🎯 Submission Template

Copy this for your Brightspace submission:

```
Assignment: Logging Wiki Page
Project: ForgeArena

Wiki URL: https://github.com/CSCI-40500-Fall-2025/ForgeArena/wiki/Logging

Credentials: See attached file "sumo-logic-credentials.txt"

Summary:
- Logging Framework: Winston v3.18.3
- Monitoring Console: Sumo Logic (Free Tier)
- Log Levels: 5 (error, warn, info, http, debug)
- Total Log Statements: 35+
- CI Configuration: Debug level (most verbose)
- Production: Warn level console, Debug level to Sumo Logic
- Real-time ingestion with 1-second intervals
- CI logs excluded from monitoring console

All required elements included:
✅ Logging strategy description
✅ Framework description (Winston)
✅ Console description (Sumo Logic)
✅ CI run permalink (debug level logs)
✅ 4 code permalinks (different granularities)
✅ Console URL and access information
```

### 🔧 Common Issues to Check

- [ ] **Permalinks not working**: Use commit SHA instead of `main` branch
- [ ] **CI logs not visible**: Check GitHub Actions permissions
- [ ] **Sumo Logic empty**: Generate logs by using the app
- [ ] **Credentials don't work**: Reset Sumo Logic password
- [ ] **Wiki not enabled**: Enable wiki in repository settings

### 📞 Quick Reference

**GitHub Actions**: https://github.com/CSCI-40500-Fall-2025/ForgeArena/actions
**Repository**: https://github.com/CSCI-40500-Fall-2025/ForgeArena
**Wiki**: https://github.com/CSCI-40500-Fall-2025/ForgeArena/wiki
**Sumo Logic**: https://service.sumologic.com/

### ✨ Final Check

Before submitting:
1. [ ] Wiki page created and saved
2. [ ] All placeholders updated
3. [ ] All links tested
4. [ ] Credentials file prepared
5. [ ] Can access Sumo Logic with credentials
6. [ ] Logs are visible in Sumo Logic
7. [ ] CI run shows debug logs
8. [ ] Code permalinks go to correct lines

---

## Ready to Submit! 🚀

Once all checkboxes are complete:
1. Submit wiki URL to Brightspace
2. Upload credentials file to Brightspace
3. Done! ✅

---

**Last Updated**: November 20, 2025

