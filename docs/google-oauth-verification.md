# Google OAuth Verification Guide for AdMaster Pro

This document outlines the steps required to complete Google OAuth verification for AdMaster Pro, enabling production access to Google Ads API.

## Current OAuth Configuration

- **Client ID**: Configured in Google Cloud Console
- **Client Secret**: Stored in production `.env` as `GOOGLE_CLIENT_SECRET`
- **Redirect URI**: `https://admasterai.nobleblocks.com/api/auth/callback`
- **Application Type**: Web Application

## Required OAuth Scopes

AdMaster Pro requests the following scopes:

| Scope | Purpose | Sensitivity |
|-------|---------|-------------|
| `openid` | User authentication | Non-sensitive |
| `email` | Access user email | Non-sensitive |
| `profile` | Access user name/photo | Non-sensitive |
| `https://www.googleapis.com/auth/adwords` | Google Ads API access | Sensitive |

## Verification Steps

### Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure the following:

**App Information:**
- App name: `AdMaster Pro`
- User support email: `support@nobleblocks.com`
- App logo: Upload the AdMaster Pro logo (120x120px PNG)

**App Domain:**
- Application home page: `https://admasterai.nobleblocks.com`
- Application privacy policy link: `https://admasterai.nobleblocks.com/privacy`
- Application terms of service link: `https://admasterai.nobleblocks.com/terms`

**Developer Contact:**
- Email addresses: `support@nobleblocks.com`

### Step 2: Add Authorized Domains

In the OAuth consent screen:
- Add `nobleblocks.com` to authorized domains
- Add `admasterai.nobleblocks.com` if required

### Step 3: Add Required Scopes

Click "Add or Remove Scopes" and add:
1. `.../auth/userinfo.email`
2. `.../auth/userinfo.profile`
3. `openid`
4. `https://www.googleapis.com/auth/adwords` (sensitive scope)

### Step 4: Submit for Verification

Because AdMaster Pro requests access to the Google Ads API (a sensitive scope), verification is required:

1. Click **"PREPARE FOR VERIFICATION"**
2. Complete the verification form:

**Required Information:**
- Demonstrate why your app needs these scopes
- Explain how user data will be used
- Provide a demo video showing the OAuth flow
- Link to privacy policy and terms of service

**Verification Justification (Template):**

> AdMaster Pro is a SaaS platform that helps small businesses manage their Google Ads campaigns using AI assistance. We request the Google Ads API scope to:
>
> 1. **List accessible accounts** – Show users which Google Ads accounts they can manage
> 2. **View campaigns and keywords** – Display campaign performance metrics
> 3. **Pause/enable campaigns** – Allow users to control campaign status
> 4. **View search terms and call data** – Provide analytics and optimization recommendations
>
> User data is stored securely and never shared with third parties. Users can revoke access at any time through their Google Account settings.

### Step 5: Create Demo Video

Google requires a demo video showing:

1. **OAuth Flow**
   - Click "Sign in with Google"
   - Google consent screen appears
   - Scopes are clearly displayed
   - User grants consent
   - Redirected back to AdMaster Pro dashboard

2. **Data Usage**
   - Show how the app uses Google Ads data
   - Demonstrate the campaigns/analytics features
   - Show user can disconnect their account

**Video Requirements:**
- 3-5 minutes long
- MP4 format, 720p or higher
- No private/sensitive information visible
- Host on YouTube (unlisted) or Google Drive

### Step 6: Verification Timeline

- **Initial Review**: 2-5 business days
- **Brand Verification**: May require domain verification
- **Security Assessment**: May be required for sensitive scopes
- **Total Time**: 2-6 weeks depending on complexity

## Production Checklist

Before submitting for verification:

- [ ] Privacy Policy is live at `/privacy`
- [ ] Terms of Service is live at `/terms`
- [ ] OAuth consent screen configured
- [ ] Authorized domains added
- [ ] All required scopes added
- [ ] Demo video created and accessible
- [ ] Application home page accessible
- [ ] Support email configured
- [ ] App logo uploaded

## Google Ads API Specific Requirements

### Developer Token

AdMaster Pro uses a Google Ads Developer Token for API access:

1. Apply at [Google Ads API Center](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
2. Start with **Test Account** access
3. Apply for **Basic** or **Standard** access after testing

**Token Levels:**
- **Test**: Can only access test accounts
- **Basic**: 15,000 operations/day, production access
- **Standard**: Unlimited operations, requires approval

### Manager Account (MCC)

For multi-tenant SaaS:
- Create a Google Ads Manager Account
- Link customer accounts through OAuth
- Use manager account for API calls

## Security Considerations

### Token Storage
- `access_token`: Never stored (requested fresh via refresh)
- `refresh_token`: Stored in PostgreSQL `User.googleRefreshToken`
- Tokens encrypted in transit (HTTPS)

### Token Refresh
- Access tokens expire after 1 hour
- Refresh token used automatically when access token expires
- If refresh fails, user prompted to re-authenticate

### Revocation
- Users can revoke access at [Google Account Settings](https://myaccount.google.com/permissions)
- App should handle token revocation gracefully

## Troubleshooting

### "Access Denied" Errors
- Check if user has granted the `adwords` scope
- Verify the Google Ads account has an active connection
- Ensure Developer Token has appropriate access level

### "Refresh Token Invalid"
- User may have revoked access
- Prompt user to re-authenticate with Google

### "Quota Exceeded"
- Check Developer Token quota limits
- Implement exponential backoff
- Consider upgrading to Standard access

## Contact

For OAuth verification support:
- Google OAuth Support: [Google Identity Support](https://support.google.com/googleapi/)
- Google Ads API Support: [Google Ads API Forum](https://groups.google.com/g/adwords-api)

---

*Last Updated: February 2025*
