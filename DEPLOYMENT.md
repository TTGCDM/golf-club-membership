# Production Deployment Guide

This guide covers deploying the Tea Tree Golf Club Membership Management System to production with proper security and backup configurations.

---

## Prerequisites

1. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project** created (you should already have this from development)

3. **Environment variables** configured in `.env`

---

## Step 1: Configure Firebase Project

### 1.1 Update .firebaserc

Edit `.firebaserc` and replace `your-project-id-here` with your actual Firebase project ID:

```json
{
  "projects": {
    "default": "tea-tree-golf-club"
  }
}
```

To find your project ID:
- Go to [Firebase Console](https://console.firebase.google.com/)
- Open your project
- Click the gear icon > Project settings
- Copy the "Project ID"

### 1.2 Login to Firebase CLI

```bash
firebase login
```

This will open a browser window for authentication.

---

## Step 2: Deploy Firestore Security Rules

### 2.1 Review Security Rules

The `firestore.rules` file contains comprehensive security rules that:
- Require authentication for all operations
- Enforce role-based access control (VIEW, EDIT, ADMIN, SUPER_ADMIN)
- Validate data structure and field types
- Check user status is ACTIVE before allowing access
- Restrict payment edits/deletes to the user who recorded them (or ADMIN+)
- Prevent admins from modifying super admin accounts

### 2.2 Test Rules Locally (Optional but Recommended)

```bash
firebase emulators:start --only firestore
```

This starts a local Firestore emulator on http://localhost:8080 where you can test rules without affecting production.

### 2.3 Deploy Security Rules

**IMPORTANT**: This will replace test mode rules. Once deployed, only authenticated users with proper roles can access data.

```bash
firebase deploy --only firestore:rules
```

### 2.4 Verify Deployment

1. Go to Firebase Console > Firestore Database > Rules
2. Verify the rules were updated (check the timestamp)
3. Review the rules in the console to ensure they match your local file

---

## Step 3: Deploy Firestore Indexes

Indexes improve query performance for compound queries (e.g., filter by status AND sort by name).

```bash
firebase deploy --only firestore:indexes
```

The `firestore.indexes.json` file includes indexes for:
- Payments by member + payment date
- Payments by date + created timestamp
- Members by status + name
- Members by category + name
- Users by status + created date

---

## Step 4: Build and Deploy to Firebase Hosting

### 4.1 Build Production Bundle

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory using Vite.

### 4.2 Test Production Build Locally (Optional)

```bash
npm run preview
```

Opens the production build at http://localhost:4173 for testing before deployment.

### 4.3 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

After deployment, Firebase CLI will display your hosting URL:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/tea-tree-golf-club/overview
Hosting URL: https://tea-tree-golf-club.web.app
```

### 4.4 Verify Deployment

1. Visit your hosting URL
2. Test login with a known user
3. Verify all features work correctly
4. Check browser console for any errors

---

## Step 5: Configure Automated Backups

### 5.1 Enable Daily Backups in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Click on the **Usage** tab
5. Scroll to "Daily backups" section
6. Click **"Get started"** or **"Enable"**

### 5.2 Configure Backup Settings

1. **Backup frequency**: Daily (automatically at a random time each day)
2. **Backup retention**: Choose retention period:
   - 7 days (minimum, free tier)
   - 14 days (recommended for production)
   - 30 days (for compliance requirements)
3. **Backup location**: Choose same region as your Firestore database for optimal performance

### 5.3 Set Up Export to Cloud Storage (Alternative/Additional)

For more control over backups:

1. Go to **Cloud Storage** in Firebase Console
2. Create a bucket for backups (e.g., `gs://tea-tree-golf-club-backups`)
3. Set up scheduled export using gcloud CLI or Cloud Scheduler

**Using gcloud CLI** (requires Google Cloud SDK):

```bash
gcloud firestore export gs://tea-tree-golf-club-backups/$(date +%Y-%m-%d)
```

**Set up scheduled exports** with Cloud Scheduler:

1. Go to [Cloud Console Scheduler](https://console.cloud.google.com/cloudscheduler)
2. Click "Create Job"
3. Configure:
   - Name: `firestore-daily-backup`
   - Frequency: `0 2 * * *` (2 AM daily)
   - Timezone: Your timezone
   - Target: HTTP
   - URL: Use Firestore export API endpoint
   - HTTP method: POST

### 5.4 Test Backup Restore (Important!)

**Test your backup immediately after setup:**

1. In Firebase Console > Firestore Database > Import/Export
2. Click **"Export data"**
3. Select all collections
4. Export to Cloud Storage bucket
5. Verify export completed successfully
6. Try restoring to a test project to confirm backups are valid

### 5.5 Document Restore Procedure

**To restore from backup:**

```bash
# Using gcloud CLI
gcloud firestore import gs://tea-tree-golf-club-backups/[BACKUP_DATE]

# Or from Firebase Console:
# Firestore Database > Import/Export > Import data
# Select backup location
# Choose collections to restore
```

**IMPORTANT**: Restoring will overwrite existing data. Always:
1. Export current data first as a safeguard
2. Test restore on a separate project before production
3. Communicate downtime to users

---

## Step 6: Production Checklist

Before going live, verify:

### Security
- [ ] Firestore security rules deployed (test mode disabled)
- [ ] All `.env` variables configured correctly
- [ ] Firebase Authentication enabled with email/password
- [ ] Super Admin user created and activated
- [ ] Test that unauthenticated users cannot access data

### Functionality
- [ ] Login/logout works
- [ ] User registration and approval flow works
- [ ] All role permissions work correctly (VIEW, EDIT, ADMIN, SUPER_ADMIN)
- [ ] Member CRUD operations work
- [ ] Payment recording updates balance correctly
- [ ] Reports generate accurate data
- [ ] CSV export works

### Performance
- [ ] Firestore indexes deployed
- [ ] Production build tested (npm run preview)
- [ ] Page load times acceptable
- [ ] Large datasets (100+ members, 500+ payments) tested

### Backup & Recovery
- [ ] Daily backups enabled
- [ ] Backup retention period configured
- [ ] Test backup export completed successfully
- [ ] Restore procedure documented
- [ ] Backup monitoring alerts configured (optional)

### Monitoring
- [ ] Firebase Console access configured for admins
- [ ] Error reporting reviewed (check browser console)
- [ ] Usage quotas reviewed (Firestore read/write limits)

---

## Step 7: Post-Deployment Monitoring

### 7.1 Monitor Firestore Usage

1. Go to Firebase Console > Firestore Database > Usage
2. Monitor:
   - Document reads/writes per day
   - Storage usage
   - Network egress
3. Set up billing alerts if approaching quota limits

### 7.2 Monitor Authentication

1. Go to Firebase Console > Authentication > Users
2. Monitor:
   - New user registrations
   - Failed login attempts
   - Active users

### 7.3 Monitor Hosting

1. Go to Firebase Console > Hosting
2. Monitor:
   - Bandwidth usage
   - Request count
   - Error rates

---

## Step 8: Ongoing Maintenance

### Regular Tasks

**Weekly:**
- Review new user registrations and approve/deny
- Check Firebase Console for any errors or warnings
- Verify backups are running successfully

**Monthly:**
- Review Firestore usage and optimize queries if needed
- Check for Firebase SDK updates
- Review and rotate any API keys if necessary

**Quarterly:**
- Test backup restore procedure
- Review and update security rules if needed
- Check for npm package updates: `npm outdated`
- Update dependencies: `npm update`

### Security Updates

When updating npm packages:
```bash
# Check for security vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Rebuild and redeploy
npm run build
firebase deploy --only hosting
```

---

## Deployment Commands Reference

### Full Deployment (All Services)
```bash
npm run build
firebase deploy
```

### Selective Deployment
```bash
# Rules only
firebase deploy --only firestore:rules

# Indexes only
firebase deploy --only firestore:indexes

# Hosting only
firebase deploy --only hosting

# Rules + Indexes
firebase deploy --only firestore

# Multiple targets
firebase deploy --only firestore,hosting
```

### Rollback Hosting
```bash
# List previous releases
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

---

## Troubleshooting

### Issue: Security Rules Blocking Legitimate Users

**Symptoms:**
- Users getting "permission denied" errors
- Operations failing after deploying rules

**Solutions:**
1. Check user document exists in Firestore users collection
2. Verify user status is 'active' (not 'pending' or 'inactive')
3. Verify user role is assigned correctly
4. Test rules in emulator: `firebase emulators:start --only firestore`
5. Check Firebase Console > Firestore > Rules for syntax errors

### Issue: Deployment Fails

**Symptoms:**
- `firebase deploy` returns errors
- Rules or hosting not updating

**Solutions:**
1. Verify logged in: `firebase login`
2. Verify project ID in `.firebaserc` is correct
3. Check for syntax errors in `firestore.rules`
4. Ensure `dist/` directory exists (run `npm run build` first)
5. Check Firebase billing status (Spark vs Blaze plan)

### Issue: Backup Failing

**Symptoms:**
- Backups not appearing in Cloud Storage
- Export jobs failing

**Solutions:**
1. Verify Cloud Storage bucket exists
2. Check IAM permissions for Firestore service account
3. Ensure sufficient storage quota
4. Check Firebase Console > Firestore > Import/Export for errors

### Issue: Hosting Not Updating

**Symptoms:**
- Old version still showing after deployment
- Changes not reflected

**Solutions:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify `npm run build` completed successfully
3. Check `firebase.json` public directory is set to `dist`
4. Wait 5-10 minutes for CDN propagation
5. Check deployment history: Firebase Console > Hosting > Release history

---

## Security Best Practices

1. **Never commit `.env` file** to version control (already in `.gitignore`)
2. **Use separate Firebase projects** for development and production
3. **Regularly review user access** and remove inactive users
4. **Monitor authentication logs** for suspicious activity
5. **Keep dependencies updated** with `npm update`
6. **Test security rule changes** in emulator before deploying
7. **Rotate API keys** periodically if exposed
8. **Enable 2FA** for Firebase Console admin accounts
9. **Backup before major changes** (export Firestore data manually)
10. **Document all production changes** in a change log

---

## Support Resources

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Security Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Firebase CLI Reference**: https://firebase.google.com/docs/cli
- **Firebase Console**: https://console.firebase.google.com/
- **Stack Overflow**: Tag questions with `firebase`, `firestore`, `firebase-hosting`

---

## Emergency Contacts

Document your emergency contacts:
- Firebase Console Admin: [email]
- Technical Lead: [email]
- Backup Administrator: [email]

---

**Last Updated**: November 2025
**Project**: Tea Tree Golf Club Membership Management
**Deployment Version**: 1.0.0
