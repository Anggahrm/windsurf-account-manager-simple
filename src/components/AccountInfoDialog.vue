<template>
  <el-dialog
    v-model="visible"
    title="Account Info"
    width="1000px"
    class="account-info-dialog"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="32"><Loading /></el-icon>
      <p>fetchingAccount Info...</p>
    </div>
    
    <div v-else-if="accountInfo" class="dialog-content">
      <el-tabs class="custom-tabs" v-model="activeInfoTab" @tab-change="onInfoTabChange">
        <!-- UserDetailsPage -->
        <el-tab-pane label="UserDetails" name="user-details">
          <template #label>
            <span class="tab-label"><el-icon><User /></el-icon> UserDetails</span>
          </template>
          
          <div v-if="loadingUserDetails" class="loading-container">
            <el-icon class="is-loading" size="24"><Loading /></el-icon>
            <p>LoadingUserDetails...</p>
          </div>
          
          <div v-else-if="!userDetails" class="empty-container">
            <el-empty description="NoneUserDetailsdata" :image-size="100">
              <el-button @click="loadUserDetails" type="primary" size="small">re-Loading</el-button>
            </el-empty>
          </div>
          
          <div v-else class="details-container">
            <!-- Userheadercard -->
            <div class="profile-header" :class="`plan-${(userDetails.plan?.plan_name || 'free').toLowerCase()}`">
              <div class="header-bg-icon"><el-icon><Avatar /></el-icon></div>
              <div class="profile-main">
                <div class="avatar-wrapper">
                  <div class="avatar-placeholder">{{ userDetails.user?.name?.charAt(0).toUpperCase() || 'U' }}</div>
                  <div class="status-dot" :class="userDetails.subscription?.subscription_active ? 'active' : 'inactive'"></div>
                </div>
                <div class="profile-info">
                  <div class="name-row">
                    <h3 class="user-name">{{ userDetails.user?.name || 'UnknownUser' }}</h3>
                    <el-tag size="small" :type="userDetails.is_root_admin ? 'danger' : 'info'" effect="dark" round>
                      {{ userDetails.role?.role_name || (userDetails.is_root_admin ? 'Root Admin' : 'Member') }}
                    </el-tag>
                  </div>
                  <div class="email-row">
                    <span class="email">{{ displayEmail(userDetails.user?.email) }}</span>
                    <el-tooltip content="Copy email"><el-icon class="copy-icon" @click="copyText(userDetails.user?.email)"><CopyDocument /></el-icon></el-tooltip>
                  </div>
                  <div class="meta-row">
                    <span class="meta-item" v-if="userDetails.user?.username"><el-icon><User /></el-icon> @{{ userDetails.user.username }}</span>
                    <span class="meta-item" v-if="userDetails.user?.timezone"><el-icon><Location /></el-icon> {{ userDetails.user.timezone }}</span>
                    <span class="meta-item" v-if="userDetails.roles"><el-icon><Key /></el-icon> {{ userDetails.roles }}</span>
                  </div>
                </div>
              </div>
              <div class="profile-plan-badge" v-if="userDetails.plan?.plan_name">
                <el-icon><Trophy /></el-icon> {{ formatPlanName(userDetails.plan.plan_name) }}
              </div>
              <!-- Subscription ExpiresTimeTags -->
              <div class="profile-expire-badge" v-if="userDetails.team?.current_billing_period_end">
                <el-icon><Calendar /></el-icon>
                <span class="expire-text">{{ formatTimestamp(userDetails.team.current_billing_period_end) }}</span>
                <span class="expire-countdown-tag" :class="getExpireClass(userDetails.team.current_billing_period_end)">
                  {{ getExpireCountdown(userDetails.team.current_billing_period_end) }}
                </span>
              </div>
            </div>

            <!-- primarylayout：basicInfo + SubscriptionPlan -->
            <div class="main-info-layout">
              <!-- left side：basicInfotable -->
              <div class="info-card basic-info-card">
                <div class="card-title"><el-icon><Postcard /></el-icon> basicInfo</div>
                <table class="basic-info-table">
                  <tbody>
                    <tr v-if="userDetails.user?.api_key">
                      <td class="label-cell">UserID</td>
                      <td class="value-cell">{{ userDetails.user.api_key }}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Name</td>
                      <td class="value-cell">{{ userDetails.user?.name || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Email</td>
                      <td class="value-cell">{{ displayEmail(userDetails.user?.email) }}</td>
                    </tr>
                    <tr v-if="userDetails.user?.id">
                      <td class="label-cell">Firebase UID</td>
                      <td class="value-cell text-muted">{{ userDetails.user.id }}</td>
                    </tr>
                    <tr v-if="userDetails.user?.username">
                      <td class="label-cell">Team</td>
                      <td class="value-cell">
                        <el-tag size="small" type="info" effect="plain">{{ userDetails.user.username }}</el-tag>
                      </td>
                    </tr>
                    <tr v-if="userDetails.user?.timezone">
                      <td class="label-cell">timezone</td>
                      <td class="value-cell">{{ userDetails.user.timezone }}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Registration Time</td>
                      <td class="value-cell text-primary">{{ formatDateTime(userDetails.user?.signup_time) }}</td>
                    </tr>
                    <tr v-if="userDetails.user?.last_update_time">
                      <td class="label-cell">Last Updated</td>
                      <td class="value-cell text-primary">{{ formatDateTime(userDetails.user.last_update_time) }}</td>
                    </tr>
                    <tr v-if="userDetails.user?.windsurf_pro_trial_end_time">
                      <td class="label-cell">trialend</td>
                      <td class="value-cell text-warning">{{ formatDateTime(userDetails.user.windsurf_pro_trial_end_time) }}</td>
                    </tr>
                    <tr v-if="userDetails.user?.referral_code">
                      <td class="label-cell">Referral Code</td>
                      <td class="value-cell">
                        {{ userDetails.user.referral_code }}
                        <el-tooltip content="Copyreferral link">
                          <el-icon class="copy-btn" @click="copyReferralLink(userDetails.user.referral_code)"><Link /></el-icon>
                        </el-tooltip>
                      </td>
                    </tr>
                    <tr>
                      <td class="label-cell">Subscription status</td>
                      <td class="value-cell">
                        <el-tag size="small" :type="getTeamsTierType(subscriptionTier)" effect="plain">{{ formatTeamsTier(subscriptionTier) }}</el-tag>
                        <el-tag size="small" :type="isSubscriptionActive ? 'success' : 'info'" effect="plain" style="margin-left: 4px;">
                          {{ isSubscriptionActive ? 'Active' : 'Inactive' }}
                        </el-tag>
                      </td>
                    </tr>
                    <tr v-if="userDetails.team?.stripe_subscription_id">
                      <td class="label-cell">StripeSubscriptionID</td>
                      <td class="value-cell text-muted">{{ userDetails.team.stripe_subscription_id }}</td>
                    </tr>
                    <tr v-if="userDetails.team?.stripe_customer_id">
                      <td class="label-cell">StripecustomerID</td>
                      <td class="value-cell text-muted">{{ userDetails.team.stripe_customer_id }}</td>
                    </tr>
                    <tr>
                      <td class="label-cell">Seat Count</td>
                      <td class="value-cell">
                        <span class="seat-count">{{ seatCount }}</span> Seat
                      </td>
                    </tr>
                    <tr v-if="userDetails.team?.current_billing_period_start">
                      <td class="label-cell">billingstart</td>
                      <td class="value-cell text-success">{{ formatTimestamp(userDetails.team.current_billing_period_start) }}</td>
                    </tr>
                    <tr v-if="userDetails.team?.current_billing_period_end">
                      <td class="label-cell">billingend</td>
                      <td class="value-cell text-warning">{{ formatTimestamp(userDetails.team.current_billing_period_end) }}</td>
                    </tr>
                    <tr v-if="userDetails.team?.cascade_usage_month_start">
                      <td class="label-cell">Cascademonthstart</td>
                      <td class="value-cell text-primary">{{ formatTimestamp(userDetails.team.cascade_usage_month_start) }}</td>
                    </tr>
                    <tr v-if="userDetails.team?.cascade_usage_month_end">
                      <td class="label-cell">Cascademonthend</td>
                      <td class="value-cell text-primary">{{ formatTimestamp(userDetails.team.cascade_usage_month_end) }}</td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- Usage/Quotabeautiful display -->
                <div class="quota-display-card">
                  <div class="quota-header">
                    <span class="quota-title">Usage / Quota</span>
                    <span class="quota-percentage" :class="getQuotaClass(quotaPercentage)">{{ quotaPercentage }}%</span>
                  </div>
                  <div class="quota-progress-wrap">
                    <div class="quota-progress-bar">
                      <div 
                        class="quota-progress-fill" 
                        :style="{ width: quotaPercentage + '%' }"
                        :class="getQuotaClass(quotaPercentage)"
                      ></div>
                    </div>
                  </div>
                  <div class="quota-details">
                    <div class="quota-used">
                      <span class="quota-label">Used</span>
                      <span class="quota-value">{{ formatCredits(totalUsedCredits) }}</span>
                    </div>
                    <div class="quota-divider">/</div>
                    <div class="quota-total">
                      <span class="quota-label">Total Quota</span>
                      <span class="quota-value">{{ formatCredits(totalQuotaCredits) }}</span>
                    </div>
                  </div>
                </div>
                <!-- User Flags -->
                <div class="flag-tags-bottom" v-if="hasUserFlags">
                  <el-tag size="small" type="success" effect="plain" v-if="userDetails.user?.pro"><el-icon><Star /></el-icon> ProUser</el-tag>
                  <el-tag size="small" type="success" effect="plain" v-if="userDetails.user?.public_profile_enabled"><el-icon><View /></el-icon> public information</el-tag>
                  <el-tag size="small" type="info" effect="plain" v-if="userDetails.user?.newsletter"><el-icon><Message /></el-icon> Subscriptionemail</el-tag>
                  <el-tag size="small" type="warning" effect="plain" v-if="userDetails.user?.used_trial"><el-icon><Clock /></el-icon> Usedtrial</el-tag>
                  <el-tag size="small" type="danger" effect="plain" v-if="userDetails.user?.disable_codeium"><el-icon><Close /></el-icon> Disabled</el-tag>
                  <el-tag size="small" type="info" effect="plain" v-if="userDetails.user?.disabled_telemetry"><el-icon><Hide /></el-icon> Disabletelemetry</el-tag>
                </div>
              </div>

              <!-- right side：SubscriptionandPlan + Credits & Quota -->
              <div class="right-column">
                <!-- SubscriptionandPlan -->
                <div class="info-card plan-card-bg">
                  <div class="card-title"><el-icon><Trophy /></el-icon> SubscriptionandPlan</div>
                  <div class="card-content">
                    <div class="plan-badge">
                      <span class="plan-name">{{ formatTeamsTier(subscriptionTier) }}</span>
                      <div class="status-tags">
                        <el-tag v-if="isSubscriptionActive" type="success" size="small" effect="dark">Active</el-tag>
                        <el-tag v-else type="info" size="small" effect="dark">Inactive</el-tag>
                        <el-tag v-if="userDetails.plan?.is_teams" type="primary" size="small" effect="dark">Team</el-tag>
                        <el-tag v-if="userDetails.plan?.is_enterprise" type="danger" size="small" effect="dark">Enterprise</el-tag>
                      </div>
                    </div>
                    <!-- CreditsQuota -->
                    <div class="limits-grid compact">
                      <div class="limit-item">
                        <span class="limit-val">{{ formatCredits(userDetails.plan?.monthly_prompt_credits) }}</span>
                        <span class="limit-label">monthPromptCredits</span>
                      </div>
                      <div class="limit-item">
                        <span class="limit-val">{{ formatCredits(userDetails.plan?.monthly_flow_credits) }}</span>
                        <span class="limit-label">monthFlowCredits</span>
                      </div>
                      <div class="limit-item">
                        <span class="limit-val">{{ formatCredits(userDetails.plan?.monthly_flex_credit_purchase_amount) }}</span>
                        <span class="limit-label">monthFlexQuota</span>
                      </div>
                      <div class="limit-item">
                        <span class="limit-val">{{ userDetails.plan?.max_num_premium_chat_messages || 0 }}</span>
                        <span class="limit-label">Advancedchatdayscount</span>
                      </div>
                      <div class="limit-item" v-if="userDetails.plan?.max_num_chat_input_tokens">
                        <span class="limit-val">{{ formatLargeNumber(userDetails.plan.max_num_chat_input_tokens) }}</span>
                        <span class="limit-label">chatdaysTokens</span>
                      </div>
                    </div>
                    <!-- limitInfotable -->
                    <table class="plan-limits-table">
                      <tbody>
                        <tr>
                          <td class="label-cell">TeamSeat</td>
                          <td class="value-cell"><el-tag size="small" type="primary" effect="plain">{{ seatCount }} </el-tag></td>
                          <td class="label-cell">withwidthlimit</td>
                          <td class="value-cell">{{ formatCredits(userDetails.plan?.monthly_prompt_credits) }}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">Cache Limit</td>
                          <td class="value-cell">{{ formatCredits(userDetails.plan?.monthly_flow_credits) }}</td>
                          <td class="label-cell">storeQuota</td>
                          <td class="value-cell">{{ formatStorageSize(userDetails.plan?.max_num_chat_input_tokens) }}</td>
                        </tr>
                        <tr>
                          <td class="label-cell">APIlimit</td>
                          <td class="value-cell">{{ formatApiLimit(userDetails.plan?.max_num_premium_chat_messages) }}</td>
                          <td class="label-cell">timeoutTime</td>
                          <td class="value-cell">{{ userDetails.plan?.max_custom_chat_instruction_characters || 0 }} seconds</td>
                        </tr>
                      </tbody>
                    </table>
                    <!-- Featuretoggle -->
                    <div class="feature-switches compact" v-if="userDetails.plan">
                      <div class="feature-label">Featuretoggle</div>
                      <div class="feature-tags">
                        <el-tag size="small" :type="userDetails.plan.has_autocomplete_fast_mode ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.has_autocomplete_fast_mode" /><Close v-else /></el-icon> quickautocomplete
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.allow_sticky_premium_models ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.allow_sticky_premium_models" /><Close v-else /></el-icon> Advancedmodel
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.cascade_web_search_enabled ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.cascade_web_search_enabled" /><Close v-else /></el-icon> networkSearch
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.cascade_can_auto_run_commands ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.cascade_can_auto_run_commands" /><Close v-else /></el-icon> autocommand
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.has_tab_to_jump ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.has_tab_to_jump" /><Close v-else /></el-icon> Tabredirect
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.knowledge_base_enabled ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.knowledge_base_enabled" /><Close v-else /></el-icon> Knowledge Base
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.browser_enabled ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.browser_enabled" /><Close v-else /></el-icon> browser
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.can_share_conversations ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.can_share_conversations" /><Close v-else /></el-icon> sharedialog
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.can_buy_more_credits ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.can_buy_more_credits" /><Close v-else /></el-icon> Purchase Credits
                        </el-tag>
                        <el-tag size="small" :type="userDetails.plan.can_customize_app_icon ? 'success' : 'info'" effect="plain">
                          <el-icon><Check v-if="userDetails.plan.can_customize_app_icon" /><Close v-else /></el-icon> customicon
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Credits & Quota -->
                <div class="info-card" v-if="userDetails.plan || userDetails.team">
                  <div class="card-title"><el-icon><Coin /></el-icon> Credits & Quota</div>
                  <div class="card-content">
                    <div class="credits-grid compact">
                      <div class="credit-item">
                        <span class="credit-val">{{ formatCredits(remainingPromptCredits) }}</span>
                        <span class="credit-label">RemainingPrompt</span>
                      </div>
                      <div class="credit-item">
                        <span class="credit-val">{{ formatCredits(remainingFlowCredits) }}</span>
                        <span class="credit-label">RemainingFlow</span>
                      </div>
                      <div class="credit-item" v-if="userDetails.team?.flex_credit_quota">
                        <span class="credit-val">{{ formatCredits(remainingFlexCredits) }}</span>
                        <span class="credit-label">RemainingFlex</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TeamInfocard（movetoright side） -->
                <div class="info-card team-info-card" v-if="userDetails.team">
                  <div class="card-title"><el-icon><Connection /></el-icon> TeamInfo</div>
                  <div class="card-content">
                    <!-- TeamBasic Info -->
                    <div class="team-basic-info">
                      <div class="team-info-row">
                        <span class="info-label">Team Name</span>
                        <span class="info-value team-name">{{ userDetails.team?.name }}</span>
                      </div>
                      <div class="team-info-row" v-if="userDetails.team?.teams_tier">
                        <span class="info-label">Teamhierarchy</span>
                        <el-tag size="small" :type="getTeamsTierType(userDetails.team.teams_tier)" effect="dark">{{ formatTeamsTier(userDetails.team.teams_tier) }}</el-tag>
                      </div>
                    </div>
                    
                    <!-- IDInfoblock -->
                    <div class="id-info-section">
                      <div class="id-row" v-if="userDetails.team?.id">
                        <span class="id-label">TeamID</span>
                        <div class="id-value-wrap">
                          <code class="id-code" :title="userDetails.team.id">{{ userDetails.team.id }}</code>
                          <el-button size="small" :icon="CopyDocument" circle @click="copyText(userDetails.team.id)" />
                        </div>
                      </div>
                      <div class="id-row" v-if="userDetails.team?.invite_id">
                        <span class="id-label">Invite Code</span>
                        <div class="id-value-wrap">
                          <code class="id-code" :title="userDetails.team.invite_id">{{ userDetails.team.invite_id }}</code>
                          <el-button size="small" :icon="CopyDocument" circle @click="copyText(userDetails.team.invite_id)" />
                        </div>
                      </div>
                      <div class="id-row" v-if="userDetails.team?.stripe_customer_id">
                        <span class="id-label">Stripecustomer</span>
                        <div class="id-value-wrap">
                          <code class="id-code stripe" :title="userDetails.team.stripe_customer_id">{{ userDetails.team.stripe_customer_id }}</code>
                          <el-button size="small" :icon="CopyDocument" circle @click="copyText(userDetails.team.stripe_customer_id)" />
                        </div>
                      </div>
                      <div class="id-row" v-if="userDetails.team?.stripe_subscription_id">
                        <span class="id-label">StripeSubscription</span>
                        <div class="id-value-wrap">
                          <code class="id-code stripe" :title="userDetails.team.stripe_subscription_id">{{ userDetails.team.stripe_subscription_id }}</code>
                          <el-button size="small" :icon="CopyDocument" circle @click="copyText(userDetails.team.stripe_subscription_id)" />
                        </div>
                      </div>
                    </div>
                    
                    <!-- Statisticsdata -->
                    <div class="team-stats">
                      <div class="stat-box">
                        <span class="stat-number">{{ userDetails.team?.num_users || 1 }}</span>
                        <span class="stat-text">Member</span>
                      </div>
                      <div class="stat-box">
                        <span class="stat-number">{{ userDetails.team?.num_seats_current_billing_period || 1 }}</span>
                        <span class="stat-text">Seat</span>
                      </div>
                      <div class="stat-box" v-if="userDetails.team?.num_cascade_seats">
                        <span class="stat-number">{{ userDetails.team.num_cascade_seats }}</span>
                        <span class="stat-text">Cascade</span>
                      </div>
                    </div>
                    
                    <!-- Cascadecycle -->
                    <div class="cascade-period" v-if="userDetails.team?.cascade_usage_month_start || userDetails.team?.cascade_usage_month_end">
                      <div class="period-header">
                        <el-icon><Clock /></el-icon>
                        <span>Cascade usecycle</span>
                      </div>
                      <div class="period-dates">
                        <div class="period-date start">
                          <span class="date-label">start</span>
                          <span class="date-value">{{ formatTimestamp(userDetails.team?.cascade_usage_month_start) }}</span>
                        </div>
                        <el-icon class="period-arrow"><Right /></el-icon>
                        <div class="period-date end">
                          <span class="date-label">end</span>
                          <span class="date-value">{{ formatTimestamp(userDetails.team?.cascade_usage_month_end) }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Creditsusage info -->
                    <div class="credits-usage" v-if="userDetails.team?.used_prompt_credits || userDetails.team?.used_flow_credits">
                      <div class="usage-item" v-if="userDetails.team?.used_prompt_credits">
                        <span class="usage-label">UsedPrompt</span>
                        <span class="usage-value">{{ formatCredits(userDetails.team.used_prompt_credits) }}</span>
                      </div>
                      <div class="usage-item" v-if="userDetails.team?.used_flow_credits">
                        <span class="usage-label">UsedFlow</span>
                        <span class="usage-value">{{ formatCredits(userDetails.team.used_flow_credits) }}</span>
                      </div>
                      <div class="usage-item" v-if="userDetails.team?.used_flex_credits">
                        <span class="usage-label">UsedFlex</span>
                        <span class="usage-value">{{ formatCredits(userDetails.team.used_flex_credits) }}</span>
                      </div>
                    </div>
                    
                    <!-- Teamfeature标志 -->
                    <div class="team-flags" v-if="hasTeamFlags">
                      <el-tag size="small" type="success" effect="dark" round v-if="userDetails.team?.subscription_active"><el-icon><Check /></el-icon> Subscriptionactivate</el-tag>
                      <el-tag size="small" type="warning" effect="plain" round v-if="userDetails.team?.used_trial"><el-icon><Clock /></el-icon> Usedtrial</el-tag>
                      <el-tag size="small" type="primary" effect="plain" round v-if="userDetails.team?.attribution_enabled"><el-icon><DataAnalysis /></el-icon> attribution</el-tag>
                      <el-tag size="small" type="danger" effect="plain" round v-if="userDetails.team?.sso_provider_id"><el-icon><Lock /></el-icon> SSO</el-tag>
                      <el-tag size="small" type="info" effect="plain" round v-if="userDetails.team?.top_up_enabled"><el-icon><Coin /></el-icon> Recharge</el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- RoleandPermissioncard（movetoleft sidebasicInfounderside，independentonerow） -->
            <div class="role-permission-section" v-if="userDetails.role || userDetails.permissions">
              <div class="info-card">
                <div class="card-title"><el-icon><Key /></el-icon> RoleandPermission</div>
                <div class="card-content role-content">
                  <div class="role-info-row">
                    <div class="info-item" v-if="userDetails.role?.role_id">
                      <span class="label">Role ID</span>
                      <span class="value">{{ userDetails.role.role_id }}</span>
                    </div>
                    <div class="info-item" v-if="userDetails.role?.role_name">
                      <span class="label">RoleName</span>
                      <el-tag size="small" type="danger" effect="dark">{{ userDetails.role.role_name }}</el-tag>
                    </div>
                    <div class="info-item" v-if="userDetails.user?.team_status !== undefined">
                      <span class="label">TeamStatus</span>
                      <el-tag size="small" :type="getTeamStatusType(userDetails.user.team_status)">{{ formatTeamStatus(userDetails.user.team_status) }}</el-tag>
                    </div>
                  </div>
                  <!-- Permissionchartcanview -->
                  <div class="permission-visual" v-if="userDetails.permissions">
                    <div class="perm-label">Permissionchart ({{ getPermissionCount(userDetails.permissions) }}/31)</div>
                    <div class="perm-dots">
                      <el-tooltip v-for="i in 31" :key="i" :content="`Permission ${i}: ${hasPermission(userDetails.permissions, i) ? 'already grant' : 'notgrant'}`">
                        <span class="perm-dot" :class="{ active: hasPermission(userDetails.permissions, i) }"></span>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- originaldatacollapse -->
            <el-collapse v-if="parsedData" class="raw-data-collapse">
              <el-collapse-item title="developeroriginaldata">
                <pre class="raw-data">{{ JSON.stringify(parsedData, null, 2) }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>
        
        <!-- Local Info -->
        <el-tab-pane label="Local Info" name="local-info">
          <template #label>
            <span class="tab-label"><el-icon><Monitor /></el-icon> Local Info</span>
          </template>
          
          <div class="local-info-container">
            <table class="local-info-table">
              <tbody>
                <tr>
                  <td class="label-cell">AccountID</td>
                  <td class="value-cell">{{ accountInfo.local_info?.id }}</td>
                </tr>
                <tr>
                  <td class="label-cell">Email</td>
                  <td class="value-cell">{{ displayEmail(accountInfo.local_info?.email) }}</td>
                </tr>
                <tr>
                  <td class="label-cell">Nickname</td>
                  <td class="value-cell">{{ accountInfo.local_info?.nickname || '-' }}</td>
                </tr>
                <tr>
                  <td class="label-cell">Group</td>
                  <td class="value-cell">
                    <el-tag size="small" type="primary" effect="plain">{{ accountInfo.local_info?.group || 'Default Group' }}</el-tag>
                  </td>
                </tr>
                <tr>
                  <td class="label-cell">Tags</td>
                  <td class="value-cell">
                    <template v-if="accountInfo.local_info?.tags?.length">
                      <el-tag v-for="tag in accountInfo.local_info.tags" :key="tag" size="small" type="info" effect="plain" style="margin-right: 4px;">{{ tag }}</el-tag>
                    </template>
                    <span v-else class="empty-text">no</span>
                  </td>
                </tr>
                <tr>
                  <td class="label-cell">Created At</td>
                  <td class="value-cell">{{ formatDate(accountInfo.local_info?.created_at) || '-' }}</td>
                </tr>
                <tr>
                  <td class="label-cell">lastLogin</td>
                  <td class="value-cell">{{ formatDate(accountInfo.local_info?.last_login_at) || '-' }}</td>
                </tr>
                <tr>
                  <td class="label-cell">Token ExpiresTime</td>
                  <td class="value-cell">{{ formatDate(accountInfo.local_info?.token_expires_at) || '-' }}</td>
                </tr>
                <tr>
                  <td class="label-cell">lastSeat Count</td>
                  <td class="value-cell">{{ accountInfo.local_info?.last_seat_count ?? '-' }}</td>
                </tr>
                <tr>
                  <td class="label-cell">Status</td>
                  <td class="value-cell">
                    <el-tag :type="accountInfo.local_info?.status === 'active' ? 'success' : (accountInfo.local_info?.status === 'error' ? 'danger' : 'info')" size="small" effect="plain">
                      {{ accountInfo.local_info?.status }}
                    </el-tag>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>
        
        <!-- FirebaseInfo -->
        <el-tab-pane label="Firebase" name="firebase" v-if="accountInfo.firebase_info">
          <template #label>
            <span class="tab-label"><el-icon><Key /></el-icon> FirebaseInfo</span>
          </template>
          
          <div class="firebase-container">
            <!-- UseridentityInfocard -->
            <div class="info-card wide">
              <div class="card-title">
                <el-icon color="#409eff"><User /></el-icon>
                <span>UseridentityInfo</span>
                <div class="header-tags">
                  <el-tag v-if="accountInfo.firebase_info?.emailVerified ?? accountInfo.firebase_info?.email_verified" type="success" size="small" effect="plain">
                    <el-icon><Check /></el-icon> Verified
                  </el-tag>
                  <el-tag v-else type="warning" size="small" effect="plain">Unverified</el-tag>
                </div>
              </div>
              <div class="card-content">
                <div class="firebase-info-grid">
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">Firebase UID</span>
                      <span class="value text-ellipsis" :title="firebaseUid">{{ firebaseUid }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">Email</span>
                      <span class="value">{{ displayEmail(accountInfo.firebase_info?.email) }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">displayName</span>
                      <span class="value">{{ accountInfo.firebase_info?.displayName || accountInfo.firebase_info?.display_name || '-' }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">EmailVerifyStatus</span>
                      <span class="value">
                        <el-tag size="small" :type="(accountInfo.firebase_info?.emailVerified ?? accountInfo.firebase_info?.email_verified) ? 'success' : 'warning'" effect="plain">
                          {{ (accountInfo.firebase_info?.emailVerified ?? accountInfo.firebase_info?.email_verified) ? 'Verified' : 'Unverified' }}
                        </el-tag>
                      </span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">AccountStatus</span>
                      <span class="value">
                        <el-tag size="small" :type="accountInfo.firebase_info?.disabled ? 'danger' : 'success'" effect="plain">
                          {{ accountInfo.firebase_info?.disabled ? 'Disabled' : 'Normal' }}
                        </el-tag>
                      </span>
                    </div>
                    <div class="info-cell">
                      <span class="label">Expirystart</span>
                      <span class="value">{{ formatFirebaseTimestamp(accountInfo.firebase_info?.validSince || accountInfo.firebase_info?.valid_since) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- TimeInfocard -->
            <div class="info-card wide timeline-card">
              <div class="card-title"><el-icon color="#409eff"><Clock /></el-icon> TimeInfo</div>
              <div class="horizontal-timeline four-items">
                <div class="timeline-item">
                  <div class="timeline-dot dot-blue"><el-icon><UserFilled /></el-icon></div>
                  <div class="timeline-content">
                    <div class="timeline-title">Accountcreate</div>
                    <div class="timeline-time">{{ formatFirebaseTimestamp(accountInfo.firebase_info?.createdAt || accountInfo.firebase_info?.created_at) }}</div>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot dot-orange"><el-icon><Key /></el-icon></div>
                  <div class="timeline-content">
                    <div class="timeline-title">PasswordUpdate</div>
                    <div class="timeline-time">{{ formatFirebaseTimestamp(accountInfo.firebase_info?.passwordUpdatedAt || accountInfo.firebase_info?.password_updated_at) }}</div>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot dot-green"><el-icon><Check /></el-icon></div>
                  <div class="timeline-content">
                    <div class="timeline-title">lastLogin</div>
                    <div class="timeline-time">{{ formatFirebaseTimestamp(accountInfo.firebase_info?.lastLoginAt || accountInfo.firebase_info?.last_login_at) }}</div>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-dot dot-gray"><el-icon><Refresh /></el-icon></div>
                  <div class="timeline-content">
                    <div class="timeline-title">lastRefresh</div>
                    <div class="timeline-time">{{ formatFirebaseTimestamp(accountInfo.firebase_info?.lastRefreshAt || accountInfo.firebase_info?.last_refresh_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- authprovidercard -->
            <div class="info-card wide" v-if="(accountInfo.firebase_info?.providerUserInfo || accountInfo.firebase_info?.provider_user_info)?.length">
              <div class="card-title"><el-icon color="#409eff"><Link /></el-icon> authprovider</div>
              <div class="card-content" v-for="(provider, idx) in (accountInfo.firebase_info.providerUserInfo || accountInfo.firebase_info.provider_user_info)" :key="idx">
                <div class="firebase-info-grid">
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">provider ID</span>
                      <span class="value">
                        <el-tag size="small" type="info" effect="plain">{{ formatProviderName(provider.providerId || provider.provider_id) }}</el-tag>
                      </span>
                    </div>
                    <div class="info-cell">
                      <span class="label">User ID</span>
                      <span class="value">{{ provider.rawId || provider.raw_id || displayEmail(provider.email) }}</span>
                    </div>
                  </div>
                  <div class="info-row">
                    <div class="info-cell">
                      <span class="label">federal ID</span>
                      <span class="value text-ellipsis">{{ provider.federatedId || provider.federated_id || displayEmail(provider.email) }}</span>
                    </div>
                    <div class="info-cell">
                      <span class="label">Email</span>
                      <span class="value">{{ displayEmail(provider.email) }}</span>
                    </div>
                  </div>
                  <div class="info-row" v-if="provider.displayName || provider.display_name">
                    <div class="info-cell full-width">
                      <span class="label">displayName</span>
                      <span class="value">{{ provider.displayName || provider.display_name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- ViewFirebaseoriginaldata -->
            <el-collapse class="raw-data-collapse">
              <el-collapse-item>
                <template #title>
                  <span class="collapse-title">ViewFirebaseoriginaldata</span>
                  <el-icon class="collapse-arrow"><Right /></el-icon>
                </template>
                <pre class="raw-json">{{ JSON.stringify(accountInfo.firebase_info, null, 2) }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>

        <!-- APIKey Management -->
        <el-tab-pane label="APISecret Key" name="api-keys">
          <template #label>
            <span class="tab-label"><el-icon><Key /></el-icon> APISecret Key</span>
          </template>

          <div class="api-keys-container">
            <div class="api-keys-header">
              <div class="header-info">
                <el-icon :size="28" color="#8b5cf6"><Key /></el-icon>
                <div>
                  <h3>API Key Management</h3>
                  <p>Managementyou sk-ws-01 format API Secret Key，used for Language Server auth</p>
                </div>
              </div>
              <div class="header-actions">
                <el-button type="primary" @click="generateNewApiKey" :loading="generatingApiKey">
                  <el-icon><Plus /></el-icon> generatenewSecret Key
                </el-button>
                <el-button text type="primary" @click="loadApiKeys" :loading="loadingApiKeys">
                  <el-icon><Refresh /></el-icon> Refresh
                </el-button>
              </div>
            </div>

            <!-- Devin Accountexclusive：top稳定show「Currentsession API Key」（do not call API，directlyreadlocal session_token） -->
            <div v-if="isDevinAccount && devinSessionApiKey" class="current-api-key-block devin">
              <div class="current-api-key-header">
                <el-icon :size="20" color="#10b981"><Key /></el-icon>
                <span class="current-api-key-title">Currentsession API Key</span>
                <el-tag type="success" size="small" effect="plain">Devin</el-tag>
              </div>
              <p class="current-api-key-desc">
                Devin Accountuse <code>devin-session-token$</code> prefixed session_token makeas API Key，candirectlyCopyto Windsurf IDE use。e.g.needRefresh session_token，pleaseinAccountcardonuse「Refresh Token」button。
              </p>
              <div class="current-api-key-display">
                <code class="current-api-key-code">{{ devinSessionApiKey }}</code>
                <el-button type="primary" size="small" @click="copyText(devinSessionApiKey)">
                  <el-icon><CopyDocument /></el-icon> Copy
                </el-button>
              </div>
            </div>

            <div v-if="loadingApiKeys" class="loading-container">
              <el-icon class="is-loading" size="24"><Loading /></el-icon>
              <p>LoadingAPISecret Key...</p>
            </div>

            <div v-else-if="apiKeys.length === 0 && !isDevinAccount" class="empty-container">
              <el-empty description="NoneAPISecret Key" :image-size="80">
                <el-button @click="loadApiKeys" type="primary" size="small">re-Loading</el-button>
              </el-empty>
            </div>

            <div v-else class="api-keys-list">
              <div class="api-key-item" v-for="key in apiKeys" :key="key.key_id">
                <div class="key-info">
                  <div class="key-display">
                    <code>{{ key.key_for_display || key.key_id }}</code>
                  </div>
                  <div class="key-meta">
                    <span v-if="key.created_at"><el-icon><Clock /></el-icon> create: {{ formatTimestampSeconds(key.created_at) }}</span>
                    <span v-if="key.last_used_at"><el-icon><Timer /></el-icon> lastuse: {{ formatTimestampSeconds(key.last_used_at) }}</span>
                  </div>
                </div>
                <div class="key-actions">
                  <el-button type="primary" size="small" @click="copyText(key.key_id)" plain>
                    <el-icon><CopyDocument /></el-icon> Copy
                  </el-button>
                  <el-popconfirm
                    title="Confirmneed toDeletethisAPISecret Key?？Deleteafterwillnowayrestore！"
                    confirm-button-text="Confirm Delete"
                    cancel-button-text="Cancel"
                    @confirm="deleteApiKey(key.key_id)"
                  >
                    <template #reference>
                      <el-button type="danger" size="small" :loading="deletingKeyId === key.key_id">
                        <el-icon><Delete /></el-icon> Delete
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>

            <div class="api-keys-tip">
              <el-alert type="warning" :closable="false" show-icon>
                <template #title>
                  <strong>note</strong>
                </template>
                DeleteAPISecret Keyafter，usetheSecret Keyallapplywillnocannot continueaccessservice。pleasecarefulOperation。
              </el-alert>
            </div>

            <!-- migrateAPI KeyFeature -->
            <el-divider content-position="left">migrate API Key</el-divider>
            <div class="migrate-api-key-section">
              <p class="section-desc">willalready has sk-ws-01 format API Key migratetonewsessionToken</p>
              <div class="migrate-input-row">
                <el-input
                  v-model="migrateApiKeyInput"
                  placeholder="Please enterneed tomigrateAPI Key (sk-ws-01-...)"
                  clearable
                  style="flex: 1;"
                />
                <el-button type="primary" @click="handleMigrateApiKey" :loading="migratingApiKey" :disabled="!migrateApiKeyInput">
                  migrate
                </el-button>
              </div>
              <div v-if="migrateResult" class="migrate-result">
                <el-alert v-if="migrateResult.success" type="success" :closable="false" show-icon>
                  <template #title>migratesuccessful</template>
                  <div class="result-content">
                    <p><strong>Session Token:</strong></p>
                    <code>{{ migrateResult.session_token }}</code>
                    <el-button size="small" @click="copyText(migrateResult.session_token)" style="margin-left: 8px;">
                      <el-icon><CopyDocument /></el-icon> Copy
                    </el-button>
                  </div>
                </el-alert>
                <el-alert v-else type="error" :closable="false" show-icon>
                  <template #title>Migration failed</template>
                  {{ migrateResult.error }}
                </el-alert>
              </div>
            </div>

            <!-- fetchfullballLeaderboard -->
            <el-divider content-position="left">modelLeaderboard</el-divider>
            <div class="leaderboard-section">
              <p class="section-desc">ViewWindsurfmodelscoreLeaderboard（ELOscoresystem）</p>
              <div class="migrate-input-row">
                <el-checkbox v-model="useCurrentAccountForLeaderboard">useCurrentAccountauth</el-checkbox>
                <el-button type="primary" @click="handleGetLeaderboard" :loading="gettingLeaderboard">
                  queryLeaderboard
                </el-button>
              </div>
              <div v-if="leaderboardData && leaderboardData.length > 0" class="leaderboard-table">
                <el-table :data="leaderboardData" stripe border style="width: 100%">
                  <el-table-column prop="model" label="model" width="200" />
                  <el-table-column prop="elo_rating" label="ELOscore" width="100" sortable />
                  <el-table-column prop="votes" label="Votes" width="100" sortable />
                  <el-table-column label="win rate" width="100">
                    <template #default="{ row }">
                      {{ (row.win_rate * 100).toFixed(1) }}%
                    </template>
                  </el-table-column>
                  <el-table-column label="speed" width="100">
                    <template #default="{ row }">
                      {{ row.model_speed.toFixed(2) }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-if="leaderboardError" class="migrate-result">
                <el-alert type="error" :closable="false" show-icon>
                  <template #title>Query failed</template>
                  {{ leaderboardError }}
                </el-alert>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- third-partyAPI Provider KeyManagement -->
        <el-tab-pane label="Provider Key" name="provider-keys">
          <template #label>
            <span class="tab-label"><el-icon><Connection /></el-icon> Provider Key</span>
          </template>

          <div class="provider-keys-container">
            <div class="provider-keys-header">
              <div class="header-info">
                <el-icon :size="28" color="#10b981"><Connection /></el-icon>
                <div>
                  <h3>third-party API Provider Key</h3>
                  <p>Managementyouthird-party AI servicemerchant API Secret Key（e.g. OpenAI、Anthropic etc.）</p>
                </div>
              </div>
              <div class="header-actions">
                <el-button type="primary" @click="showAddProviderKeyDialog = true">
                  <el-icon><Plus /></el-icon> AddSecret Key
                </el-button>
                <el-button text type="primary" @click="loadProviderKeys" :loading="loadingProviderKeys">
                  <el-icon><Refresh /></el-icon> Refresh
                </el-button>
              </div>
            </div>

            <div v-if="loadingProviderKeys" class="loading-container">
              <el-icon class="is-loading" size="24"><Loading /></el-icon>
              <p>LoadingProvider Keys...</p>
            </div>

            <div v-else-if="providerKeys.length === 0" class="empty-container">
              <el-empty description="NoneConfiguredProvider Key" :image-size="80">
                <el-button @click="showAddProviderKeyDialog = true" type="primary" size="small">AddProvider Key</el-button>
              </el-empty>
            </div>

            <div v-else class="provider-keys-list">
              <div class="provider-key-item" v-for="provider in providerKeys" :key="provider">
                <div class="provider-info">
                  <div class="provider-name">
                    <el-icon><Connection /></el-icon>
                    <span>{{ provider }}</span>
                  </div>
                  <div class="provider-status">
                    <el-tag type="success" size="small">Configured</el-tag>
                  </div>
                </div>
                <div class="provider-actions">
                  <el-popconfirm
                    title="Confirmneed toDeletethisProvider Key?？"
                    confirm-button-text="Confirm Delete"
                    cancel-button-text="Cancel"
                    @confirm="deleteProviderKey(provider)"
                  >
                    <template #reference>
                      <el-button type="danger" size="small" :loading="deletingProvider === provider">
                        <el-icon><Delete /></el-icon> Delete
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </div>

            <div class="provider-keys-tip">
              <el-alert type="info" :closable="false" show-icon>
                <template #title>
                  <strong>supportProvider</strong>
                </template>
                OpenAI、Anthropic、Google Gemini、XAI (Grok)、OpenRouter、Groq、Fireworks、Cerebras、Together AI、Azureetc.
              </el-alert>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-alert
        title="Failed to get account info"
        :description="error"
        type="error"
        show-icon
        :closable="false"
      />
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="refresh" :icon="Refresh" circle />
        <el-button @click="handleClose">disabled</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- newgenerateAPISecret KeydisplayDialog -->
  <el-dialog
    v-model="showNewApiKeyDialog"
    title="newAPISecret KeyGenerated"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-alert type="success" :closable="false" show-icon style="margin-bottom: 16px;">
      <template #title>
        <strong>pleaseimmediatelyCopy and SavethisSecret Key</strong>
      </template>
      thisSecret Keyonlywilldisplayonce，disabledafterwillnowayagaintimeViewcompleteSecret Key。
    </el-alert>

    <div class="new-api-key-display">
      <code class="api-key-code">{{ newGeneratedApiKey }}</code>
      <el-button type="primary" @click="copyText(newGeneratedApiKey)">
        <el-icon><CopyDocument /></el-icon> CopySecret Key
      </el-button>
    </div>

    <template #footer>
      <el-button type="primary" @click="showNewApiKeyDialog = false">Ialready SaveSecret Key</el-button>
    </template>
  </el-dialog>

  <!-- AddProvider KeyDialog -->
  <el-dialog
    v-model="showAddProviderKeyDialog"
    title="Addthird-party Provider Key"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-position="top">
      <el-form-item label="selectProvider">
        <el-select v-model="newProviderName" placeholder="Please selectProvider" style="width: 100%;">
          <el-option label="OpenAI" value="OPENAI" />
          <el-option label="Anthropic" value="ANTHROPIC" />
          <el-option label="Anthropic (BYOK)" value="ANTHROPIC_BYOK" />
          <el-option label="Google Gemini" value="GOOGLE_GEMINI" />
          <el-option label="XAI (Grok)" value="XAI" />
          <el-option label="XAI (BYOK)" value="XAI_BYOK" />
          <el-option label="OpenRouter" value="OPEN_ROUTER" />
          <el-option label="OpenRouter (BYOK)" value="OPEN_ROUTER_BYOK" />
          <el-option label="Groq" value="GROQ" />
          <el-option label="Fireworks" value="FIREWORKS" />
          <el-option label="Cerebras" value="CEREBRAS" />
          <el-option label="Together AI" value="TOGETHER_AI" />
          <el-option label="Azure (OpenAIcompatible)" value="AZURE" />
        </el-select>
      </el-form-item>
      <el-form-item label="API Key">
        <el-input
          v-model="newProviderApiKey"
          type="password"
          placeholder="Please enterProvider API Key"
          show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="showAddProviderKeyDialog = false">Cancel</el-button>
      <el-button type="primary" @click="addProviderKey" :loading="addingProviderKey" :disabled="!newProviderName || !newProviderApiKey">
        Add
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { 
  Loading, Refresh, Trophy, UserFilled, User, Clock, Key, 
  Check, Close, Link, Postcard, Connection, Coin, Monitor, CopyDocument,
  Avatar, Location, View, Message, Right, Star, Hide,
  DataAnalysis, Lock, Calendar, Timer, Delete, Plus
} from '@element-plus/icons-vue';
import { useUIStore, useSettingsStore } from '@/store';
import { useAccountsStore } from '@/store/modules/accounts';
import { apiService } from '@/api';
import { maskEmail } from '@/utils/privacy';
import dayjs from 'dayjs';

const uiStore = useUIStore();
const settingsStore = useSettingsStore();
const accountsStore = useAccountsStore();

// CurrentcurrentlyViewAccount（used forread auth_provider / token etc.backendnotcallbackfield）
const currentAccount = computed(() =>
  accountsStore.accounts.find((a) => a.id === uiStore.currentViewingAccountId)
);
// whether it is Devin Account
const isDevinAccount = computed(() => currentAccount.value?.auth_provider === 'devin');
// Devin AccountCurrent `devin-session-token$...` form API Key
// backendstore account.token thisbodyalready with「devin-session-token$」prefix（see auth_context.rs noterelease），beforesideoriginalsampleshowi.e.can
const devinSessionApiKey = computed(() =>
  isDevinAccount.value ? (currentAccount.value?.token || '') : ''
);

// Emaildesensitizehandle
function displayEmail(email: string | undefined | null): string {
  if (!email) return '-';
  if (settingsStore.settings?.privacyMode) {
    return maskEmail(email);
  }
  return email;
}

const visible = ref(false);
const loading = ref(false);
const accountInfo = ref<any>(null);
const error = ref('');
const userDetails = ref<any>(null);
const parsedData = ref<any>(null);
const loadingUserDetails = ref(false);

// APIKey Managementrelated
interface ApiKeyItem {
  key_id: string
  key_for_display: string
  created_at: number
  last_used_at: number
}
const apiKeys = ref<ApiKeyItem[]>([]);
const loadingApiKeys = ref(false);
const deletingKeyId = ref('');
const generatingApiKey = ref(false);
const newGeneratedApiKey = ref('');

// third-partyProvider KeyManagementrelated
const providerKeys = ref<string[]>([]);
const loadingProviderKeys = ref(false);
const deletingProvider = ref('');
const showAddProviderKeyDialog = ref(false);
const newProviderName = ref('');
const newProviderApiKey = ref('');
const addingProviderKey = ref(false);

// MigrateApiKeyrelated
const migrateApiKeyInput = ref('');
const migratingApiKey = ref(false);
const migrateResult = ref<any>(null);

// Leaderboardrelated
const useCurrentAccountForLeaderboard = ref(false);
const gettingLeaderboard = ref(false);
const leaderboardData = ref<any[]>([]);
const leaderboardError = ref('');

const showNewApiKeyDialog = ref(false);
const activeInfoTab = ref('user-details');

// TagspageSwitchwhenautoLoadingdata
function onInfoTabChange(tabName: string) {
  if (tabName === 'api-keys') {
    loadApiKeys();
  } else if (tabName === 'provider-keys') {
    loadProviderKeys();
  }
}

// listenDialogdisplayStatus
watch(() => uiStore.showAccountInfoDialog, (show) => {
  visible.value = show;
  if (show && uiStore.currentViewingAccountId) {
    loadAccountInfo();
    // delayLoadingUserDetails，ensureAccountInfofirstLoading
    setTimeout(() => {
      loadUserDetails();
    }, 500);
  }
});

watch(visible, (val) => {
  if (!val) {
    uiStore.closeAccountInfoDialog();
    accountInfo.value = null;
    userDetails.value = null;
    parsedData.value = null;
    activeInfoTab.value = 'user-details';
    apiKeys.value = [];
    error.value = '';
  }
});


async function loadAccountInfo() {
  if (!uiStore.currentViewingAccountId) return;
  
  loading.value = true;
  error.value = '';
  accountInfo.value = null;
  
  try {
    const result = await apiService.getAccountInfo(uiStore.currentViewingAccountId);
    if (result.success) {
      accountInfo.value = result;
    } else {
      error.value = result.error || 'fetchfailed';
    }
  } catch (err: any) {
    error.value = err.toString();
    ElMessage.error(`Failed to get account info: ${err}`);
  } finally {
    loading.value = false;
  }
}

// fetchUserdetailedInfo
async function loadUserDetails() {
  if (!uiStore.currentViewingAccountId) return;
  
  console.log('startfetchUserDetails, ID:', uiStore.currentViewingAccountId);
  
  loadingUserDetails.value = true;
  userDetails.value = null;
  parsedData.value = null;
  
  try {
    const result = await apiService.getCurrentUserParsed(uiStore.currentViewingAccountId);
    console.log('APIBackresult:', result);
    
    if (result && result.success && result.data) {
      userDetails.value = result.data;
      parsedData.value = result.parsed_data;
      console.log('UserDetailsSet:', userDetails.value);
    } else {
      console.warn('APIBackfailed or nohasdata:', result);
      // displayError Info
      if (result && result.error) {
        ElMessage.warning(`Failed to get user details: ${result.error}`);
      } else {
        console.log('notfetchtoUserDetailsdata');
      }
    }
  } catch (err: any) {
    console.error('Failed to get user details:', err);
    ElMessage.error(`Failed to get user details: ${err.message || err}`);
  } finally {
    loadingUserDetails.value = false;
  }
}

// ==================== API Key Management ====================

// LoadingAPISecret KeyList
async function loadApiKeys() {
  if (!uiStore.currentViewingAccountId) return;

  loadingApiKeys.value = true;
  try {
    const result = await invoke<any>('get_api_key_summary', {
      id: uiStore.currentViewingAccountId
    });
    if (result.success) {
      apiKeys.value = result.api_keys || [];
    } else {
      console.error('[loadApiKeys] Error:', result.error);
      ElMessage.error(`fetchAPISecret Keyfailed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[loadApiKeys] Exception:', error);
    ElMessage.error(`fetchAPISecret Keyfailed: ${error}`);
  } finally {
    loadingApiKeys.value = false;
  }
}

// DeleteAPISecret Key
async function deleteApiKey(keyId: string) {
  if (!uiStore.currentViewingAccountId) return;

  deletingKeyId.value = keyId;
  try {
    const result = await invoke<any>('delete_api_key', {
      id: uiStore.currentViewingAccountId,
      keyId: keyId
    });
    if (result.success) {
      ElMessage.success(result.message || 'Secret KeyDeleted');
      await loadApiKeys();
    } else {
      ElMessage.error(`Delete failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[deleteApiKey] Exception:', error);
    ElMessage.error(`Delete failed: ${error}`);
  } finally {
    deletingKeyId.value = '';
  }
}

// generatenewAPISecret Key
async function generateNewApiKey() {
  if (!uiStore.currentViewingAccountId) return;

  generatingApiKey.value = true;
  try {
    const result = await invoke<any>('register_user_api_key', {
      id: uiStore.currentViewingAccountId
    });
    if (result.success && result.api_key) {
      newGeneratedApiKey.value = result.api_key;
      showNewApiKeyDialog.value = true;
      ElMessage.success('newAPISecret KeyGenerated');
      await loadApiKeys();
    } else {
      ElMessage.error(`generatefailed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[generateNewApiKey] Exception:', error);
    ElMessage.error(`generatefailed: ${error}`);
  } finally {
    generatingApiKey.value = false;
  }
}

// formatsecondslevelTimetimestamp
function formatTimestampSeconds(timestamp: number | undefined | null) {
  if (!timestamp) return 'N/A';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
}

// ==================== third-party Provider Key Management ====================

// Loading Provider Keys List
async function loadProviderKeys() {
  if (!uiStore.currentViewingAccountId) return;

  loadingProviderKeys.value = true;
  try {
    const result = await invoke<any>('get_set_user_api_provider_keys', {
      id: uiStore.currentViewingAccountId
    });
    if (result.success) {
      providerKeys.value = result.providers || [];
    } else {
      console.error('[loadProviderKeys] Error:', result.error);
      ElMessage.error(`fetchProvider Keysfailed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[loadProviderKeys] Exception:', error);
    ElMessage.error(`fetchProvider Keysfailed: ${error}`);
  } finally {
    loadingProviderKeys.value = false;
  }
}

// Add Provider Key
async function addProviderKey() {
  if (!uiStore.currentViewingAccountId || !newProviderName.value || !newProviderApiKey.value) return;

  addingProviderKey.value = true;
  try {
    const result = await invoke<any>('set_user_api_provider_key', {
      id: uiStore.currentViewingAccountId,
      provider: newProviderName.value,
      providerApiKey: newProviderApiKey.value
    });
    if (result.success) {
      ElMessage.success(`${result.provider} API KeySet`);
      showAddProviderKeyDialog.value = false;
      newProviderName.value = '';
      newProviderApiKey.value = '';
      await loadProviderKeys();
    } else {
      ElMessage.error(`Settingsfailed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[addProviderKey] Exception:', error);
    ElMessage.error(`Settingsfailed: ${error}`);
  } finally {
    addingProviderKey.value = false;
  }
}

// Delete Provider Key
async function deleteProviderKey(provider: string) {
  if (!uiStore.currentViewingAccountId) return;

  deletingProvider.value = provider;
  try {
    const result = await invoke<any>('delete_user_api_provider_key', {
      id: uiStore.currentViewingAccountId,
      provider: provider
    });
    if (result.success) {
      ElMessage.success(`${result.provider} API KeyDeleted`);
      await loadProviderKeys();
    } else {
      ElMessage.error(`Delete failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[deleteProviderKey] Exception:', error);
    ElMessage.error(`Delete failed: ${error}`);
  } finally {
    deletingProvider.value = '';
  }
}

// ==================== migrate API Key / Leaderboard ====================

// migrate API Key tonewsession Token
async function handleMigrateApiKey() {
  if (!migrateApiKeyInput.value) return;

  migratingApiKey.value = true;
  migrateResult.value = null;
  try {
    const result = await invoke<any>('migrate_api_key', {
      apiKey: migrateApiKeyInput.value
    });
    migrateResult.value = result;
    if (result.success) {
      ElMessage.success('API Keymigratesuccessful');
    } else {
      ElMessage.error(`Migration failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[handleMigrateApiKey] Exception:', error);
    migrateResult.value = { success: false, error: error.toString() };
    ElMessage.error(`Migration failed: ${error}`);
  } finally {
    migratingApiKey.value = false;
  }
}

// fetchLeaderboarddata
async function handleGetLeaderboard() {
  gettingLeaderboard.value = true;
  leaderboardData.value = [];
  leaderboardError.value = '';
  try {
    // firstfetchLeaderboardAPI Key
    const accountId = useCurrentAccountForLeaderboard.value ? uiStore.currentViewingAccountId : undefined;
    const keyResult = await invoke<any>('get_global_leaderboard_api_key', {
      id: accountId
    });

    if (!keyResult.success || !keyResult.api_key) {
      throw new Error(keyResult.error || 'fetchLeaderboardAPI Keyfailed');
    }

    // use API Key queryLeaderboard
    const result = await invoke<any>('get_leaderboard', {
      apiKey: keyResult.api_key
    });

    if (result.success) {
      leaderboardData.value = result.model_stats || [];
      if (leaderboardData.value.length === 0) {
        ElMessage.info('NoneLeaderboarddata');
      } else {
        ElMessage.success(`fetchto ${leaderboardData.value.length} modelrownamedata`);
      }
    } else {
      leaderboardError.value = result.error || 'Unknown error';
      ElMessage.error(`Query failed: ${leaderboardError.value}`);
    }
  } catch (error: any) {
    console.error('[handleGetLeaderboard] Exception:', error);
    leaderboardError.value = error.toString();
    ElMessage.error(`Query failed: ${error}`);
  } finally {
    gettingLeaderboard.value = false;
  }
}

function refresh() {
  loadAccountInfo();
  loadUserDetails();
}


function handleClose() {
  visible.value = false;
}

function formatDate(date: string | null | undefined) {
  if (!date) return '';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}


// formatDateTime（fromTimetimestamp）
function formatDateTime(timestamp: number | undefined | null) {
  if (!timestamp) return 'N/A';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss');
}

// formatTimetimestampasDate（Billing Cycleetc.use）
function formatTimestamp(timestamp: number | undefined | null) {
  if (!timestamp) return 'N/A';
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm');
}

// fetchtoperiod倒countwhentext
function getExpireCountdown(timestamp: number | undefined | null): string {
  if (!timestamp) return '';
  const expireDate = dayjs(timestamp * 1000);
  const now = dayjs();
  const diffDays = expireDate.diff(now, 'day');
  
  if (diffDays < 0) {
    return `Expired ${Math.abs(diffDays)} days`;
  } else if (diffDays === 0) {
    const diffHours = expireDate.diff(now, 'hour');
    if (diffHours <= 0) {
      return 'i.e.willtoperiod';
    }
    return `Remaining ${diffHours} hours`;
  } else if (diffDays <= 7) {
    return `Remaining ${diffDays} days`;
  } else if (diffDays <= 30) {
    return `Remaining ${diffDays} days`;
  } else {
    const diffMonths = expireDate.diff(now, 'month');
    if (diffMonths >= 1) {
      return `Remaining ${diffMonths} month`;
    }
    return `Remaining ${diffDays} days`;
  }
}

// fetchtoperiodStatusstyleclass
function getExpireClass(timestamp: number | undefined | null): string {
  if (!timestamp) return '';
  const expireDate = dayjs(timestamp * 1000);
  const now = dayjs();
  const diffDays = expireDate.diff(now, 'day');
  
  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= 3) {
    return 'critical';
  } else if (diffDays <= 7) {
    return 'warning';
  } else {
    return 'normal';
  }
}

// fetchQuotauseStatusstyleclass
function getQuotaClass(percentage: number): string {
  if (percentage >= 90) {
    return 'critical';
  } else if (percentage >= 70) {
    return 'warning';
  } else {
    return 'normal';
  }
}

// formatlargecountcharacter（convert toK/M/Bformat）
function formatLargeNumber(num: number | undefined | null) {
  if (!num) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// formatstoresize（convert toGB）
function formatStorageSize(bytes: number | undefined | null) {
  if (!bytes) return '0 GB';
  // ifisvery largecount（nolimit），displayas"nolimit"
  if (bytes > 1000000000000) return 'nolimit';
  // fakesetinputisKB，convert toGB
  const gb = bytes / 1024;
  return `${gb.toFixed(2)} GB`;
}

// formatAPIlimit（nolimitdisplayas-1）
function formatApiLimit(limit: number | undefined | null) {
  if (!limit) return '0';
  // ifisvery largecount（nolimit），displayas-1
  if (limit > 1000000000000) return '-1';
  return limit.toString();
}

// formatPlanName
function formatPlanName(name: string | undefined | null) {
  if (!name) return 'Unknown';
  const names: Record<string, string> = {
    'pro': 'Pro Pro',
    'teams': 'Teams Team',
    'enterprise': 'Enterprise Enterprise',
    'free': 'Free Free',
    'starter': 'starter starter'
  };
  return names[name.toLowerCase()] || name;
}

// formatFirebaseTimetimestamp
function formatFirebaseTimestamp(timestamp: string | number | null | undefined) {
  if (!timestamp) return 'N/A';
  
  // ifisISOstringformat（2025-11-20T12:32:28.415381Z）
  if (typeof timestamp === 'string' && timestamp.includes('T')) {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
  }
  
  // ifismillisecondslevelTimetimestamp
  if (typeof timestamp === 'number' || (typeof timestamp === 'string' && /^\d+$/.test(timestamp))) {
    const ts = parseInt(timestamp.toString());
    // judgeissecondsormilliseconds
    if (ts < 10000000000) {
      // secondslevelTimetimestamp
      return dayjs(ts * 1000).format('YYYY-MM-DD HH:mm:ss');
    } else {
      // millisecondslevelTimetimestamp
      return dayjs(ts).format('YYYY-MM-DD HH:mm:ss');
    }
  }
  
  return formatDate(timestamp);
}

// formatauthproviderName
function formatProviderName(providerId: string | null | undefined) {
  if (!providerId) return 'Unknown';
  
  const providerNames: Record<string, string> = {
    'password': 'Email/Password',
    'google.com': 'Google',
    'facebook.com': 'Facebook',
    'twitter.com': 'Twitter',
    'github.com': 'GitHub',
    'apple.com': 'Apple',
    'microsoft.com': 'Microsoft',
    'phone': 'Phone Number',
    'anonymous': 'anonymous'
  };
  
  return providerNames[providerId.toLowerCase()] || providerId;
}

// Copyreferral link
async function copyReferralLink(referralCode: string | undefined) {
  if (!referralCode) {
    ElMessage.warning('Referral Codenotsavein');
    return;
  }
  
  const referralLink = `https://windsurf.com/refer?referral_code=${referralCode}`;
  await copyText(referralLink, 'referral linkCopied to clipboard');
}

// throughuseCopyfunctioncount
async function copyText(text: string | undefined, message: string = 'ContentCopied') {
  if (!text) {
    ElMessage.warning('nocanCopyContent');
    return;
  }
  
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(message);
  } catch (err) {
    // if Clipboard API failed，useprepareusemethod
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    ElMessage.success(message);
  }
}

// formatCreditsdisplay（originalvalue÷100）
function formatCredits(value: number | undefined | null) {
  if (value === undefined || value === null) return 0;
  const result = value / 100;
  // ifiswholecountthennotdisplaysmallcount，nothenkeepmostmultiple2 decimal places
  return Number.isInteger(result) ? result : Math.round(result * 100) / 100;
}

// check ifhasUser Flags
const hasUserFlags = computed(() => {
  const u = userDetails.value?.user;
  return u?.pro || u?.public_profile_enabled || u?.newsletter || u?.used_trial || u?.disable_codeium || u?.disabled_telemetry;
});

// check ifhasTeam标志
const hasTeamFlags = computed(() => {
  const t = userDetails.value?.team;
  return t?.subscription_active || t?.used_trial || t?.attribution_enabled || t?.sso_provider_id || t?.offers_enabled || t?.top_up_enabled;
});

// calculateRemaining Credits = monthlyQuota - Used Credits（prefer usingTeamdata，nothenuseUserdata）
const remainingPromptCredits = computed(() => {
  const monthly = userDetails.value?.plan?.monthly_prompt_credits || 0;
  const used = userDetails.value?.team?.used_prompt_credits ?? userDetails.value?.user?.used_prompt_credits ?? 0;
  return Math.max(0, monthly - used);
});

const remainingFlowCredits = computed(() => {
  const monthly = userDetails.value?.plan?.monthly_flow_credits || 0;
  const used = userDetails.value?.team?.used_flow_credits ?? userDetails.value?.user?.used_flow_credits ?? 0;
  return Math.max(0, monthly - used);
});

const remainingFlexCredits = computed(() => {
  const quota = userDetails.value?.team?.flex_credit_quota || 0;
  const used = userDetails.value?.team?.used_flex_credits || 0;
  return Math.max(0, quota - used);
});

// Firebase UID
const firebaseUid = computed(() => {
  const info = accountInfo.value?.firebase_info;
  return info?.localId || info?.local_id || info?.uid || '-';
});

// TotalUsed Credits (usesubscriptioninused_quota or teaminused_prompt_credits)
const totalUsedCredits = computed(() => {
  // prefer usingsubscriptioninused_quota
  if (userDetails.value?.subscription?.used_quota) {
    return userDetails.value.subscription.used_quota;
  }
  // nothenuseteaminused_prompt_credits
  return userDetails.value?.team?.used_prompt_credits ?? userDetails.value?.user?.used_prompt_credits ?? 0;
});

// Total QuotaCredits (basicQuota + flexQuota)
const totalQuotaCredits = computed(() => {
  // prefer usingsubscriptioninquota（already throughiscalculateafterTotal Quota）
  if (userDetails.value?.subscription?.quota) {
    return userDetails.value.subscription.quota;
  }
  // nothenmanuallycalculate：planinmonthlyCredits + teaminflexQuota
  const monthlyPrompt = userDetails.value?.plan?.monthly_prompt_credits || 0;
  const flexQuota = userDetails.value?.team?.flex_credit_quota || 0;
  return monthlyPrompt + flexQuota;
});

// fetchSeat Count
const seatCount = computed(() => {
  // prefer fromsubscriptionfetch
  if (userDetails.value?.subscription?.seats) {
    return userDetails.value.subscription.seats;
  }
  // otherwise fromteamfetch
  return userDetails.value?.team?.num_seats_current_billing_period || 0;
});

// fetchSubscriptionhierarchy（priorityplan > team）
const subscriptionTier = computed(() => {
  // prefer fromplanfetch
  if (userDetails.value?.plan?.teams_tier) {
    return userDetails.value.plan.teams_tier;
  }
  // otherwise fromteamfetch
  return userDetails.value?.team?.teams_tier || 0;
});

// fetchSubscriptionwhetheractivate
const isSubscriptionActive = computed(() => {
  // prefer fromsubscriptionfetch
  if (userDetails.value?.subscription?.subscription_active !== undefined) {
    return userDetails.value.subscription.subscription_active;
  }
  // otherwise fromteamfetch
  return userDetails.value?.team?.subscription_active || false;
});

// Quotausepercentage
const quotaPercentage = computed(() => {
  if (totalQuotaCredits.value === 0) return 0;
  return Math.min(100, Math.round((totalUsedCredits.value / totalQuotaCredits.value) * 100));
});

// formatTeamhierarchy (corresponding codeium_common_pb.TeamsTier enum)
function formatTeamsTier(tier: number | undefined | null) {
  if (!tier) return 'Not specified';
  const tiers: Record<number, string> = {
    0: 'Not specified',
    1: 'Teams Team',
    2: 'Pro Pro',
    3: 'Enterprise SaaS',
    4: 'Hybrid Hybrid',
    5: 'Enterprise self-hosted',
    6: 'Pro waitlist',
    7: 'Teams Ultimate',
    8: 'Pro Ultimate',
    9: 'Trial trial',
    10: 'Enterprise self-service'
  };
  return tiers[tier] || `level ${tier}`;
}

// fetchTeamhierarchyTagstype
function getTeamsTierType(tier: number | undefined | null): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (!tier) return 'info';
  // Enterprise related
  if ([3, 4, 5, 10].includes(tier)) return 'danger';
  // Pro related
  if ([2, 6, 8].includes(tier)) return 'success';
  // Teams related
  if ([1, 7].includes(tier)) return 'primary';
  // Trial
  if (tier === 9) return 'warning';
  return 'info';
}

// formatUserTeamStatus (corresponding codeium_common_pb.UserTeamStatus enum)
function formatTeamStatus(status: number | undefined | null) {
  if (status === undefined || status === null) return 'Unknown';
  const statuses: Record<number, string> = {
    0: 'Not specified',
    1: 'Pending Approval',
    2: 'Approved',
    3: 'Rejected'
  };
  return statuses[status] || `Status ${status}`;
}

// fetchUserTeamStatusTagstype
function getTeamStatusType(status: number | undefined | null): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 3) return 'danger';   // Rejected
  if (status === 2) return 'success';  // Approved
  if (status === 1) return 'warning';  // Pending Approval
  return 'info';
}

// check ifhascertainitemPermission
function hasPermission(permissions: any, index: number): boolean {
  if (!permissions) return false;
  // ifisforobjectformat {0: 1, 1: 2, ...}
  if (typeof permissions === 'object' && !Array.isArray(permissions)) {
    return permissions[index - 1] !== undefined;
  }
  // ifiscountgroupformat
  if (Array.isArray(permissions)) {
    return permissions.includes(index);
  }
  return false;
}

// fetchPermissionCount
function getPermissionCount(permissions: any): number {
  if (!permissions) return 0;
  if (typeof permissions === 'object' && !Array.isArray(permissions)) {
    return Object.keys(permissions).length;
  }
  if (Array.isArray(permissions)) {
    return permissions.length;
  }
  return 0;
}

</script>

<style scoped lang="scss">
.account-info-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #909399;
  
  p { margin-top: 12px; }
}

.dialog-content {
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.custom-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    background: #f5f7fa;
    border-bottom: 1px solid #e4e7ed;
  }
  
  :deep(.el-tabs__content) {
    padding: 24px;
    overflow-y: auto;
    max-height: 600px;
  }
  
  .tab-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

/* UserDetailsstyle */
.details-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%);
  border-radius: 16px;
  overflow: hidden;
  
  // Planprimarytheme color（hierarchy：Free < Trial < Pro < Teams < Enterprise）
  &.plan-free { background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%); }
  &.plan-trial { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); }
  &.plan-pro { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); }
  &.plan-teams { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); }
  &.plan-enterprise { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); }
  
  .header-bg-icon {
    position: absolute;
    right: -20px;
    top: -20px;
    font-size: 120px;
    opacity: 0.06;
    color: #000;
  }
  
  .profile-main {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .avatar-wrapper {
    position: relative;
    
    .avatar-placeholder {
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
      color: white;
      font-size: 28px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
    
    .status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid #fff;
      
      &.active { background: #67C23A; }
      &.inactive { background: #909399; }
    }
  }
  
  .profile-info {
    flex: 1;
    min-width: 0;
    
    .name-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
      flex-wrap: wrap;
      
      .user-name {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #303133;
      }
    }
    
    .email-row {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #606266;
      font-size: 14px;
      margin-bottom: 6px;
    }
    
    .meta-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #909399;
        
        .el-icon { font-size: 14px; }
      }
    }
    
    .copy-icon {
      cursor: pointer;
      font-size: 14px;
      color: #a0a5a8;
      transition: color 0.2s;
      
      &:hover { color: #409EFF; }
    }
  }
  
  .profile-plan-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: linear-gradient(135deg, #E6A23C, #d4940d);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(230, 162, 60, 0.4);
  }
  
  .profile-expire-badge {
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    font-size: 11px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .el-icon {
      color: #409eff;
      font-size: 13px;
    }
    
    .expire-text {
      color: #606266;
      font-weight: 500;
    }
    
    .expire-countdown-tag {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      
      &.normal {
        background: linear-gradient(135deg, #e1f3d8 0%, #c2e7b0 100%);
        color: #67c23a;
      }
      
      &.warning {
        background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
        color: #e6a23c;
      }
      
      &.critical {
        background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
        color: #f56c6c;
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      &.expired {
        background: linear-gradient(135deg, #909399 0%, #606266 100%);
        color: white;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  .grid-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.info-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #c0c4cc;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }
  
  &.wide {
    width: 100%;
  }
  
  &.plan-card-bg {
    background: linear-gradient(to bottom right, #fff, #fcfcfc);
  }
  
  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .el-icon { color: #909399; }
    
    &.compact {
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .header-tags {
      margin-left: auto;
    }
  }
  
  .card-content {
    font-size: 13px;
  }
}

/* Usage/Quotabeautiful display */
.quota-display-card {
  margin-top: 12px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  
  .quota-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    
    .quota-title {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    
    .quota-percentage {
      font-size: 14px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      
      &.normal {
        color: #10b981;
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      }
      
      &.warning {
        color: #f59e0b;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      }
      
      &.critical {
        color: #ef4444;
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        animation: pulse 1.5s ease-in-out infinite;
      }
    }
  }
  
  .quota-progress-wrap {
    margin-bottom: 10px;
    
    .quota-progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      
      .quota-progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
        
        &.normal {
          background: linear-gradient(90deg, #34d399 0%, #10b981 100%);
        }
        
        &.warning {
          background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
        }
        
        &.critical {
          background: linear-gradient(90deg, #f87171 0%, #ef4444 100%);
        }
      }
    }
  }
  
  .quota-details {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    
    .quota-used, .quota-total {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .quota-label {
        font-size: 10px;
        color: #94a3b8;
      }
      
      .quota-value {
        font-size: 16px;
        font-weight: 700;
        color: #334155;
      }
    }
    
    .quota-divider {
      font-size: 18px;
      color: #cbd5e1;
      font-weight: 300;
    }
  }
}

/* TeamInfocardbeautiful */
.team-info-card {
  .team-basic-info {
    margin-bottom: 12px;
    
    .team-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      
      &:not(:last-child) {
        border-bottom: 1px dashed #f0f2f5;
      }
      
      .info-label {
        color: #909399;
        font-size: 12px;
      }
      
      .info-value {
        color: #303133;
        font-weight: 500;
        font-size: 13px;
        
        &.team-name {
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }
  
  .id-info-section {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 12px;
    
    .id-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      
      &:not(:last-child) {
        border-bottom: 1px solid #ebeef5;
      }
      
      .id-label {
        color: #909399;
        font-size: 11px;
        min-width: 60px;
        flex-shrink: 0;
      }
      
      .id-value-wrap {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        min-width: 0;
        justify-content: flex-end;
        
        .id-code {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 10px;
          color: #606266;
          background: #fff;
          padding: 3px 6px;
          border-radius: 4px;
          border: 1px solid #e4e7ed;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
          
          &.stripe {
            color: #635bff;
            border-color: #e8e6ff;
            background: #fafaff;
          }
          
          &:hover {
            background: #ecf5ff;
            border-color: #409eff;
          }
        }
        
        .el-button {
          padding: 4px;
          height: 22px;
          width: 22px;
        }
      }
    }
  }
  
  .team-stats {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    
    .stat-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 8px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 8px;
      border: 1px solid #bae6fd;
      
      .stat-number {
        font-size: 20px;
        font-weight: 700;
        color: #0284c7;
      }
      
      .stat-text {
        font-size: 10px;
        color: #64748b;
        margin-top: 2px;
      }
    }
  }
  
  .cascade-period {
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    border: 1px solid #fde047;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 12px;
    
    .period-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #a16207;
      font-weight: 600;
      margin-bottom: 8px;
      
      .el-icon { font-size: 14px; }
    }
    
    .period-dates {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .period-date {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .date-label {
          font-size: 10px;
          color: #92400e;
        }
        
        .date-value {
          font-size: 11px;
          font-weight: 600;
          color: #78350f;
          font-family: 'Consolas', monospace;
        }
      }
      
      .period-arrow {
        color: #d97706;
        font-size: 16px;
      }
    }
  }
  
  .credits-usage {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    
    .usage-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: #f5f7fa;
      border-radius: 20px;
      font-size: 11px;
      
      .usage-label {
        color: #909399;
      }
      
      .usage-value {
        color: #303133;
        font-weight: 600;
      }
    }
  }
  
  .team-flags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    
    .el-tag {
      font-size: 11px;
      
      .el-icon {
        margin-right: 2px;
      }
    }
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child { margin-bottom: 0; }
  
  .label { color: #909399; }
  .value { 
    color: #606266; 
    font-weight: 500; 
    text-align: right;
    max-width: 65%;
  }
  
  .text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .value-group {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .action-icon {
      cursor: pointer;
      color: #409EFF;
    }
  }
  
  &.small {
    font-size: 12px;
    margin-bottom: 4px;
  }
}

.stats-row {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stat-num { font-size: 18px; font-weight: 700; color: #303133; }
    .stat-label { font-size: 12px; color: #909399; }
  }
  
  &.compact {
    margin-top: 8px;
    padding-top: 8px;
    gap: 16px;
    justify-content: flex-start;
    
    .stat-item {
      .stat-num { font-size: 16px; color: #409eff; }
      .stat-label { font-size: 11px; }
    }
  }
}

.credits-stats {
  margin-top: 10px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
}

/* SubscriptionTime and QuotaInfo */
.subscription-time, .quota-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  
  .period-range {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #606266;
    
    .el-icon { color: #909399; font-size: 12px; }
  }
}

.quota-info .money {
  color: #67C23A;
  font-weight: 600;
}

/* Featuretogglestyle */
.feature-switches {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  
  .feature-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

/* ==========================================================================
   totaluse：allwith"icon + text"type el-tag containerunifyalignstrategy
   - coverrange：
     · .feature-switches .feature-tags —— Featuretoggle（quickautocomplete/Tabredirect/...）
     · .flag-tags-bottom               —— Userheaderunderside标志（Disabletelemetry/Subscriptionemail/...）
     · .team-flags                     —— TeamInfocardinside标志（Subscriptionactivate/Usedtrial/...）
   - keypoint：
     1. :deep() penetrate scoped，ensurematch element-plus renderoutclass name
     2. inline-flex + align-items:center —— let el-icon andtextsectionpoint（anonymous flex item）vertical center
     3. line-height:1 —— eliminate el-tag defaultrow高causetext box higher than icon box viewperception bias
     4. svg { display:block } —— remove SVG default inline baseline cause 0.125em undersink
   ========================================================================== */
.feature-switches .feature-tags,
.flag-tags-bottom,
.team-flags {
  :deep(.el-tag) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    line-height: 1;

    .el-icon {
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      line-height: 1;

      svg {
        display: block;
      }
    }
  }
}

/* Plancardspecialstyle */
.plan-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  .plan-name {
    font-size: 16px;
    font-weight: 700;
    color: #E6A23C;
  }
}

.usage-progress {
  margin-bottom: 16px;
  
  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #606266;
    margin-bottom: 4px;
  }
}

.limits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  
  .limit-item {
    background: #f5f7fa;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .limit-val { font-weight: 600; color: #303133; }
    .limit-label { font-size: 11px; color: #909399; }
  }
}

.credits-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
  
  .credit-item {
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
    padding: 10px 4px;
    text-align: center;
    
    .credit-val { display: block; font-size: 16px; font-weight: 700; color: #67C23A; }
    .credit-label { font-size: 12px; color: #909399; }
  }
}

/* User FlagsTags */
.flag-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
  
  .el-tag { 
    display: flex; 
    align-items: center; 
    gap: 4px; 
    .el-icon { font-size: 12px; }
  }
}

/* Stripecodecodestyle */
.stripe-code {
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #606266;
}

/* Permissionchartcanview */
.permission-visual {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  
  .perm-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }
  
  .perm-dots {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .perm-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      background: #ebeef5;
      cursor: help;
      transition: all 0.2s;
      
      &.active {
        background: linear-gradient(135deg, #67C23A, #85ce61);
      }
    }
  }
}

/* Billing Cycle */
.billing-period {
  margin: 12px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
  
  .period-label {
    font-size: 11px;
    color: #909399;
    margin-bottom: 4px;
  }
  
  .period-range {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #606266;
    
    .el-icon { color: #c0c4cc; }
  }
}

/* RechargeInfo */
.topup-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
}

/* Quota Details */
.quota-details {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  
  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 4px;
    
    .label { color: #909399; }
    .value { color: #606266; font-weight: 500; }
  }
}

/* FeatureTags */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* StatusTagsgroup */
.status-tags {
  display: flex;
  gap: 6px;
}

/* Plancard grid：maintain 3 column（and .limits-grid.compact defaultalign，
   avoidin 400px right columnwidthunder 4 columnsqueezeTagsnewline） */
.limits-grid {
  grid-template-columns: repeat(3, 1fr) !important;
}

/* PermissionTags */
.permissions-section {
  margin-top: 10px;
  
  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }
  
  .permissions-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

/* FirebaseInfogridlayout */
.firebase-info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .info-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 8px 0;
    border-bottom: 1px solid #f0f2f5;
    
    &:last-child { border-bottom: none; }
  }
  
  .info-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    &.full-width { grid-column: 1 / -1; }
    
    .label {
      font-size: 12px;
      color: #909399;
      font-weight: 500;
    }
    
    .value {
      font-size: 13px;
      color: #303133;
      word-break: break-all;
    }
  }
}

/* Timeaxisstyle */
.horizontal-timeline {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 20px 10px 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 34px;
    left: 20px;
    right: 20px;
    height: 2px;
    background: #ebeef5;
    z-index: 0;
  }
  
  &.four-items {
    padding: 20px 0 0;
    
    .timeline-item {
      min-width: 0;
    }
  }
  
  .timeline-item {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    
    .timeline-dot {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      
      &.dot-blue { background: #409EFF; }
      &.dot-green { background: #67C23A; }
      &.dot-orange { background: #E6A23C; }
      &.dot-gray { background: #909399; }
    }
    
    .timeline-content {
      text-align: center;
      
      .timeline-title { font-size: 12px; font-weight: 600; color: #303133; }
      .timeline-time { font-size: 11px; color: #909399; margin-top: 2px; }
    }
  }
}

/* FirebaseproviderList */
.provider-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* otherthroughusestyle */
.raw-data-collapse {
  margin-top: 24px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  
  :deep(.el-collapse-item__header) {
    background: #f5f7fa;
    padding-left: 16px;
    font-size: 12px;
    color: #909399;
  }
}

.raw-data, .raw-json {
  margin: 0;
  padding: 12px;
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  background: #282c34;
  color: #abb2bf;
  overflow-x: auto;
  border-radius: 4px;
  max-height: 300px;
}

.collapse-title {
  font-size: 13px;
  color: #606266;
}

.collapse-arrow {
  margin-left: 8px;
  transition: transform 0.3s;
}

.info-grid-compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  
  .grid-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .label { font-size: 12px; color: #909399; }
    .value { font-size: 13px; color: #606266; font-weight: 500; }
  }
}

/* primarylayout：basicInfo + SubscriptionPlan */
.main-info-layout {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 16px;
  margin-bottom: 16px;
  
  .basic-info-card {
    margin-bottom: 0;
  }
  
  .right-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .info-card {
      margin-bottom: 0;
    }
  }
}

/* RoleandPermissionarea */
.role-permission-section {
  margin-bottom: 16px;
  
  .info-card {
    margin-bottom: 0;
  }
  
  .role-content {
    .role-info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 12px;
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .label {
          color: #909399;
          font-size: 13px;
        }
        
        .value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }
}


.limits-grid.compact {
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  
  .limit-item {
    padding: 8px;
    
    .limit-val { font-size: 16px; }
    .limit-label { font-size: 10px; }
  }
}

.credits-grid.compact {
  .credit-item {
    padding: 12px 16px;
    
    .credit-val { font-size: 22px; }
  }
}

.feature-switches.compact {
  margin-top: 8px;
  padding-top: 8px;
  
  .feature-label { font-size: 11px; margin-bottom: 6px; }
  .feature-tags { gap: 4px; }
  .feature-tags .el-tag { font-size: 11px; padding: 2px 6px; }
}

/* PlanlimitInfotable */
.plan-limits-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  border-top: 1px solid #f0f2f5;
  
  tr {
    border-bottom: 1px solid #f0f2f5;
    &:last-child { border-bottom: none; }
  }
  
  td {
    padding: 10px 8px;
    font-size: 12px;
    vertical-align: middle;
  }
  
  .label-cell {
    color: #909399;
    white-space: nowrap;
    width: 70px;
  }
  
  .value-cell {
    color: #303133;
    font-weight: 500;
  }
}

.local-info-container {
  padding: 8px 0;
}

.local-info-table {
  width: 100%;
  border-collapse: collapse;
  
  tr {
    border-bottom: 1px solid #f0f2f5;
    
    &:last-child { border-bottom: none; }
  }
  
  td {
    padding: 14px 16px;
    font-size: 13px;
    vertical-align: middle;
  }
  
  .label-cell {
    width: 120px;
    color: #303133;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .value-cell {
    color: #606266;
    word-break: break-all;
  }
  
  .empty-text {
    color: #909399;
  }
}

/* basicInfotable */
.basic-info-card {
  margin-bottom: 16px;
}

.basic-info-table {
  width: 100%;
  border-collapse: collapse;
  
  tr {
    border-bottom: 1px solid #f0f2f5;
    
    &:last-child { border-bottom: none; }
  }
  
  td {
    padding: 12px 16px;
    font-size: 13px;
    vertical-align: middle;
  }
  
  .label-cell {
    width: 120px;
    color: #303133;
    font-weight: 500;
    white-space: nowrap;
  }
  
  .value-cell {
    color: #606266;
    word-break: break-all;
    
    &.text-muted { color: #909399; }
    &.text-primary { color: #409EFF; }
    &.text-warning { color: #E6A23C; }
  }
  
  .copy-btn {
    margin-left: 8px;
    color: #909399;
    cursor: pointer;
    transition: color 0.2s;
    
    &:hover { color: #409EFF; }
  }
  
  .seat-count {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }
  
  .quota-cell {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .quota-text {
    color: #606266;
    font-size: 13px;
  }
}

.flag-tags-bottom {
  padding: 12px 16px;
  border-top: 1px solid #f0f2f5;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .info-row {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px dashed #f0f2f5;
    padding-bottom: 8px;
    
    &:last-child { border-bottom: none; padding-bottom: 0; }
    
    .label { color: #909399; }
    .value { color: #303133; font-weight: 500; }
  }
}

.dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* responsive */
@media (max-width: 700px) {
  .info-grid { grid-template-columns: 1fr; }
  .profile-header { flex-direction: column; text-align: center; }
  .profile-info {
    .name-row, .email-row, .id-row { justify-content: center; }
  }
  .info-grid-compact { grid-template-columns: 1fr; }
}

/* Dark Modeadapt */
:root.dark {
  .custom-tabs :deep(.el-tabs__header) {
    background: #1d1e1f;
    border-bottom-color: #4c4d4f;
  }
  
  .profile-header {
    background: linear-gradient(135deg, #262729 0%, #1d1e1f 100%);
    
    // Dark ThemePlanprimarytheme color
    &.plan-free { background: linear-gradient(135deg, #2a2a2a 0%, #1f1f1f 100%); }
    &.plan-trial { background: linear-gradient(135deg, #3d2e1a 0%, #2d2215 100%); }
    &.plan-pro { background: linear-gradient(135deg, #1a2a3a 0%, #152535 100%); }
    &.plan-teams { background: linear-gradient(135deg, #1a2a25 0%, #152520 100%); }
    &.plan-enterprise { background: linear-gradient(135deg, #2a1a3a 0%, #251535 100%); }
    
    .user-name { color: #e5eaf3; }
    .email-row { color: #a3a6ad; }
    .meta-row .meta-item { color: #a3a6ad; }
    .profile-plan-badge { background: linear-gradient(135deg, #c88a30, #a67520); }
  }
  
  .info-card {
    background: #1d1e1f;
    border-color: #4c4d4f;
    
    &:hover { border-color: #606266; }
    
    &.plan-card-bg { background: #262729; }
    
    .card-title { color: #e5eaf3; .el-icon { color: #a3a6ad; } }
  }
  
  .info-item {
    .label { color: #a3a6ad; }
    .value { color: #cfd3dc; }
  }
  
  .stats-row {
    border-top-color: #4c4d4f;
    .stat-num { color: #e5eaf3; }
    .stat-label { color: #a3a6ad; }
  }
  
  .limit-item {
    background: #262729;
    .limit-val { color: #e5eaf3; }
    .limit-label { color: #a3a6ad; }
  }
  
  .credit-item {
    border-color: #4c4d4f;
    .credit-label { color: #a3a6ad; }
  }
  
  .info-list .info-row {
    border-bottom-color: #4c4d4f;
    .label { color: #a3a6ad; }
    .value { color: #e5eaf3; }
  }
  
  .dialog-footer { border-top-color: #4c4d4f; }
  
  .raw-data-collapse :deep(.el-collapse-item__header) {
    background: #262729;
    color: #a3a6ad;
  }
  
  .horizontal-timeline::before { background: #4c4d4f; }
  
  .timeline-content {
    .timeline-title { color: #e5eaf3; }
    .timeline-time { color: #a3a6ad; }
  }
  
  // add newstyleDark Mode
  .flag-tags { border-top-color: #4c4d4f; }
  
  .stripe-code {
    background: #262729;
    color: #a3a6ad;
  }
  
  .permission-visual {
    border-top-color: #4c4d4f;
    .perm-label { color: #a3a6ad; }
    .perm-dots .perm-dot { background: #4c4d4f; }
  }
  
  .billing-period {
    background: #262729;
    .period-label { color: #a3a6ad; }
    .period-range { color: #cfd3dc; }
  }
  
  .topup-info, .quota-details { border-top-color: #4c4d4f; }
  
  .quota-details .detail-row {
    .label { color: #a3a6ad; }
    .value { color: #cfd3dc; }
  }
  
  .credits-stats {
    background: linear-gradient(135deg, #1a2332 0%, #1e3a5f 100%);
    .stat-num { color: #67c23a; }
  }
  
  .firebase-info-grid {
    .info-row { border-bottom-color: #4c4d4f; }
    .info-cell {
      .label { color: #a3a6ad; }
      .value { color: #e5eaf3; }
    }
  }
  
  .collapse-title { color: #a3a6ad; }
  
  .local-info-table {
    tr { border-bottom-color: #4c4d4f; }
    .label-cell { color: #e5eaf3; }
    .value-cell { color: #cfd3dc; }
    .empty-text { color: #a3a6ad; }
  }
  
  .basic-info-table {
    tr { border-bottom-color: #4c4d4f; }
    .label-cell { color: #e5eaf3; }
    .value-cell { 
      color: #cfd3dc;
      &.text-muted { color: #a3a6ad; }
      &.text-primary { color: #79bbff; }
      &.text-warning { color: #f0a020; }
    }
    .seat-count { color: #e5eaf3; }
    .quota-text { color: #a3a6ad; }
    .copy-btn { color: #a3a6ad; }
  }
  
  .flag-tags-bottom { border-top-color: #4c4d4f; }
  
  .plan-limits-table {
    border-top-color: #4c4d4f;
    tr { border-bottom-color: #4c4d4f; }
    .label-cell { color: #a3a6ad; }
    .value-cell { color: #cfd3dc; }
  }
}

// APIKey Managementstyle
.api-keys-container {
  padding: 20px;

  .api-keys-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      p {
        margin: 4px 0 0;
        font-size: 13px;
        color: #909399;
      }
    }
  }

  .api-keys-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .api-key-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      border: 1px solid #e4e7ed;

      .key-info {
        flex: 1;

        .key-display {
          display: flex;
          align-items: center;
          gap: 8px;

          code {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            color: #303133;
            background: #fff;
            padding: 8px 14px;
            border-radius: 4px;
            border: 1px solid #dcdfe6;
            max-width: 350px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .copy-btn {
            cursor: pointer;
            color: #909399;
            transition: color 0.2s;

            &:hover {
              color: #409eff;
            }
          }
        }

        .key-meta {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          font-size: 12px;
          color: #909399;

          span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }

      .key-actions {
        margin-left: 16px;
      }
    }
  }

  .api-keys-tip {
    margin-top: 20px;
  }

  .api-keys-header .header-actions {
    display: flex;
    gap: 8px;
  }
}

// Devin Account API Secret Key tab top稳定showblock（directlyshowCurrent session_token）
.current-api-key-block {
  margin-bottom: 20px;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid #bbf7d0;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);

  &.devin {
    border-color: #a7f3d0;
  }

  .current-api-key-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .current-api-key-title {
      font-size: 15px;
      font-weight: 600;
      color: #065f46;
    }
  }

  .current-api-key-desc {
    margin: 0 0 12px;
    font-size: 12px;
    line-height: 1.6;
    color: #047857;

    code {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
      color: #065f46;
      background: rgba(255, 255, 255, 0.6);
      padding: 1px 6px;
      border-radius: 3px;
    }
  }

  .current-api-key-display {
    display: flex;
    align-items: center;
    gap: 12px;

    .current-api-key-code {
      flex: 1;
      font-family: 'Consolas', 'Monaco', 'SF Mono', monospace;
      font-size: 12px;
      color: #065f46;
      background: #fff;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #a7f3d0;
      word-break: break-all;
      max-height: 120px;
      overflow-y: auto;
      white-space: pre-wrap;
      box-shadow: 0 1px 2px rgba(5, 95, 70, 0.08);
    }
  }
}

// newgenerateAPISecret Keydisplaystyle
.new-api-key-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;

  .api-key-code {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    color: #303133;
    background: #fff;
    padding: 12px 16px;
    border-radius: 6px;
    border: 1px solid #dcdfe6;
    word-break: break-all;
    width: 100%;
    text-align: center;
  }
}

// APISecret KeyFeatureblockthroughusestyle
.migrate-api-key-section,
.leaderboard-section {
  margin-top: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;

  .section-desc {
    margin: 0 0 16px;
    font-size: 13px;
    color: #64748b;
    line-height: 1.5;
  }

  .migrate-input-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .migrate-result {
    margin-top: 16px;

    .result-content {
      margin-top: 12px;

      p {
        margin: 0 0 8px;
        font-size: 13px;
        color: #475569;
      }

      code {
        font-family: 'Consolas', 'Monaco', 'SF Mono', monospace;
        font-size: 12px;
        color: #1e293b;
        background: #fff;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        display: inline-block;
        word-break: break-all;
        max-width: 100%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
    }
  }
}

// Leaderboardtablestyle
.leaderboard-table {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);

  :deep(.el-table) {
    --el-table-border-color: #e2e8f0;

    th {
      background: #f8fafc !important;
      font-weight: 600;
      color: #475569;
    }

    td {
      color: #334155;
    }
  }
}

// Provider KeyManagementstyle
.provider-keys-container {
  padding: 20px;

  .provider-keys-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .header-info {
      display: flex;
      align-items: center;
      gap: 12px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      p {
        margin: 4px 0 0;
        font-size: 13px;
        color: #909399;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .provider-keys-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;

    .provider-key-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fafafa;
      border: 1px solid #ebeef5;
      border-radius: 8px;

      .provider-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .provider-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #303133;
        }
      }
    }
  }
}

// Dark Modeadapt - APISecret Key / Provider Key / Leaderboard / migrate
.dark {
  .current-api-key-block {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(16, 185, 129, 0.04) 100%);
    border-color: rgba(16, 185, 129, 0.35);

    .current-api-key-header {
      .current-api-key-title { color: #a7f3d0; }
    }

    .current-api-key-desc {
      color: #86efac;

      code {
        background: rgba(255, 255, 255, 0.08);
        color: #a7f3d0;
      }
    }

    .current-api-key-display {
      .current-api-key-code {
        background: #1f2937;
        border-color: rgba(16, 185, 129, 0.3);
        color: #a7f3d0;
      }
    }
  }

  .migrate-api-key-section,
  .leaderboard-section {
    background: linear-gradient(135deg, #1e1e1f 0%, #252526 100%);
    border-color: #3c3c3c;

    .section-desc { color: #a3a6ad; }

    .migrate-result {
      .result-content {
        p { color: #cfd3dc; }
        code {
          background: #2d2d2d;
          border-color: #4c4d4f;
          color: #e5eaf3;
        }
      }
    }
  }

  .leaderboard-table {
    :deep(.el-table) {
      --el-table-border-color: #4c4d4f;
      th { background: #2a2a2b !important; color: #a3a6ad; }
      td { color: #cfd3dc; }
    }
  }

  .provider-keys-container {
    .provider-keys-header {
      .header-info {
        h3 { color: #e5eaf3; }
        p { color: #a3a6ad; }
      }
    }

    .provider-keys-list {
      .provider-key-item {
        background: #2a2a2b;
        border-color: #4c4d4f;

        .provider-info {
          .provider-name { color: #e5eaf3; }
        }
      }
    }
  }

  .api-keys-container {
    .api-keys-header {
      .header-info {
        h3 { color: #e5eaf3; }
        p { color: #a3a6ad; }
      }
    }

    .api-keys-list {
      .api-key-item {
        background: #2a2a2b;
        border-color: #4c4d4f;

        .key-info {
          .key-display {
            code {
              color: #e5eaf3;
              background: #1d1e1f;
              border-color: #4c4d4f;
            }
          }

          .key-meta {
            color: #a3a6ad;
          }
        }
      }
    }
  }
}
</style>
