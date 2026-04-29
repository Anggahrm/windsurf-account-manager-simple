import { invoke } from '@tauri-apps/api/core';
import type { Account, Settings, OperationLog, UpdateSeatsResult, BillingInfo, BatchResult, GlobalTag, SortField, SortDirection, SortConfig, DevinLoginResult, WindsurfOrg, CheckUserLoginMethodResult, LoginMethodSniffResult, EmailstartResponse, ConnectionsResponse, DevinPasswordLoginResponse } from '@/types';
import type { AnalyticsData } from '@/types/analytics';

// Account ManagementAPI
export const accountApi = {
  async addAccount(data: {
    email: string;
    password: string;
    nickname: string;
    tags: string[];
    group?: string;
  }): Promise<Account> {
    return await invoke('add_account', data);
  },

  async getAllAccounts(): Promise<Account[]> {
    return await invoke('get_all_accounts');
  },

  async getAccount(id: string): Promise<Account> {
    return await invoke('get_account', { id });
  },

  async updateAccount(account: Account): Promise<void> {
    return await invoke('update_account', { account });
  },

  async deleteAccount(id: string): Promise<void> {
    return await invoke('delete_account', { id });
  },

  async deleteAccountsBatch(ids: string[]): Promise<{ success_count: number; failed_ids: string[] }> {
    return await invoke('delete_accounts_batch', { ids });
  },

  async searchAccounts(query: string): Promise<Account[]> {
    return await invoke('search_accounts', { query });
  },

  async filterAccountsByGroup(group: string): Promise<Account[]> {
    return await invoke('filter_accounts_by_group', { group });
  },

  async filterAccountsByTags(tags: string[]): Promise<Account[]> {
    return await invoke('filter_accounts_by_tags', { tags });
  }
};

// APIOperation
export const apiService = {
  async loginAccount(id: string): Promise<{ 
    success: boolean; 
    expires_at: string;
    plan_name?: string;
    used_quota?: number;
    total_quota?: number;
    subscription_expires_at?: string;
    is_disabled?: boolean;
    billing_strategy?: number;
    daily_quota_remaining_percent?: number;
    weekly_quota_remaining_percent?: number;
    daily_quota_reset_at_unix?: number;
    weekly_quota_reset_at_unix?: number;
    overage_balance_micros?: number;
  }> {
    return await invoke('login_account', { id });
  },

  async refreshToken(id: string): Promise<{ 
    success: boolean; 
    token?: string;
    expires_at?: string; 
    old_expires_at?: string; 
    message?: string;
    plan_name?: string;
    used_quota?: number;
    total_quota?: number;
    subscription_expires_at?: string;
    is_disabled?: boolean;
    is_team_owner?: boolean;
    billing_strategy?: number;
    daily_quota_remaining_percent?: number;
    weekly_quota_remaining_percent?: number;
    daily_quota_reset_at_unix?: number;
    weekly_quota_reset_at_unix?: number;
    overage_balance_micros?: number;
  }> {
    return await invoke('refresh_token', { id });
  },

  async resetCredits(id: string, seatCount?: number): Promise<any> {
    return await invoke('reset_credits', { id, seatCount });
  },

  async updateSeats(id: string, seatCount: number, retryTimes: number): Promise<UpdateSeatsResult> {
    return await invoke('update_seats', { id, seatCount, retryTimes });
  },

  async getBilling(id: string): Promise<BillingInfo> {
    return await invoke('get_billing', { id });
  },

  async batchResetCredits(ids: string[], seatCount?: number): Promise<BatchResult> {
    return await invoke('batch_reset_credits', { ids, seatCount });
  },

  async batchRefreshTokens(ids: string[]): Promise<BatchResult> {
    return await invoke('batch_refresh_tokens', { ids });
  },

  /**
   * UpdateSubscriptionplan
   * @param id AccountID
   * @param planType plan type
   * @param paymentPeriod Payment Cycle（1=Monthly, 2=Annually，default1）
   * @param preview previewMode（true=only previewnotactualexecute，defaultfalse）
   */
  async updatePlan(id: string, planType: string, paymentPeriod: number = 1, preview: boolean = false): Promise<{
    success: boolean;
    preview?: boolean;
    plan_type?: string;
    payment_period?: number;
    payment_period_name?: string;
    status_code?: number;
    applied_changes?: boolean;
    payment_failure_reason?: string | null;
    billing_update?: {
      amount_due_immediately?: number;
      price_per_seat?: number;
      num_seats?: number;
      sub_interval?: number;
      sub_interval_name?: string;
      amount_per_interval?: number;
      billing_start?: string;
      billing_end?: string;
      unused_plan_refunded?: boolean;
      has_sso_add_on?: boolean;
    };
    requires_password_reset?: boolean;
    raw_response?: string;
    timestamp: string;
  }> {
    return await invoke('update_plan', { id, planType, paymentPeriod, preview });
  },

  /**
   * Cancel Subscription
   * @param id AccountID
   * @param reason Cancelreason
   * @returns containsOperationresultresponse
   */
  async cancelSubscription(id: string, reason: string): Promise<{
    success: boolean;
    reason?: string;
    status_code?: number;
    raw_response?: string;
    timestamp: string;
  }> {
    return await invoke('cancel_subscription', { id, reason });
  },

  /**
   * Restore Subscription
   * @param id AccountID
   * @returns containsOperationresultresponse
   */
  async resumeSubscription(id: string): Promise<{
    success: boolean;
    status_code?: number;
    raw_response?: string;
    timestamp: string;
  }> {
    return await invoke('resume_subscription', { id });
  },

  async getAccountInfo(id: string): Promise<any> {
    return await invoke('get_account_info', { id });
  },

  async getCurrentUser(id: string): Promise<any> {
    return await invoke('get_current_user', { id });
  },

  /**
   * fetchPlanStatus（Credits/QuotaInfo）
   * 比 getCurrentUser morelightweight，专used forRefreshCreditsStatus
   * @param id AccountID
   * @returns containsPlanStatus and CreditsInforesponse
   */
  async getPlanStatus(id: string): Promise<{
    success: boolean;
    plan_status?: {
      plan_name?: string;
      teams_tier?: number;
      teams_tier_name?: string;
      used_prompt_credits?: number;
      used_flow_credits?: number;
      used_flex_credits?: number;
      available_prompt_credits?: number;
      available_flow_credits?: number;
      available_flex_credits?: number;
      monthly_prompt_credits?: number;
      monthly_flow_credits?: number;
      plan_start?: number;
      plan_end?: number;
    };
    status_code?: number;
    error?: string;
    timestamp: string;
  }> {
    return await invoke('get_plan_status', { id });
  },

  /**
   * fetchtrialbind cardlink
   * @param id AccountID
   * @param teamsTier Teametc.level: 1=Teams, 2=Pro, 3=Enterprise
   * @param paymentPeriod Payment Period: 1=Monthly, 2=Annually
   * @param teamName Team Name (only  Teams/Enterprise need)
   * @param seatCount SeatCount (only  Teams/Enterprise need)
   * @param turnstileToken Turnstile VerifyToken (startTrial=true whenallplanall必need)
   * @returns containsStripe Checkoutlinkresponse
   */
  async getTrialPaymentLink(
    id: string, 
    teamsTier?: number,
    paymentPeriod?: number,
    startTrial?: boolean,
    teamName?: string,
    seatCount?: number,
    turnstileToken?: string
  ): Promise<{
    success: boolean;
    stripe_url?: string;
    teams_tier?: number;
    payment_period?: number;
    status_code?: number;
    error?: string;
    timestamp: string;
  }> {
    return await invoke('get_trial_payment_link', { id, teamsTier, paymentPeriod, startTrial, teamName, seatCount, turnstileToken });
  },

  // === ProtobufparseAPI（Backparseafterstructuredata） ===
  
  /**
   * fetchCurrentUserInfo（auto parseProtobuf）
   * BackparseafterUserdatastructure
   */
  async getCurrentUserParsed(id: string): Promise<{
    success: boolean;
    data?: {
      user: {
        id: string;
        name: string;
        email: string;
        firebase_uid: string;
        subscription_id: string;
        team: string;
        timezone: string;
      };
      subscription?: {
        id: string;
        email: string;
        stripe_subscription_id: string;
        stripe_customer_id: string;
        seats: number;
        usage: number;
        quota: number;
        used_quota: number;
      };
      plan?: {
        name: string;
        level: number;
        bandwidth_limit: number;
        cache_limit: number;
      };
      admin?: {
        id: string;
        username: string;
        role: string;
      };
      is_root_admin: boolean;
    };
    parsed_data?: any;
    timestamp: string;
    error?: string;
  }> {
    return await invoke('get_current_user_parsed', { id });
  },

  /**
   * fetchaccountsingleInfo（auto parseProtobuf）
   * TODO: implementProtobufparse
   */
  async getBillingParsed(id: string): Promise<any> {
    return await invoke('get_billing_parsed', { id });
  },

  /**
   * batchfetchUserInfo（auto parseProtobuf）
   */
  async batchGetUsersParsed(ids: string[]): Promise<{
    success: boolean;
    results: Array<{
      id: string;
      success: boolean;
      data?: any;
      error?: string;
    }>;
    total: number;
    timestamp: string;
  }> {
    return await invoke('batch_get_users_parsed', { ids });
  },

  /**
   * one键Switch AccounttoWindsurf
   * @param id AccountID
   * @returns Switchresult
   */
  async switchAccount(id: string): Promise<{ 
    success: boolean; 
    message?: string;
    auth_token?: string;
    machine_id_reset?: boolean;
    seamless_patch_active?: boolean;
    auto_enabled_seamless?: boolean;
    error?: string;
  }> {
    return await invoke('switch_account', { id });
  },
  
  /**
   * ResetmachineID
   * @returns Resetresult
   */
  async resetMachineId(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    requires_admin?: boolean;
  }> {
    return await invoke('reset_machine_id');
  },
};

// SettingsManagementAPI
export const settingsApi = {
  async getSettings(): Promise<Settings> {
    return await invoke('get_settings');
  },

  async updateSettings(settings: Settings): Promise<void> {
    return await invoke('update_settings', { settings });
  },

  async getGroups(): Promise<string[]> {
    return await invoke('get_groups');
  },

  async addGroup(name: string): Promise<void> {
    return await invoke('add_group', { name });
  },

  async deleteGroup(name: string): Promise<void> {
    return await invoke('delete_group', { name });
  },

  async renameGroup(oldName: string, newName: string): Promise<void> {
    return await invoke('rename_group', { oldName, newName });
  },

  async getLogs(limit?: number): Promise<OperationLog[]> {
    return await invoke('get_logs', { limit });
  },

  async clearLogs(): Promise<void> {
    return await invoke('clear_logs');
  },

  async exportData(): Promise<any> {
    return await invoke('export_data');
  },

  async getStats(): Promise<any> {
    return await invoke('get_stats');
  },

  async getCurrentWindsurfInfo(): Promise<{
    email?: string;
    name?: string;
    api_key?: string;
    plan_name?: string;
    team_id?: string;
    version?: string;
    is_active: boolean;
    /** ActiveClienttype："windsurf" | "windsurf-next" */
    client_type: string;
    /** Clientshowname："Windsurf" | "Windsurf - Next" */
    client_display_name: string;
    /** ActiveClient进程whethercurrentlyrun */
    is_running: boolean;
  }> {
    return await invoke('get_current_windsurf_info');
  },

  // Tag Management
  async getTags(): Promise<GlobalTag[]> {
    return await invoke('get_tags');
  },

  async addTag(tag: GlobalTag): Promise<void> {
    return await invoke('add_tag', { tag });
  },

  async updateTag(oldName: string, tag: GlobalTag): Promise<void> {
    return await invoke('update_tag', { oldName, tag });
  },

  async deleteTag(name: string): Promise<void> {
    return await invoke('delete_tag', { name });
  },

  async batchUpdateAccountTags(accountIds: string[], addTags: string[], removeTags: string[]): Promise<{
    success_count: number;
    failed_count: number;
  }> {
    return await invoke('batch_update_account_tags', { accountIds, addTags, removeTags });
  },

  // Team Settings API
  async getTeamConfig(id: string): Promise<{
    success: boolean;
    data?: {
      team_id?: string;
      allow_auto_run_commands?: boolean;
      allow_mcp_servers?: boolean;
      allow_app_deployments?: boolean;
      allow_sandbox_app_deployments?: boolean;
      allow_teams_app_deployments?: boolean;
      allow_github_reviews?: boolean;
      allow_github_description_edits?: boolean;
      allow_conversation_sharing?: boolean;
      allow_individual_level_analytics?: boolean;
      allow_attribution?: boolean;
      allow_vibe_and_replace?: boolean;
      allow_browser_experimental_features?: boolean;
      disable_deepwiki?: boolean;
      allowed_mcp_servers?: string[];
    };
    error?: string;
  }> {
    return await invoke('get_team_config', { id });
  },

  async updateTeamConfig(id: string, config: {
    allow_auto_run_commands?: boolean;
    allow_mcp_servers?: boolean;
    allow_app_deployments?: boolean;
    allow_sandbox_app_deployments?: boolean;
    allow_teams_app_deployments?: boolean;
    allow_github_reviews?: boolean;
    allow_github_description_edits?: boolean;
    allow_conversation_sharing?: boolean;
    allow_individual_level_analytics?: boolean;
    allow_attribution?: boolean;
    allow_vibe_and_replace?: boolean;
    allow_browser_experimental_features?: boolean;
    disable_deepwiki?: boolean;
    allowed_mcp_servers?: string;
  }): Promise<{ success: boolean; error?: string }> {
    return await invoke('update_team_config', { id, config });
  },

  // sortManagement
  async getSortedAccounts(sortField: SortField, sortDirection: SortDirection): Promise<Account[]> {
    return await invoke('get_sorted_accounts', { sortField, sortDirection });
  },

  async updateAccountsOrder(accountIds: string[]): Promise<void> {
    return await invoke('update_accounts_order', { accountIds });
  },

  async updateSortConfig(sortConfig: SortConfig): Promise<void> {
    return await invoke('update_sort_config', { sortConfig });
  },

  async getSortConfig(): Promise<SortConfig> {
    return await invoke('get_sort_config');
  }
};

// Analytics API
export const analyticsApi = {
  /**
   * fetchAccountuseAnalysisdata（mostnear30days）
   * @param id AccountID
   * @returns Analysisdata
   */
  async getAccountAnalytics(id: string): Promise<AnalyticsData> {
    return await invoke('get_account_analytics', { id });
  }
};

// Devin Session auth API
export const devinApi = {
  /**
   * Loginprovider typesmartdetection（solution B unify入口）
   *
   * backendconcurrentcall：
   * - Firebase  side `CheckUserLoginMethod`　（user_exists / is_migrated / has_password etc.）
   * - Devin  side `/_devin-auth/connections`　（method / sso_connections etc.）
   *
   * Back `recommended` field标notebuild议Loginprovider type，beforeside据thisautodispatch。
   */
  async sniffLoginMethod(email: string): Promise<LoginMethodSniffResult> {
    return await invoke('sniff_login_method', { email });
  },

  /**
   * single独call Firebase  side `CheckUserLoginMethod`（calltry/明细show）
   *
   * dailysmartLoginpleasedirectlyuse `sniffLoginMethod`。
   */
  async checkUserLoginMethod(email: string): Promise<CheckUserLoginMethodResult> {
    return await invoke('devin_check_user_login_method', { email });
  },

  /**
   * queryspecifyEmailcanuseLogin Method（Optional，used for UI 预judge）
   */
  async checkConnections(email: string): Promise<any> {
    return await invoke('devin_check_connections', { email });
  },

  /**
   * only credentialsLogin（low-level API），Back auth1_token
   */
  async passwordLogin(email: string, password: string): Promise<{
    auth1_token: string;
    account_id?: string;
    [key: string]: any;
  }> {
    return await invoke('devin_password_login', { email, password });
  },

  /**
   * use auth1_token exchange for session_token（low-level API）
   */
  async windsurfPostAuth(auth1Token: string, orgId?: string): Promise<{
    session_token: string;
    auth1_token?: string;
    account_id?: string;
    primary_org_id?: string;
    orgs: WindsurfOrg[];
  }> {
    return await invoke('devin_windsurf_post_auth', { auth1Token, orgId });
  },

  /**
   * completeflow：credentialsLogin + buildAccount（primaryflow）
   *
   * whenAccountbelongs tomultiplegroupwhen org，Back `requires_org_selection=true` + orgs List，
   * UI needletUserselect org aftercall `addAccountWithOrg`
   */
  async addAccountByLogin(params: {
    email: string;
    password: string;
    nickname?: string;
    tags: string[];
    group?: string;
    orgId?: string;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_login', {
      email: params.email,
      password: params.password,
      nickname: params.nickname,
      tags: params.tags,
      group: params.group,
      orgId: params.orgId,
    });
  },

  /**
   * in multi-org scenariosecondaryselect：inalready has auth1_token basicon，specify org_id DoneAccountcreate
   *
   * `password` Optional：credentials流firsttimeselect org failedaftersecondarycallwhenpass inUseroriginalPassword，letAccountcardcanbackshow；
   * 纯credentialimport into / Emailno密Loginscenariocan be omitted。
   */
  async addAccountWithOrg(params: {
    email: string;
    auth1Token: string;
    orgId: string;
    nickname?: string;
    tags: string[];
    group?: string;
    password?: string;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_with_org', {
      email: params.email,
      auth1Token: params.auth1Token,
      orgId: params.orgId,
      nickname: params.nickname,
      tags: params.tags,
      group: params.group,
      password: params.password ?? null,
    });
  },

  /**
   * usealready store auth1_token Refresh session_token
   */
  async refreshSession(id: string): Promise<{
    success: boolean;
    session_token: string;
    primary_org_id?: string;
    message?: string;
  }> {
    return await invoke('refresh_devin_session', { id });
  },

  /**
   * viaalready has `devin-session-token$...` prefix session_token directlyImport Devin Account
   *
   * suitableusescenario：Userfrombrowser localStorage / cookie 拷outvalid session_token import intopath。
   * only need `sessionToken`，backendcall GetCurrentUser reverse lookup email / api_key / Quotaetc.Info。
   * Devin 扩展field（account_id / auth1_token / primary_org_id）leave empty——daily API stillcanwork，
   * only  `refreshSession` willfailed（toperiodneedUserre-fetch session_token）。
   */
  async addAccountBySessionToken(params: {
    sessionToken: string;
    nickname?: string;
    tags: string[];
    group?: string;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_session_token', {
      sessionToken: params.sessionToken,
      nickname: params.nickname,
      tags: params.tags,
      group: params.group,
    });
  },

  /**
   * viaalready has Devin `auth1_token`（format `auth1_<52character>`）directlyImportAccount
   *
   * suitableusescenario：Userfrombrowser localStorage  `devin_auth1_token` 键拷outimport intopath。
   * and `addAccountBySessionToken` forcall，butmultiplekeep auth1_token，let subsequent `refreshSession` canNormalwork。
   *
   * backendinternal：`windsurf_post_auth(auth1_token, org_id)` → `GetCurrentUser` reverse lookup email → persist to DB。
   *
   * multiplegrouporghandle：
   * - `autoSelectPrimaryOrg` 省略 or  false：Back `requires_org_selection=true` + email/auth1_token/orgs，
   *   beforesideneed to call `addAccountWithOrg` Donesecondaryselect org
   * - `autoSelectPrimaryOrg: true`（Batch Importscenario）：autouse primary org persist to DB
   */
  async addAccountByAuth1Token(params: {
    auth1Token: string;
    orgId?: string;
    nickname?: string;
    tags: string[];
    group?: string;
    autoSelectPrimaryOrg?: boolean;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_auth1_token', {
      auth1Token: params.auth1Token,
      orgId: params.orgId,
      nickname: params.nickname,
      tags: params.tags,
      group: params.group,
      autoSelectPrimaryOrg: params.autoSelectPrimaryOrg,
    });
  },

  // ========== Email Verification Code（noPasswordLogin） ==========

  /**
   * sendEmail Verification Code（low-level API）
   *
   * - `mode`：`"signup"`  or  `"login"`（noPasswordemailLogin），default `"login"`
   * - `product`：default `"Windsurf"`；serverfor `/email/start` force literal validate，
   *   only accept `"Devin"` / `"Windsurf"`（firstcharacter母largewrite），passsmallwritewillBack 422。
   *
   * server toEmailsend 6 -digit verification code， and Back `email_verification_token`，
   * for subsequent `addAccountByEmailLogin` callbackuse。
   */
  async emailstart(
    email: string,
    mode: 'signup' | 'login' = 'login',
    product: 'Windsurf' | 'Devin' = 'Windsurf'
  ): Promise<EmailstartResponse> {
    return await invoke('devin_email_start', { email, mode, product });
  },

  /**
   * completeflow：Email Verification CodeRegister New Account + buildAccount
   *
   * prerequisite: callerApproved `emailstart(email, "signup")` got `email_verification_token`，
   * and guideUserread from email the 6 -digit verification code。
   *
   * server `mode=signup` Complete Registration and BacknewAccount auth1_token，
   * in multi-org scenarioBack `requires_org_selection=true` + orgs，UI need to call `addAccountWithOrg` secondaryDone。
   */
  async addAccountByRegister(params: {
    email: string;
    emailVerificationToken: string;
    code: string;
    password: string;
    name: string;
    nickname?: string;
    tags: string[];
    group?: string;
    orgId?: string;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_register', params);
  },

  /**
   * completeflow：noPasswordemailVerification CodeLogin + buildAccount
   *
   * used from SSO migrateandnoPassword、 or forgetPasswordAlready exists Devin Account。
   * prerequisite: callerApproved `emailstart(email, "login")` got `email_verification_token`，
   * and guideUserread from email the 6 -digit verification code。
   *
   * server `mode=login` when**notwillcreatenewAccount**，only Backalready hasAccount auth1_token。
   * in multi-org scenarioBack `requires_org_selection=true` + orgs，UI need to call `addAccountWithOrg` secondaryDone。
   */
  async addAccountByEmailLogin(params: {
    email: string;
    emailVerificationToken: string;
    code: string;
    nickname?: string;
    tags: string[];
    group?: string;
    orgId?: string;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_email_login', params);
  },

  // ========== Devin native站point（app.devin.ai）Registerthrough道 ==========
  //
  // andonside Windsurf  side `_devin-auth` through道keyareaother：
  // - port：`https://app.devin.ai/api/auth1/*`（Devin officialbackenddirect连）
  // - `email/start` pleaserequire bodynotcarry `product` field
  // - `email/complete` pleaserequire bodynotcarry `password` / `name` field（纯Email Verification Codecreate account）
  // - RegisteroutAccount JWT in `product == "Devin"`，primarybelong Devin product side
  // - backend `addAccountByNativeRegister` inRegistersuccessfulthen autocall WindsurfPostAuth bridgeto Windsurf，
  //   persist to DBAccountbothcanuse Devin productFeature（auth1_token），alsocanuse Windsurf product API（session_token）

  /**
   * query Devin native side（app.devin.ai）Emailcanuseconnectmethod（Optional预检）
   *
   * response `connections` countgroupwillextracontains `windsurf-bridge` itemsitem，
   * response `auth_method.method` field指示Emailwhetheralready Register（`"not_found"` = notRegister）。
   */
  async nativeCheckConnections(email: string): Promise<ConnectionsResponse> {
    return await invoke('devin_app_check_connections', { email });
  },

  /**
   * toward Devin native sidesendEmail Verification Code（low-level API）
   *
   * @param email Target Email
   * @param mode  `"signup"` Register New Account；`"login"` already has Devin AccountnoPasswordemailLogin。default `"signup"`
   *
   * Back `EmailstartResponse`，for subsequent `addAccountByNativeRegister` callback `email_verification_token`。
   */
  async nativeEmailstart(
    email: string,
    mode: 'signup' | 'login' = 'signup'
  ): Promise<EmailstartResponse> {
    return await invoke('devin_app_email_start', { email, mode });
  },

  /**
   * SubmitVerification CodeDone Devin native sideemailflow（low-level API）
   *
   * only inneed纯粹call `/api/auth1/email/complete`（notpersist to DB、notbridge）whenuse；
   * dailyRegisterpleasedirectlyuse `addAccountByNativeRegister` one键Done。
   */
  async nativeEmailComplete(params: {
    emailVerificationToken: string;
    code: string;
    mode: 'signup' | 'login';
  }): Promise<DevinPasswordLoginResponse> {
    return await invoke('devin_app_email_complete', params);
  },

  /**
   * completeflow：Devin Native Registration → Auto Bridge Windsurf → persist to DBasnewAccount
   *
   * prerequisite: callerApproved `nativeEmailstart(email, "signup")` got `email_verification_token`，
   * and guideUserread from email the 6 -digit verification code。
   *
   * and `addAccountByRegister`（Windsurf  sideRegister）差异：
   * - does not need `password` and `name` 入参（Devin Native Registrationis"纯Email Verification Code"create account）
   * - Accountpersist to DBwhen `password` fieldleave empty，Usercansubsequentin Devin product side自rowSettingsPassword
   * - JWT belongas Devin，subsequent Devin productFeature（auth1_token）candirectlyuse
   *
   * in multi-org scenarioBack `requires_org_selection=true` + orgs，UI need to call `addAccountWithOrg` secondaryDone（and Windsurf  sideconsistent）。
   */
  async addAccountByNativeRegister(params: {
    email: string;
    emailVerificationToken: string;
    code: string;
    nickname?: string;
    tags: string[];
    group?: string;
    orgId?: string;
  }): Promise<DevinLoginResult> {
    return await invoke('add_account_by_devin_native_register', params);
  },

  // ==================== Firebase ↔ Devin Accountmutual convert ====================

  /**
   * put Firebase Accountconvert to Devin Login Method
   *
   * scenario：officialwillold Firebase Accountmigrateto Devin system（Passwordnotchange），local帐cardstillis
   * Firebase config。callaftercomplexuseAccountstored plaintextPassworduse Devin Loginflow。
   *
   * Back：
   * - success=true：already Switchto Devin system
   * - success=false, already_converted=true：Accountalready is Devin system
   * - success=false, requires_org_selection=true：multiplegrouporgneedselect，bycallside
   *   popupgrouporgselectafteragaintimecallthismethod and pass in orgId
   */
  async convertAccountToDevin(params: {
    id: string;
    orgId?: string;
  }): Promise<{
    success: boolean;
    already_converted?: boolean;
    requires_org_selection?: boolean;
    orgs?: Array<{ id: string; name: string }>;
    email?: string;
    account?: any;
    message?: string;
  }> {
    return await invoke('convert_account_to_devin', {
      id: params.id,
      orgId: params.orgId,
    });
  },

  /**
   * put Devin Accountconvert to Firebase Login Method
   *
   * scenario：officialbackcallcertainsome帐to Firebase system、 or User误转afterneedalsooriginal。
   * callaftercomplexuseAccountstored plaintextPassworduse Firebase signInWithPassword。
   *
   * Back：
   * - success=true：already Switchto Firebase system
   * - success=false, already_converted=true：Accountalready is Firebase system
   */
  async convertAccountToFirebase(params: {
    id: string;
  }): Promise<{
    success: boolean;
    already_converted?: boolean;
    email?: string;
    account?: any;
    message?: string;
  }> {
    return await invoke('convert_account_to_firebase', { id: params.id });
  },
};

// system维护 API
export const systemApi = {
  /**
   * Reset HTTP Client（used fromnetwork故障inrestore）
   * whenmeettoconsecutiveAPIpleaserequirefailedwhen，cantocallthismethodResetHTTPConnection Pool
   */
  async resetHttpClient(): Promise<{ success: boolean; message: string }> {
    return await invoke('reset_http_client');
  }
};
