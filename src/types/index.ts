// ============================================================
// localAccount Managementtype
// ============================================================

/**
 * withcolorTagsAPI
 */
export interface TagWithColor {
  name: string;
  color: string; // RGBAformat，e.g. "rgba(255, 100, 100, 1)"
}

/**
 * AccountStatustype
 */
export type AccountStatusType = 'normal' | 'inactive' | 'disabled' | 'offline' | 'error';

/**
 * Accountfilteritemsitem
 */
export interface AccountFilter {
  group?: string;
  tags?: string[];
  search?: string;
  // Advanced Filter
  remainingQuotaMin?: number;  // Remaining QuotaMinvalue
  remainingQuotaMax?: number;  // Remaining QuotaMaxvalue
  totalQuotaMin?: number;      // Total QuotaMinvalue
  totalQuotaMax?: number;      // Total QuotaMaxvalue
  expiryDaysMin?: number;      // Days RemainingMinvalue
  expiryDaysMax?: number;      // Days RemainingMaxvalue
  // day/Weekly Quota Remainingpercentagefilter（0-100，only  billing_strategy === 2 (QUOTA) Accountparticipate）
  dailyQuotaPercentMin?: number;   // Daily Quota % Minvalue
  dailyQuotaPercentMax?: number;   // Daily Quota % Maxvalue
  weeklyQuotaPercentMin?: number;  // Weekly Quota % Minvalue
  weeklyQuotaPercentMax?: number;  // Weekly Quota % Maxvalue
  planNames?: string[];        // PlanNamefilter
  domains?: string[];          // Domainfilter
  statuses?: AccountStatusType[];  // Statusfilter
}

/**
 * Paginationconfig
 */
export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  pageSizes: number[];
}

/**
 * sortfieldenum
 */
export type SortField = 
  | 'email'               // Email/AccountName
  | 'created_at'          // Created At
  | 'used_quota'          // Used Credits
  | 'remaining_quota'     // Remaining Credits
  | 'token_expires_at'    // Token ExpiresTime
  | 'subscription_expires_at'  // Subscription ExpiresTime
  | 'plan_name'           // Plan Type
  | 'daily_quota_remaining'    // Daily Quota % (only  billing_strategy=2(QUOTA) valid)
  | 'weekly_quota_remaining';  // Weekly Quota % (only  billing_strategy=2(QUOTA) valid)

/**
 * sortsidetowardenum
 */
export type SortDirection = 'asc' | 'desc';

/**
 * sort config
 */
export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface Account {
  id: string;
  email: string;
  password?: string; // Optional for updates
  nickname: string;
  tags: string[];
  tagColors?: TagWithColor[]; // withcolorTags
  group?: string;
  token?: string;
  refresh_token?: string; // Refresh Token（used forRefresh access_token）
  token_expires_at?: string;
  last_seat_count?: number;
  created_at: string;
  last_login_at?: string;
  status: 'active' | 'inactive' | 'error';
  // Quota and PlanInfo（fromAPIfetch）
  plan_name?: string;
  used_quota?: number;
  total_quota?: number;
  last_quota_update?: string;
  // Subscription ExpiresTime
  subscription_expires_at?: string;
  // Subscriptionwhetheractivate (from GetCurrentUser API  team_info.subscription_active fetch)
  subscription_active?: boolean;
  // Windsurf API Key (from GetCurrentUser API  user.api_key fetch)
  windsurf_api_key?: string;
  // AccountwhetherwasDisable (from GetCurrentUser API  user.disable_codeium fetch)
  is_disabled?: boolean;
  // whether it isTeamall者（AdminRole，hasTeam MembersprimaryAccount）
  is_team_owner?: boolean;
  // Billing Strategy (0=UNSPECIFIED, 1=CREDITS, 2=QUOTA, 3=ACU)
  billing_strategy?: number;
  // Daily Quota Remainingpercentage (0-100，only  billing_strategy=2(QUOTA) whenvalid)
  daily_quota_remaining_percent?: number;
  // Weekly Quota Remainingpercentage (0-100，only  billing_strategy=2(QUOTA) whenvalid)
  weekly_quota_remaining_percent?: number;
  // Daily QuotaResetTime (UnixTimetimestampseconds)
  daily_quota_reset_at_unix?: number;
  // Weekly QuotaResetTime (UnixTimetimestampseconds)
  weekly_quota_reset_at_unix?: number;
  // extrause余额 (微USD，divide by1e6gettoUSD)
  overage_balance_micros?: number;
  // customsortorder（used forDrag to reorder）
  sortOrder?: number;

  // ==================== Devin Session authfield ====================
  /** Devin onelevelauthToken（canused foragaintimeexchange for session_token） */
  devin_auth1_token?: string;
  /** Devin Account ID（format：account-<32 character十六进制>） */
  devin_account_id?: string;
  /** Devin Primary Org ID */
  devin_primary_org_id?: string;
  /** auth提供side："firebase"（defaultoldsystem） or  "devin"（Devin Session newsystem） */
  auth_provider?: 'firebase' | 'devin';
}

/**
 * Devin grouporgitemsitem
 */
export interface WindsurfOrg {
  id: string;
  name: string;
}

/**
 * `devin_email_start` responsestructure：sendEmail Verification Codelow-level API
 *
 * server toEmailsend 6 -digit verification code， and callback `email_verification_token`，for subsequent
 * `/email/complete` flow（Login / Register / forgetPassword）makeassessioncredentialuse。
 */
export interface EmailstartResponse {
  email_verification_token: string;
  [key: string]: any;
}

/**
 * `devin_check_connections` / `devin_app_check_connections` responsestructure
 *
 * queryEmailin Devin  side（Windsurf same源 or  app.devin.ai native）canuseconnectmethod。
 * original JSON 透passin `connections` / `auth_method` etc.fieldin；serverpossiblyBackextrafield。
 */
export interface ConnectionsResponse {
  /** canuseconnectmethodList（`email` / `google` / `github` / `windsurf-bridge` / SSO etc.） */
  connections?: Array<{
    id: string | null;
    type: string;
    enabled: boolean;
    client_id: string | null;
    [key: string]: any;
  }>;
  /** Emailauthmethoddetermine */
  auth_method?: {
    /** `"not_found"` | `"auth1"` | other */
    method?: string;
    has_password?: boolean;
    sso_connections?: any[] | null;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * `devin_password_login` / `devin_email_complete` / `devin_app_email_complete` responsestructure
 *
 * 实测response：`{ "token": "auth1_<52>", "user_id": "user-<32>", "email": "..." }`
 * fieldothernamesamewhencompatible `auth1_token` / `account_id` etc.historynamedname。
 */
export interface DevinPasswordLoginResponse {
  /** onelevelauthToken（format：`auth1_<52 characterrandom>`） */
  auth1_token: string;
  /** Devin Account/User ID（format：`user-<32 character>`） */
  account_id?: string | null;
  /** serverbackshowEmail */
  email?: string | null;
  [key: string]: any;
}

/**
 * add_account_by_devin_login / add_account_by_devin_email_login responsestructure
 */
export interface DevinLoginResult {
  success: boolean;
  requires_org_selection?: boolean;
  auth1_token?: string;
  orgs?: WindsurfOrg[];
  account?: Account;
  email?: string;
  plan_name?: string;
  used_quota?: number;
  total_quota?: number;
  devin_account_id?: string;
  primary_org_id?: string;
  message?: string;
}

/**
 * CheckUserLoginMethod response（Firebase  sideforEmailLogin Methodjudge）
 *
 * corresponding `exa.seat_management_pb.SeatManagementService/CheckUserLoginMethod`
 */
export interface CheckUserLoginMethodResult {
  redirect_url: string;
  disallow_enterprise_user_login: boolean;
  user_exists: boolean;
  is_migrated: boolean;
  has_password: boolean;
}

/**
 * Loginprovider typedetectionrecommendvalue
 *
 * - `"firebase"`    — old Firebase Account + already setPassword，use Firebase Email/PasswordLogin
 * - `"devin"`       — already migrate or new Auth1 Account，use Devin credentialsLogin
 * - `"sso"`         — 挂接Enterprise SSO，must be inbrowserinDone SSO redirect
 * - `"no_password"` — oldAccountonly usepass Google/GitHub，needuse OAuth  or firstResetPassword
 * - `"not_found"`   — Emailtwo sideallnotsavein，needfirstRegister
 * - `"blocked"`     — EnterpriseUserwaslimitnormalLogin
 */
export type LoginMethodRecommendation =
  | 'firebase'
  | 'devin'
  | 'sso'
  | 'no_password'
  | 'not_found'
  | 'blocked';

/**
 * Loginprovider typedetectionaggregateresult
 *
 * bybackend `sniff_login_method` Tauri commandBack，aggregate：
 * - Firebase  side `CheckUserLoginMethod`
 * - Devin  side `/_devin-auth/connections`
 */
export interface LoginMethodSniffResult {
  /** build议Loginprovider type */
  recommended: LoginMethodRecommendation;
  /** sidetowardperson理bydescription，candirectly展give UI */
  reason: string;

  // ==== Firebase(WS)  sideoriginaldetermine ====
  user_exists: boolean;
  is_migrated: boolean;
  has_password: boolean;
  redirect_url: string | null;
  disallow_enterprise: boolean;

  // ==== Devin  sideoriginaldetermine ====
  /** Devin `/connections` Backoriginal JSON，APIfailed or Emailnotsaveinwhenas null */
  devin_connections: Record<string, any> | null;
  /** Devin  side `method` field：`"auth1"` | `"not_found"` | null */
  devin_method: string | null;
  /** Devin  side `has_password` field */
  devin_has_password: boolean | null;
  /** Devin  side `sso_connections` countgroupwhethernon-empty */
  has_sso_connection: boolean;
}

// ============================================================
// GetCurrentUser API responsetype（with backend proto_parser.rs maintainconsistent）
// ============================================================

/**
 * UserBasic Info (seat_management_pb.User)
 * corresponds to backend UserBasicInfo struct
 */
export interface UserBasicInfo {
  api_key: string;           // field 1: API Key (UUIDformat，used forAPIcallidentityidentify)
  name: string;              // field 2: UserdisplayName
  email: string;             // field 3: Email
  id: string;                // field 6: Firebase UID (Userunique标识)
  team_id: string;           // field 7: 所属TeamID
  team_status: number;       // field 8: UserTeamStatus (0=Not specified,1=pending,2=Approved,3=Rejected)
  username: string;          // field 9: Username (e.g. righteously-handsome-kite-82267)
  timezone: string;          // field 10: timezone (e.g. Asia/Shanghai)
  public_profile_enabled: boolean;  // field 11: whetherpublic information
  pro: boolean;              // field 13: whetherProUser
  disable_codeium: boolean;  // field 16: whetherDisableCodeium
  newsletter: boolean;       // field 19: whetherSubscriptionemail
  disabled_telemetry: boolean; // field 20: whetherDisabletelemetry
  signup_stage?: string;     // field 22: Registerstage
  used_trial: boolean;       // field 25: whetherUsedtrial
  used_prompt_credits: number; // field 28: UsedPromptCredits
  used_flow_credits: number;   // field 29: UsedFlowCredits
  referral_code?: string;    // field 30: Referral Code
  // Timestamp fields (UnixsecondslevelTimetimestamp)
  signup_time?: number;              // field 4: Registration Time
  last_update_time?: number;         // field 5: Last UpdatedTime
  first_windsurf_use_time?: number;  // field 26: firsttimeuseWindsurfTime
  windsurf_pro_trial_end_time?: number; // field 27: ProtrialendTime
}

/**
 * TeamInfo (seat_management_pb.Team)
 * corresponds to backend TeamInfo struct
 */
export interface TeamInfo {
  id: string;                        // field 1: TeamID
  name: string;                      // field 2: Team Name
  signup_time?: number;              // field 3: TeamCreated At
  invite_id?: string;                // field 4: Invite CodeID
  used_trial: boolean;               // field 5: whetherUsedtrial
  stripe_subscription_id?: string;   // field 6: StripeSubscriptionID
  subscription_active: boolean;      // field 7: Subscriptionwhetheractivate
  stripe_customer_id?: string;       // field 8: StripecustomerID
  current_billing_period_start?: number; // field 9: Billing CyclestartTime
  num_seats_current_billing_period: number; // field 10: CurrentBilling CycleSeatcount
  attribution_enabled: boolean;      // field 11: whetherEnableattribution
  sso_provider_id?: string;          // field 12: SSOproviderID
  offers_enabled: boolean;           // field 13: whetherEnableoptimal惠
  teams_tier: number;                // field 14: TeamsTier (1=Teams,2=Pro,3=Enterprise...)
  flex_credit_quota: number;         // field 15: FlexCreditsQuota
  used_flow_credits: number;         // field 16: UsedFlowCredits
  used_prompt_credits: number;       // field 17: UsedPromptCredits
  current_billing_period_end?: number; // field 18: Billing CycleendTime
  num_cascade_seats: number;         // field 19: CascadeSeatcount
  cascade_usage_month_start?: number; // field 20: Cascadeusemonthstart
  cascade_usage_month_end?: number;   // field 21: Cascadeusemonthend
  cascade_seat_type: number;         // field 22: CascadeSeatTypeenum
  top_up_enabled: boolean;           // field 23: whetherEnableRecharge
  monthly_top_up_amount: number;     // field 24: monthlyRechargeamount
  top_up_spent: number;              // field 25: already 花费Recharge
  top_up_increment: number;          // field 26: Recharge增量
  used_flex_credits: number;         // field 27: UsedFlexCredits
  num_users: number;                 // Team MembersCount
}

/**
 * PlanInfo (codeium_common_pb.PlanInfo)
 * corresponds to backend PlanInfo struct
 */
export interface PlanInfo {
  teams_tier: number;                // field 1: TeamsTierenum
  plan_name: string;                 // field 2: PlanName (e.g. "Teams")
  has_autocomplete_fast_mode: boolean;  // field 3: quickautoautocomplete
  allow_sticky_premium_models: boolean; // field 4: allowuseAdvancedmodel
  has_forge_access: boolean;         // field 5: ForgeaccessPermission
  max_num_premium_chat_messages: number; // field 6: MaxAdvancedchatdaysMessages
  max_num_chat_input_tokens: number;    // field 7: Maxchatdaysinputtokens
  max_custom_chat_instruction_characters: number; // field 8: Maxcustom指令character
  max_num_pinned_context_items: number;  // field 9: Maxfixedonundertextitemcount
  max_local_index_size: number;      // field 10: Maxlocal索quotesize
  disable_code_snippet_telemetry: boolean; // field 11: Disablecodecode片segmenttelemetry
  monthly_prompt_credits: number;    // field 12: monthlyPromptCredits
  monthly_flow_credits: number;      // field 13: monthlyFlowCredits
  monthly_flex_credit_purchase_amount: number; // field 14: monthlyFlexCredits购买Quota
  allow_premium_command_models: boolean; // field 15: allowAdvancedcommandmodel
  is_enterprise: boolean;            // field 16: whetherEnterprise
  is_teams: boolean;                 // field 17: whetherTeam
  can_buy_more_credits: boolean;     // field 18: whethercan购买moremultipleCredits
  cascade_web_search_enabled: boolean; // field 19: CascadenetworkSearch
  can_customize_app_icon: boolean;   // field 20: cancustomapplyicon
  cascade_can_auto_run_commands: boolean; // field 22: Cascadecanautoruncommand
  has_tab_to_jump: boolean;          // field 23: TabredirectFeature
  can_generate_commit_messages: boolean; // field 25: cangenerateSubmitmessage
  max_unclaimed_sites: number;       // field 26: Maxnot认领站pointcount
  knowledge_base_enabled: boolean;   // field 27: Knowledge BaseFeature
  can_share_conversations: boolean;  // field 28: cansharedialog
  can_allow_cascade_in_background: boolean; // field 29: allowCascadeafter台run
  browser_enabled: boolean;          // field 31: browserFeature
}

/**
 * UserRoleInfo (seat_management_pb.UserRole)
 * corresponds to backend UserRole struct
 */
export interface UserRole {
  api_key: string;           // field 1: API Key
  roles: string[];           // field 2: RoleList
  role_id: string;           // field 3: RoleID (e.g. "root.admin")
  role_name: string;         // field 4: RoleName (e.g. "Admin")
}

/**
 * SubscriptionInfo
 * corresponds to backend SubscriptionInfo struct
 */
export interface SubscriptionInfo {
  id: string;
  email: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  seats: number;
  usage: number;
  quota: number;
  used_quota: number;
  expires_at?: number;       // UnixTimetimestamp（seconds）
  subscription_active: boolean;
  on_trial: boolean;
}

/**
 * GetCurrentUser API completeresponse
 * corresponds to backend UserInfo struct
 */
export interface UserDetails {
  user: UserBasicInfo;
  roles?: string;                    // Rolestring (e.g. "root.admin")
  subscription?: SubscriptionInfo;
  plan?: PlanInfo;
  role?: UserRole;                   // RoleDetails
  admin?: UserRole;                  // compatibleoldcodecode
  is_root_admin: boolean;
  team?: TeamInfo;
  permissions?: any;                 // Permissionforobject
  plan_features?: any;               // Featureconfig
}

// ============================================================
// enumtype定义
// ============================================================

/**
 * Teamhierarchyenum (codeium_common_pb.TeamsTier)
 */
export enum TeamsTier {
  UNSPECIFIED = 0,
  TEAMS = 1,
  PRO = 2,
  ENTERPRISE_SAAS = 3,
  HYBRID = 4,
  ENTERPRISE_SELF_HOSTED = 5,
  WAITLIST_PRO = 6,
  TEAMS_ULTIMATE = 7,
  PRO_ULTIMATE = 8,
  TRIAL = 9,
  ENTERPRISE_SELF_SERVE = 10
}

/**
 * UserTeamStatusenum (codeium_common_pb.UserTeamStatus)
 */
export enum UserTeamStatus {
  UNSPECIFIED = 0,
  PENDING = 1,
  APPROVED = 2,
  REJECTED = 3
}

/**
 * CascadeSeattypeenum (seat_management_pb.CascadeSeatType)
 */
export enum CascadeSeatType {
  UNSPECIFIED = 0,
  ENTRY = 1,
  STANDARD = 2
}

export type AccountStatus = 'active' | 'inactive' | { error: string };

export interface Settings {
  auto_refresh_token: boolean;
  seat_count_options: number[];
  retry_times: number;
  theme: string;
  concurrent_limit: number;
  show_seats_result_dialog: boolean;  // whetherdisplayseatUpdateresultDialog
  autoOpenPaymentLinkInWebview?: boolean;  // whetherautoinbuilt-inbrowser opened inpaymentlink
  autoFillPaymentForm?: boolean;  // whetherautofill inpaymentform
  autoSubmitPaymentForm?: boolean;  // whetherautoSubmitpaymentform
  paymentPageDelay?: number;  // paymentPageLoadingdelay（seconds）
  showVirtualCardInfo?: boolean;  // whetherdisplayVirtual CardInfodialog
  customCardBin?: string;  // customcard header（4-12-digit number）
  customCardBinRange?: string;  // card range（e.g. 626200-626300）
  cardBindRetryTimes?: number;  // bind cardfailedretry count
  testModeEnabled?: boolean;  // testMode：autocollectsuccessfulcardBIN
  useLocalSuccessBins?: boolean;  // uselocalsuccessfulBINpool
  testModeLastBin?: string | null;  // testModeunderontimeuseBIN（used fororderiterate）
  seamlessSwitchEnabled?: boolean;  // whetherEnableSeamless Switch
  windsurfClientType?: 'windsurf' | 'windsurf-next';  // Clienttype
  windsurfPath?: string | null;  // WindsurfInstall Path
  patchBackupPath?: string | null;  // patchbackupfilepath
  autoOpenBrowser?: boolean;  // whetherautoopenbrowser
  browserMode?: 'incognito' | 'normal';  // browserMode
  privacyMode?: boolean;  // privacyMode，hideEmailAddress
  unlimitedConcurrentRefresh?: boolean;  // Auto RefreshTokenwhennotlimitconcurrentcount
  proxyEnabled?: boolean;  // whetherEnableProxy
  proxyUrl?: string | null;  // ProxyAddress (e.g. http://127.0.0.1:7890)
  useLightweightApi?: boolean;  // uselightweightlevelAPI(GetPlanStatus)fetchQuotaInfo
  subscriptionPlan?: number;  // Subscriptionplan: 0=Free, 1=Teams, 2=Pro, 3=Enterprise SaaS, 4=Hybrid, 5=Enterprise Self-Hosted, 6=Waitlist Pro, 7=Teams Ultimate, 8=Pro Ultimate, 9=Trial, 10=Enterprise Self-Serve, 11=Enterprise SaaS Pooled, 12=Devin Enterprise, 14=Devin Teams, 15=Devin Teams V2, 16=Devin Pro, 17=Devin Max, 18=Max, 19=Devin Free, 20=Devin Trial
  paymentPeriod?: number;  // Payment Period: 1=Monthly, 2=Annually
  startTrial?: boolean;  // whethertotrialmethodstartSubscription
  teamName?: string;  // Teams planTeam Name
  seatCount?: number;  // Teams planSeatCount
}

/**
 * globalTags定义（withdefaultcolor）
 */
export interface GlobalTag {
  name: string;
  color: string; // defaultcolor，RGBA or HEXformat
}

export interface OperationLog {
  id: string;
  timestamp: string;
  account_id?: string;
  account_email?: string;
  operation_type: OperationType;
  status: OperationStatus;
  message: string;
  details?: any;
}

export type OperationType = 
  | 'login'
  | 'refresh_token'
  | 'reset_credits'
  | 'update_seats'
  | 'get_billing'
  | 'update_plan'
  | 'add_account'
  | 'delete_account'
  | 'edit_account'
  | 'batch_operation';

export type OperationStatus = 'success' | 'failed' | 'pending' | 'processing';

export interface UpdateSeatsResult {
  success: boolean;
  attempts: AttemptResult[];
}

export interface AttemptResult {
  attempt: number;
  status_code?: number;
  raw_response?: string;
  error?: string;
  timestamp: string;
}

export interface BillingInfo {
  success: boolean;
  status_code?: number;
  raw_response?: string;
  error?: string;
  timestamp: string;
}

export interface BatchResult {
  results: Array<{
    id: string;
    success: boolean;
    data?: any;
    error?: string;
  }>;
  success_count?: number;
  total_count?: number;
}
