<template>
  <div 
    class="account-card" 
    :class="{ 'selected': isSelected, 'active': account.status === 'active', 'current': isCurrent, 'has-tag-color': hasColoredTag, 'is-disabled': account.is_disabled, 'subscription-inactive': isPaidPlan && account.subscription_active === false }"
    :style="cardBorderStyle"
    @click="handleCardClick"
  >
    <div class="card-header">
      <!-- drag handle - simple VersionDisabled
      <div class="drag-handle" title="Drag to reorder">
        <el-icon><Rank /></el-icon>
      </div>
      -->
      <el-checkbox 
        :model-value="isSelected"
        @change="handleSelect"
        class="select-checkbox"
      />
      <div class="account-info">
        <div class="email" :title="'Click to copy: ' + account.email" @click.stop="copyEmail">{{ displayEmail }}</div>
        <el-tag 
          v-if="account.nickname"
          type="warning"
          size="small"
          effect="light"
          class="nickname-tag"
        >
          {{ account.nickname }}
        </el-tag>
        <el-tooltip
          v-if="account.auth_provider === 'devin'"
          content="Authenticated via Devin Session (new system)"
          placement="top"
        >
          <el-tag
            type="success"
            size="small"
            effect="dark"
            class="devin-tag"
          >
            Devin
          </el-tag>
        </el-tooltip>
      </div>
      <div class="status-indicator" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <div class="card-body">
      <!-- Quota and PlanInfo -->
      <div class="quota-section" v-if="hasQuotaData">
        <div class="quota-header">
          <div class="quota-header-left">
            <el-tag v-if="account.plan_name" :class="['plan-tag', `plan-${account.plan_name?.toLowerCase()}`]" size="small">
              <el-icon>
                <User v-if="account.plan_name?.toLowerCase() === 'free'" />
                <Trophy v-else />
              </el-icon>
              {{ account.plan_name }}
            </el-tag>
          </div>
          <!-- CREDITS Mode：displayCreditscountvalue -->
          <div class="quota-header-right" v-if="!isQuotaMode">
            <span class="quota-used">{{ formatQuota(account.used_quota) }}</span>
            <span class="quota-separator">/</span>
            <span class="quota-total">{{ formatQuota(account.total_quota) }}</span>
          </div>
        </div>

        <!-- QUOTA Mode：Daily Quota and Weekly Quotapercentage -->
        <template v-if="isQuotaMode">
          <div class="quota-percent-row">
            <span class="quota-percent-label">Daily Quota</span>
            <el-progress
              :percentage="account.daily_quota_remaining_percent ?? 0"
              :stroke-width="8"
              :color="dailyQuotaColor"
              :show-text="false"
              class="quota-percent-bar"
            />
            <span class="quota-percent-value">{{ account.daily_quota_remaining_percent ?? 0 }}%</span>
            <span class="quota-reset-time" v-if="formatResetTime(account.daily_quota_reset_at_unix)">
              {{ formatResetTime(account.daily_quota_reset_at_unix) }}
            </span>
          </div>
          <div class="quota-percent-row">
            <span class="quota-percent-label">Weekly Quota</span>
            <el-progress
              :percentage="account.weekly_quota_remaining_percent ?? 0"
              :stroke-width="8"
              :color="weeklyQuotaColor"
              :show-text="false"
              class="quota-percent-bar"
            />
            <span class="quota-percent-value">{{ account.weekly_quota_remaining_percent ?? 0 }}%</span>
            <span class="quota-reset-time" v-if="formatResetTime(account.weekly_quota_reset_at_unix)">
              {{ formatResetTime(account.weekly_quota_reset_at_unix) }}
            </span>
          </div>
        </template>

        <!-- CREDITS Mode：Creditsprogressitems -->
        <template v-else>
          <div class="quota-progress">
            <el-progress
              :percentage="quotaPercentage"
              :stroke-width="8"
              :color="quotaColor"
              :show-text="false"
            />
            <span class="quota-percentage">{{ quotaPercentage }}%</span>
          </div>
        </template>
        
        <!-- Subscription ExpiresTime（integrated inQuotablockinside） -->
        <div class="quota-expiry" v-if="account.subscription_expires_at">
          <el-icon class="expiry-icon"><Clock /></el-icon>
          <span class="expiry-label">Expiry Date:</span>
          <span class="expiry-date">{{ formattedExpiryDate }}</span>
          <span v-if="daysUntilExpiry !== null" :class="['expiry-badge', expiryClass]">
            {{ expiryText }}
          </span>
        </div>
      </div>

      <div class="tags">
        <el-tag 
          v-for="tag in account.tags" 
          :key="tag"
          size="small"
          :style="getTagStyle(tag)"
          class="custom-tag"
        >
          {{ tag }}
        </el-tag>
      </div>
      
      <!-- InfoTagsgroup -->
      <div class="info-tags">
        <el-tooltip v-if="account.group" content="Group" placement="top">
          <el-tag 
            size="small"
            class="info-tag group-tag"
          >
            <el-icon><Folder /></el-icon>
            <span>{{ account.group }}</span>
          </el-tag>
        </el-tooltip>

        <el-tooltip v-if="account.created_at" content="Created At" placement="top">
          <el-tag 
            size="small"
            class="info-tag create-tag"
          >
            <el-icon><Calendar /></el-icon>
            <span>{{ formatDate(account.created_at) }}</span>
          </el-tag>
        </el-tooltip>

        <el-tooltip v-if="account.token_expires_at" :content="tokenExpiryTooltip" placement="top">
          <el-tag
            size="small"
            class="info-tag token-tag"
            :type="tokenExpiryType"
          >
            <el-icon><Key /></el-icon>
            <span>{{ formatDate(account.token_expires_at) }}</span>
          </el-tag>
        </el-tooltip>
      </div>
    </div>

    <div class="card-actions">
      <!-- #first row buttons（6） -->
      <div class="action-buttons">
        <el-tooltip content="Batch Reset Team Credits" placement="top">
          <el-button
            size="small"
            :icon="Refresh"
            circle
            type="warning"
            plain
            @click="handleBatchResetTeamCredits"
            :loading="isResettingCredits"
          />
        </el-tooltip>

        <el-tooltip content="Query Billing" placement="top">
          <el-button 
            size="small" 
            :icon="Document"
            circle
            @click="handleGetBilling"
            :loading="isGettingBilling"
          />
        </el-tooltip>

        <el-tooltip content="Auto Recharge" placement="top">
          <el-button
            size="small"
            :icon="Money"
            circle
            type="warning"
            plain
            @click="handleAutoRefill"
          />
        </el-tooltip>

        <el-tooltip content="Credit History" placement="top">
          <el-button 
            size="small" 
            :icon="TrendCharts"
            circle
            @click="handleShowCreditHistory"
            :loading="isLoadingCreditHistory"
          />
        </el-tooltip>

        <el-tooltip :content="refreshButtonTooltip" placement="top">
          <el-button 
            size="small" 
            :icon="RefreshRight"
            circle
            @click="handleRefreshToken"
            :loading="isRefreshing"
          />
        </el-tooltip>

        <el-tooltip content="Account Info" placement="top">
          <el-button 
            size="small" 
            :icon="User"
            circle
            @click="handleAccountInfo"
          />
        </el-tooltip>

        <!-- convertLogin Method（Firebase ↔ Devin）：byCurrent auth_provider dynamicSwitch tooltip and action -->
        <el-tooltip :content="convertActionLabel" placement="top">
          <el-button
            size="small"
            :icon="Connection"
            circle
            type="warning"
            plain
            @click="handleConvertAuthProvider"
            :loading="isConvertingAuth"
          />
        </el-tooltip>

        <el-tooltip content="DeleteUser(Windsurf)" placement="top">
          <el-button
            size="small"
            :icon="UserFilled"
            circle
            type="warning"
            plain
            :loading="deletingUser"
            @click="handleDeleteWindsurfUser"
          />
        </el-tooltip>

        <el-tooltip content="Delete" placement="top">
          <el-button
            size="small"
            :icon="Delete"
            circle
            type="danger"
            plain
            @click="handleDelete"
          />
        </el-tooltip>
      </div>
      
      <!-- #second row buttons（5） -->
      <div class="action-buttons">
        <el-tooltip content="Edit" placement="top">
          <el-button 
            size="small" 
            :icon="Edit"
            circle
            @click="handleEdit"
          />
        </el-tooltip>

        <el-tooltip content="re-Login" placement="top">
          <el-button 
            size="small" 
            :icon="Key"
            circle
            @click="handleLogin"
          />
        </el-tooltip>

        <el-tooltip content="useAnalysis" placement="top">
          <el-button
            size="small"
            :icon="DataAnalysis"
            circle
            @click="handleShowAnalytics"
          />
        </el-tooltip>

        <el-tooltip content="Team Settings" placement="top">
          <el-button
            size="small"
            :icon="Setting"
            circle
            @click="handleTeamSettings"
          />
        </el-tooltip>

        <el-tooltip content="Team Management" placement="top">
          <el-button
            size="small"
            :icon="UserFilled"
            circle
            type="primary"
            plain
            @click="handleTeamManagement"
          />
        </el-tooltip>

        <el-tooltip content="changeSubscription" placement="top">
          <el-button
            size="small"
            :icon="Sell"
            circle
            @click="handleUpdatePlan"
            :loading="isUpdatingPlan"
          />
        </el-tooltip>

        <el-tooltip content="fetchtriallink" placement="top">
          <el-button
            size="small"
            :icon="Link"
            circle
            @click="handleGetTrialLink"
            :loading="isGettingTrialLink"
          />
        </el-tooltip>

        <el-tooltip content="checkProTrial Eligibility" placement="top">
          <el-button
            size="small"
            :icon="Trophy"
            circle
            type="info"
            plain
            @click="handleCheckProTrial"
            :loading="isCheckingProTrial"
          />
        </el-tooltip>

        <el-tooltip content="quick switch" placement="top">
          <el-button
            size="small"
            :icon="Switch"
            circle
            type="success"
            plain
            @click="handleSwitchAccount"
            :loading="isSwitching"
          />
        </el-tooltip>
      </div>
    </div>
  </div>

  <!-- Credit HistoryDialog -->
  <CreditHistoryDialog
    v-model="showCreditHistoryDialog"
    :account-id="account.id"
  />

  <!-- seatUpdateresultDialog -->
  <UpdateSeatsResultDialog
    v-model="showSeatsResultDialog"
    :result-data="seatsResultData"
  />

  <!-- useAnalysisDialog -->
  <AnalyticsDialog
    v-model="showAnalyticsDialog"
    :account-id="account.id"
    :account-email="account.email"
  />

  <!-- Team SettingsDialog -->
  <TeamSettingsDialog
    v-model="showTeamSettingsDialog"
    :account-id="account.id"
  />

  <!-- Team ManagementDialog -->
  <TeamManagementDialog
    v-model="showTeamManagementDialog"
    :account-id="account.id"
  />

  <!-- Auto RechargeSettingsDialog -->
  <AutoRefillDialog
    v-model="showAutoRefillDialog"
    :account-id="account.id"
  />

  <!-- changeSubscriptionDialog -->
  <UpdatePlanDialog
    v-model="showUpdatePlanDialog"
    :account-id="account.id"
    :account="account"
    @success="handleUpdatePlanSuccess"
  />

  <!-- Turnstile VerifyDialog -->
  <TurnstileDialog
    :visible="showTurnstileDialog"
    @update:visible="showTurnstileDialog = $event"
    @success="handleTurnstileSuccess"
    @cancel="showTurnstileDialog = false"
  />

  <!-- switch progressdialog（standalone in Dialog） -->
  <!-- running disabledvia遮罩 / Esc disabled，force user to watch full flow；when success/failedallowdisabled -->
  <el-dialog
    v-model="switchProgress.visible"
    :title="`Switchto ${switchProgress.accountName}`"
    width="460px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="switchProgress.phase !== 'running'"
    align-center
    append-to-body
    class="switch-progress-dialog"
    @close="closeSwitchProgress"
  >
    <div class="switch-progress-body">
      <!-- horizontal progress items：error → exception(red)，100% and success → success(green)，other → default -->
      <el-progress
        :percentage="switchProgress.percent"
        :status="switchProgress.phase === 'error'
          ? 'exception'
          : (switchProgress.phase === 'success' ? 'success' : undefined)"
        :stroke-width="12"
        striped
        :striped-flow="switchProgress.phase === 'running'"
      />
      <!-- current stage description -->
      <div
        class="switch-progress-label"
        :class="{ 'is-error': switchProgress.phase === 'error' }"
      >
        {{ switchProgress.label || 'waitbackendstart...' }}
      </div>
      <!-- 7 step checklist -->
      <div class="switch-progress-steps">
        <div
          v-for="(step, idx) in SWITCH_STEP_DEFS"
          :key="step.key"
          class="switch-progress-step"
          :class="`status-${getStepStatus(idx)}`"
        >
          <el-icon v-if="getStepStatus(idx) === 'done'" class="step-icon">
            <CircleCheck />
          </el-icon>
          <el-icon v-else-if="getStepStatus(idx) === 'running'" class="step-icon is-spin">
            <Loading />
          </el-icon>
          <el-icon v-else-if="getStepStatus(idx) === 'error'" class="step-icon">
            <CircleClose />
          </el-icon>
          <el-icon v-else class="step-icon">
            <CircleCheck />
          </el-icon>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <!-- no buttons during running，force user wait backend；non-running display disabled -->
      <el-button
        v-if="switchProgress.phase !== 'running'"
        :type="switchProgress.phase === 'error' ? 'danger' : 'primary'"
        @click="closeSwitchProgress"
      >
        disabled
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  Document,
  RefreshRight,
  Edit,
  Delete,
  Key,
  Clock,
  Calendar,
  Folder,
  User,
  Trophy,
  TrendCharts,
  Link,
  Switch,
  DataAnalysis,
  Setting,
  UserFilled,
  Money,
  Sell,
  Refresh,
  CircleCheck,
  CircleClose,
  Connection,
  Loading,
} from '@element-plus/icons-vue';
import { h } from 'vue';
import type { Account } from '@/types';
import { apiService, accountApi, devinApi } from '@/api';
import { useAccountsStore, useUIStore, useSettingsStore } from '@/store';
import UpdateSeatsResultDialog from '@/components/UpdateSeatsResultDialog.vue';
import CreditHistoryDialog from '@/components/CreditHistoryDialog.vue';
import AnalyticsDialog from '@/components/AnalyticsDialog.vue';
import TeamSettingsDialog from '@/components/TeamSettingsDialog.vue';
import TeamManagementDialog from '@/components/TeamManagementDialog.vue';
import AutoRefillDialog from '@/components/AutoRefillDialog.vue';
import UpdatePlanDialog from '@/components/UpdatePlanDialog.vue';
import TurnstileDialog from '@/components/TurnstileDialog.vue';
import dayjs from 'dayjs';
import { maskEmail } from '@/utils/privacy';

const props = defineProps<{
  account: Account;
  isSelected: boolean;
  currentEmail?: string;
}>();

const emit = defineEmits<{
  select: [value: boolean];
  update: [account: Account];
}>();

const accountsStore = useAccountsStore();
const uiStore = useUIStore();
const settingsStore = useSettingsStore();

// whether it isCurrentactivateAccount
const isCurrent = computed(() => {
  return props.currentEmail && props.account.email === props.currentEmail;
});

// displayEmail（based onprivacyMode）
const displayEmail = computed(() => {
  if (settingsStore.settings?.privacyMode) {
    return maskEmail(props.account.email);
  }
  return props.account.email;
});

// fetchTag Color（prefer usingglobalTag Color）
function getTagColor(tagName: string): string | null {
  // prefer usingglobalTags color
  const globalTag = settingsStore.tags.find(t => t.name === tagName);
  if (globalTag?.color) {
    return globalTag.color;
  }
  // fallback to account saved color
  if (!props.account.tagColors) return null;
  const tagWithColor = props.account.tagColors.find(t => t.name === tagName);
  return tagWithColor?.color || null;
}

// parsecolorasRGBvalue
function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
  // parseRGBAformat
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: parseFloat(rgbaMatch[4] || '1')
    };
  }
  
  // parseHEXformat
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    } else if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
  }
  
  return null;
}

// fetchTagsstyle
function getTagStyle(tagName: string): Record<string, string> {
  const color = getTagColor(tagName);
  
  // if no color found，Backdefaultstyle（instead of being empty）
  if (!color) {
    return {
      backgroundColor: 'rgba(64, 158, 255, 0.1)',
      borderColor: 'rgba(64, 158, 255, 0.3)',
      color: 'rgba(64, 158, 255, 1)',
      border: '1px solid rgba(64, 158, 255, 0.3)'
    };
  }
  
  const parsed = parseColor(color);
  if (parsed) {
    const { r, g, b, a } = parsed;
    // background uses low transparency
    const bgAlpha = Math.min(a * 0.2, 0.3);
    // border uses slightly higher transparency
    const borderAlpha = Math.min(a * 0.5, 0.6);
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, ${bgAlpha})`,
      borderColor: `rgba(${r}, ${g}, ${b}, ${borderAlpha})`,
      color: `rgba(${r}, ${g}, ${b}, ${Math.max(a, 0.8)})`,
      border: `1px solid rgba(${r}, ${g}, ${b}, ${borderAlpha})`
    };
  }
  
  // if color parse failed，try directly use color value
  return {
    backgroundColor: color,
    borderColor: color,
    color: '#fff'
  };
}

// whether has colored tags
const hasColoredTag = computed(() => {
  // checkAccountany tag whether has color（global or Accountlevel）
  return props.account.tags.some(tagName => getTagColor(tagName) !== null);
});

// fetch#onewithcolorTags coloras card border color
const primaryTagColor = computed(() => {
  // iterate account tags，find#onehascolor
  for (const tagName of props.account.tags) {
    const color = getTagColor(tagName);
    if (color) return color;
  }
  return null;
});

// card border style
const cardBorderStyle = computed(() => {
  const color = primaryTagColor.value;
  if (!color) return {};
  
  const parsed = parseColor(color);
  if (parsed) {
    const { r, g, b, a } = parsed;
    // border transparency
    const borderAlpha = Math.min(a * 0.6, 0.8);
    // glow effect transparency
    const glowAlpha = Math.min(a * 0.2, 0.3);
    return {
      '--tag-border-color': `rgba(${r}, ${g}, ${b}, ${borderAlpha})`,
      '--tag-glow-color': `rgba(${r}, ${g}, ${b}, ${glowAlpha})`,
      borderColor: `rgba(${r}, ${g}, ${b}, ${borderAlpha})`,
      boxShadow: `0 0 12px rgba(${r}, ${g}, ${b}, ${glowAlpha}), 0 2px 8px rgba(0, 0, 0, 0.06)`
    };
  }
  return {};
});

const isGettingBilling = ref(false);
const isLoadingCreditHistory = ref(false);
const isRefreshing = ref(false);
const isGettingTrialLink = ref(false);
const isCheckingProTrial = ref(false);
const deletingUser = ref(false);
const isSwitching = ref(false);

// ==================== switch progressdialogStatus ====================
// with backend switch_account_commands.rs  SwitchProgressPayload align
// phase: 'running' | 'success' | 'error' | 'idle'（idle only beforesideuse，code表dialogInactive）
type SwitchProgressPhase = 'idle' | 'running' | 'success' | 'error';

interface SwitchProgressEventPayload {
  step: string;
  label: string;
  percent: number;
  phase: 'running' | 'success' | 'error';
}

interface SwitchProgressState {
  visible: boolean;
  step: string;
  label: string;
  percent: number;
  phase: SwitchProgressPhase;
  accountName: string;
}

// explicit generic declaration，avoid TS subsequent assignment phase='running' then do literal narrowing
// make get `switchProgress.phase !== 'error'` was wrongly judged as always true compare。
const switchProgress = reactive<SwitchProgressState>({
  visible: false,
  step: '',
  label: '',
  percent: 0,
  phase: 'idle',
  accountName: '',
});

// step definition：sequence with backend emit  step key maintain consistent
// frontend by key find current step position to render checklist Status
const SWITCH_STEP_DEFS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'preparing', label: 'prepare account info' },
  { key: 'fetch_access', label: 'fetch access_token' },
  { key: 'fetch_auth', label: 'fetch one-time auth_token' },
  { key: 'auto_patch', label: 'checkSeamless Switchpatch' },
  { key: 'reset_mid', label: 'Resetmachine ID' },
  { key: 'callback', label: 'triggerClientLogin' },
  { key: 'finalize', label: 'SaveAccountStatus' },
];

// current step index（-1 representnot started yet / unknown step）
const currentStepIndex = computed(() => {
  if (switchProgress.step === 'done') return SWITCH_STEP_DEFS.length;
  return SWITCH_STEP_DEFS.findIndex(s => s.key === switchProgress.step);
});

// every step in UI status：Completed ✓ / Current spinner / failed ✗ / pending gray
function getStepStatus(idx: number): 'done' | 'running' | 'error' | 'pending' {
  const cur = currentStepIndex.value;
  if (cur === -1) return 'pending';
  if (idx < cur) return 'done';
  if (idx === cur) {
    if (switchProgress.phase === 'error') return 'error';
    if (switchProgress.phase === 'success') return 'done';
    return 'running';
  }
  return 'pending';
}

// Tauri event listener handle；create new every time when clicking switch，release when dialog closed or unmounted
let switchProgressUnlisten: UnlistenFn | null = null;

// 卸loadcomponentwhenmustrelease放 listener，avoid "route switch → component destroy → event continue trigger" causing memory leak
onBeforeUnmount(async () => {
  if (switchProgressUnlisten) {
    switchProgressUnlisten();
    switchProgressUnlisten = null;
  }
});

// manually close dialog（only allow in non-running stage）
function closeSwitchProgress() {
  if (switchProgress.phase === 'running') return;
  switchProgress.visible = false;
  switchProgress.phase = 'idle';
  if (switchProgressUnlisten) {
    switchProgressUnlisten();
    switchProgressUnlisten = null;
  }
}

const isResettingCredits = ref(false);
const isUpdatingPlan = ref(false);
const billingData = ref<any>(null);
const showCreditHistoryDialog = ref(false);
const showSeatsResultDialog = ref(false);
const showAnalyticsDialog = ref(false);
const showTeamSettingsDialog = ref(false);
const showTeamManagementDialog = ref(false);
const showAutoRefillDialog = ref(false);
const showUpdatePlanDialog = ref(false);
const showTurnstileDialog = ref(false);
const pendingTurnstileToken = ref('');
const seatsResultData = ref<any>(null);

// check if it is paid plan（non- Free）
const isPaidPlan = computed(() => {
  const planName = props.account.plan_name?.toLowerCase();
  return planName && planName !== 'free';
});

const statusClass = computed(() => {
  // only when paid plan and subscription_active as false only thendisplayInactive
  if (isPaidPlan.value && props.account.subscription_active === false) return 'status-subscription-inactive';
  // check account disabled status
  if (props.account.is_disabled) return 'status-disabled';
  if (props.account.status === 'active') return 'status-active';
  if (props.account.status === 'inactive') return 'status-inactive';
  return 'status-error';
});

const statusText = computed(() => {
  // only when paid plan and subscription_active as false only thendisplayInactive
  if (isPaidPlan.value && props.account.subscription_active === false) return 'Inactive';
  // check account disabled status
  if (props.account.is_disabled) return 'Disabled';
  if (props.account.status === 'active') return 'Normal';
  if (props.account.status === 'inactive') return 'Offline';
  return 'Error';
});

// whether it isQuotapercentageMode (billing_strategy === 2 i.e. QUOTA)
const isQuotaMode = computed(() => props.account.billing_strategy === 2);

// whetherhasQuotadatacanshow（QUOTA Mode or  CREDITS Mode）
const hasQuotaData = computed(() => {
  if (isQuotaMode.value) {
    return props.account.daily_quota_remaining_percent !== undefined 
        || props.account.weekly_quota_remaining_percent !== undefined;
  }
  return !!props.account.total_quota;
});

// Quotapercentage（only  CREDITS Modeuse，representUsedproportion）
const quotaPercentage = computed(() => {
  if (!props.account.total_quota || !props.account.used_quota) return 0;
  return Math.min(Math.round((props.account.used_quota / props.account.total_quota) * 100), 100);
});

// Quotacolor（only  CREDITS Modeuse）
const quotaColor = computed(() => {
  const percentage = quotaPercentage.value;
  if (percentage < 50) return '#10b981';  // green
  if (percentage < 80) return '#f59e0b';  // orange
  return '#ef4444';  // red
});

// Daily Quota Remainingpercentage color（QUOTA Mode）
const dailyQuotaColor = computed(() => {
  const remaining = props.account.daily_quota_remaining_percent ?? 0;
  if (remaining > 50) return '#10b981';
  if (remaining > 20) return '#f59e0b';
  return '#ef4444';
});

// Weekly Quota Remainingpercentage color（QUOTA Mode）
const weeklyQuotaColor = computed(() => {
  const remaining = props.account.weekly_quota_remaining_percent ?? 0;
  if (remaining > 50) return '#10b981';
  if (remaining > 20) return '#f59e0b';
  return '#ef4444';
});

// formatQuotaResetTime
function formatResetTime(unixTimestamp: number | undefined): string {
  if (!unixTimestamp || unixTimestamp <= 0) return '';
  return dayjs.unix(unixTimestamp).format('MM-DD HH:mm');
}

// RefreshbuttonNoticetext
const refreshButtonTooltip = computed(() => {
  if (!props.account.token_expires_at) {
    return 'RefreshToken';
  }
  const isExpired = dayjs(props.account.token_expires_at).isBefore(dayjs());
  return isExpired ? 'RefreshToken（Expired）' : 'RefreshAccount Info（Tokenvalid）';
});

// Subscription ExpiresDateformat
const formattedExpiryDate = computed(() => {
  if (!props.account.subscription_expires_at) return '';
  return dayjs(props.account.subscription_expires_at).format('YYYY-MM-DD HH:mm');
});

// calculate距离toperioddayscount
const daysUntilExpiry = computed(() => {
  if (!props.account.subscription_expires_at) return null;
  const now = dayjs();
  const expiry = dayjs(props.account.subscription_expires_at);
  return expiry.diff(now, 'day');
});

// toperiodtext
const expiryText = computed(() => {
  const days = daysUntilExpiry.value;
  if (days === null) return '';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 7) return `${days}daysaftertoperiod`;
  return `Remaining${days}days`;
});

// toperiodstyleclass
const expiryClass = computed(() => {
  const days = daysUntilExpiry.value;
  if (days === null) return '';
  if (days < 0) return 'expired';
  if (days <= 7) return 'expiring-soon';
  return 'normal';
});

// Token Expirestype
const tokenExpiryType = computed(() => {
  if (!props.account.token_expires_at) return 'info';
  const expiry = dayjs(props.account.token_expires_at);
  const now = dayjs();
  const minutesUntilExpiry = expiry.diff(now, 'minutes');
  const hoursUntilExpiry = expiry.diff(now, 'hours');
  
  if (minutesUntilExpiry < 0) return 'danger';
  if (minutesUntilExpiry < 60) return 'warning';  // less than1hoursdisplayWarning
  if (hoursUntilExpiry <= 24) return 'warning';   // less than24hoursdisplayWarning
  return 'success';
});

// Token ExpiresNotice
const tokenExpiryTooltip = computed(() => {
  if (!props.account.token_expires_at) return 'noToken';
  const expiry = dayjs(props.account.token_expires_at);
  const now = dayjs();
  const minutesUntilExpiry = expiry.diff(now, 'minutes');
  const hoursUntilExpiry = expiry.diff(now, 'hours');
  const daysUntilExpiry = expiry.diff(now, 'days');
  
  if (minutesUntilExpiry < 0) return 'Expired';
  if (minutesUntilExpiry === 0) return 'Expiring soon（notenough1minutes）';
  if (minutesUntilExpiry < 5) return `Expiring soon（${minutesUntilExpiry}minutesafter）`;
  if (minutesUntilExpiry < 60) return `will be${minutesUntilExpiry}minutesafterExpired`;
  if (hoursUntilExpiry < 24) return `will be${hoursUntilExpiry}hoursafterExpired`;
  if (daysUntilExpiry <= 7) return `${daysUntilExpiry}daysafterExpired`;
  return `valid（${daysUntilExpiry}days）`;
});

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm');
}

// formatQuota（divide by100 and displaytwo decimal places）
function formatQuota(num: number | undefined | null) {
  if (!num) return '0.00';
  return (num / 100).toFixed(2);
}

function handleSelect(value: boolean) {
  emit('select', value);
}

// clickcardblankareatriggerselect
function handleCardClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  // check ifclick交互element
  const isInteractive = target.closest('button, a, input, .el-checkbox, .el-button, .el-tag, .el-tooltip, .el-icon');
  
  if (!isInteractive) {
    // clickblankarea，SwitchselectStatus
    emit('select', !props.isSelected);
  }
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(props.account.email);
    ElMessage.success('EmailCopied');
  } catch (error) {
    ElMessage.error('Copy failed');
  }
}

async function handleGetBilling() {
  isGettingBilling.value = true;
  try {
    const result = await apiService.getBilling(props.account.id);
    if (result.success) {
      // displayaccountsingleDialogbutnotisonly only Notice
      uiStore.openBillingDialog(props.account.id);
      // putaccountsingledatapass递giveDialog（cantoviastore or event）
      billingData.value = result;
    } else {
      ElMessage.error('accountsingleQuery failed');
    }
  } catch (error) {
    ElMessage.error(`Operation failed: ${error}`);
  } finally {
    isGettingBilling.value = false;
  }
}

async function handleShowCreditHistory() {
  showCreditHistoryDialog.value = true;
}

async function handleRefreshToken() {
  isRefreshing.value = true;
  try {
    // note：Devin Account and Firebase Accountunifyuse apiService.refreshToken()，backendalready by
    // auth_provider autodistribute（Devin use auth1_token 换new session_token + enrich，
    // Firebase use refresh_token/sign_in）， and unifyresponse use_lightweight_api Settings、
    // write OperationLog。noneedinbeforesideextradistinguish。

    // checkTokenwhetherExpired
    const isTokenExpired = !props.account.token_expires_at || 
                          dayjs(props.account.token_expires_at).isBefore(dayjs());
    
    if (isTokenExpired) {
      // TokenExpired，executeRefreshTokenOperation
      const result = await apiService.refreshToken(props.account.id);
      if (result.success) {
        // displaymoredetailedsuccessfulmessage
        const message = result.message || 'TokenRefreshsuccessful';
        if (result.old_expires_at && result.old_expires_at !== 'Unknown') {
          ElMessage.success({
            message: `${message}\noldExpiredTime: ${new Date(result.old_expires_at).toLocaleString()}\nnewExpiredTime: ${result.expires_at ? new Date(result.expires_at).toLocaleString() : 'Unknown'}`,
            duration: 3000,
            showClose: true
          });
        } else {
          ElMessage.success(message);
        }
        // TokenRefreshsuccessfulafter，re-fetchAccount Info（includenewtoken）
        try {
          const updatedAccount = await accountApi.getAccount(props.account.id);
          
          // mergeextraInfo
          if (result.token) {
            updatedAccount.token = result.token;
          }
          if (result.expires_at) {
            updatedAccount.token_expires_at = result.expires_at;
          }
          if (result.plan_name) {
            updatedAccount.plan_name = result.plan_name;
          }
          if (result.used_quota !== undefined) {
            updatedAccount.used_quota = result.used_quota;
          }
          if (result.total_quota !== undefined) {
            updatedAccount.total_quota = result.total_quota;
          }
          if (result.subscription_expires_at) {
            updatedAccount.subscription_expires_at = result.subscription_expires_at;
          }
          if (result.is_disabled !== undefined) {
            updatedAccount.is_disabled = result.is_disabled;
          }
          
          // directlyUpdatestoreinAccountdata，ensureimmediatelysync
          await accountsStore.updateAccount(updatedAccount);
          emit('update', updatedAccount);
        } catch (error) {
          console.error('Failed to get account info:', error);
          // ifnowayfetchmostnewAccount Info，usenowhasdataUpdate
          const updatedAccount = { ...props.account, status: 'active' as const };
          if (result.token) {
            updatedAccount.token = result.token;
          }
          if (result.expires_at) {
            updatedAccount.token_expires_at = result.expires_at;
          }
          if (result.is_disabled !== undefined) {
            updatedAccount.is_disabled = result.is_disabled;
          }
          await accountsStore.updateAccount(updatedAccount);
          emit('update', updatedAccount);
        }
      } else {
        ElMessage.error('TokenRefresh failed');
      }
    } else {
      // Tokenstill然valid，onlyRefreshAccount Info
      const result = await apiService.getCurrentUser(props.account.id);
      if (result.success && result.user_info) {
        ElMessage.success({
          message: `Account Infoalready Update\nTokenExpiry至: ${new Date(props.account.token_expires_at!).toLocaleString()}`,
          duration: 2500,
          showClose: true
        });
        
        // Update account info
        const updatedAccount = { ...props.account, status: 'active' as const };
        
        // UpdateUserBasic Info（containsapi_key and DisableStatus）
        if (result.user_info.user?.api_key) {
          updatedAccount.windsurf_api_key = result.user_info.user.api_key;
        }
        // UpdateAccountDisableStatus
        if (result.user_info.user?.disable_codeium !== undefined) {
          updatedAccount.is_disabled = result.user_info.user.disable_codeium;
        }
        
        // UpdatePlanInfo
        if (result.user_info.plan?.plan_name) {
          updatedAccount.plan_name = result.user_info.plan.plan_name;
        }
        // from plan inread billing_strategy
        if (result.user_info.plan?.billing_strategy !== undefined) {
          updatedAccount.billing_strategy = result.user_info.plan.billing_strategy;
        }
        
        // merge plan_status innewQuotafield（avoidcoverbackendalready Savedata）
        if (result.plan_status) {
          if (result.plan_status.billing_strategy !== undefined) {
            updatedAccount.billing_strategy = result.plan_status.billing_strategy;
          }
          if (result.plan_status.daily_quota_remaining_percent !== undefined) {
            updatedAccount.daily_quota_remaining_percent = result.plan_status.daily_quota_remaining_percent;
          }
          if (result.plan_status.weekly_quota_remaining_percent !== undefined) {
            updatedAccount.weekly_quota_remaining_percent = result.plan_status.weekly_quota_remaining_percent;
          }
          if (result.plan_status.daily_quota_reset_at_unix !== undefined) {
            updatedAccount.daily_quota_reset_at_unix = result.plan_status.daily_quota_reset_at_unix;
          }
          if (result.plan_status.weekly_quota_reset_at_unix !== undefined) {
            updatedAccount.weekly_quota_reset_at_unix = result.plan_status.weekly_quota_reset_at_unix;
          }
          if (result.plan_status.overage_balance_micros !== undefined) {
            updatedAccount.overage_balance_micros = result.plan_status.overage_balance_micros;
          }
        }
        
        // UpdateQuotaInfo
        if (result.user_info.subscription) {
          if (result.user_info.subscription.used_quota !== undefined) {
            updatedAccount.used_quota = result.user_info.subscription.used_quota;
          }
          if (result.user_info.subscription.quota !== undefined) {
            updatedAccount.total_quota = result.user_info.subscription.quota;
          }
          if (result.user_info.subscription.expires_at) {
            const expiresTimestamp = result.user_info.subscription.expires_at;
            const expiresDate = dayjs.unix(expiresTimestamp);
            updatedAccount.subscription_expires_at = expiresDate.toISOString();
          }
          // UpdateSubscriptionactivateStatus
          if (result.user_info.subscription.subscription_active !== undefined) {
            updatedAccount.subscription_active = result.user_info.subscription.subscription_active;
          }
        }
        
        updatedAccount.last_quota_update = dayjs().toISOString();
        // Savetobackenddatalibrary
        await accountsStore.updateAccount(updatedAccount);
        emit('update', updatedAccount);
      } else {
        // displaydetailedError Info
        const statusCode = result.status_code;
        const errorMsg = result.error || 'Unknown error';
        if (statusCode === 401) {
          // Token actualInvalid，tryAuto Refresh
          console.log('[AccountCard] Token Invalid (401)，tryAuto Refresh...');
          const refreshResult = await apiService.refreshToken(props.account.id);
          if (refreshResult.success) {
            ElMessage.success({
              message: 'Tokenalready Auto Refresh，pleasere-Operation',
              duration: 3000,
              showClose: true
            });
            // Update account info
            const updatedAccount = { ...props.account, status: 'active' as const };
            if (refreshResult.token) {
              updatedAccount.token = refreshResult.token;
            }
            if (refreshResult.expires_at) {
              updatedAccount.token_expires_at = refreshResult.expires_at;
            }
            await accountsStore.updateAccount(updatedAccount);
            emit('update', updatedAccount);
          } else {
            ElMessage.error({
              message: `TokenInvalidandRefresh failed\npossiblyneedre-Login`,
              duration: 5000,
              showClose: true
            });
            // UpdateAccountStatusasError
            const errorAccount = { ...props.account, status: 'error' as const };
            await accountsStore.updateAccount(errorAccount);
            emit('update', errorAccount);
          }
        } else {
          ElMessage.error({
            message: `Failed to get account info (${statusCode || 'Unknown'})\n${errorMsg}`,
            duration: 5000,
            showClose: true
          });
          // UpdateAccountStatusasError
          const errorAccount = { ...props.account, status: 'error' as const };
          await accountsStore.updateAccount(errorAccount);
          emit('update', errorAccount);
        }
      }
    }
  } catch (error) {
    ElMessage.error(`Operation failed: ${error}`);
  } finally {
    isRefreshing.value = false;
  }
}

async function handleLogin() {
  try {
    const result = await apiService.loginAccount(props.account.id);
    if (result.success) {
      ElMessage.success('Loginsuccessful');
      
      // re-frombackendfetchcompleteAccountdata（includenew token  and  refresh_token）
      try {
        const updatedAccount = await accountApi.getAccount(props.account.id);
        
        // mergeBackextraInfo
        if (result.expires_at) {
          updatedAccount.token_expires_at = result.expires_at;
        }
        if (result.plan_name) {
          updatedAccount.plan_name = result.plan_name;
        }
        if (result.used_quota !== undefined) {
          updatedAccount.used_quota = result.used_quota;
        }
        if (result.total_quota !== undefined) {
          updatedAccount.total_quota = result.total_quota;
        }
        if (result.subscription_expires_at) {
          updatedAccount.subscription_expires_at = result.subscription_expires_at;
        }
        if (result.is_disabled !== undefined) {
          updatedAccount.is_disabled = result.is_disabled;
        }
        updatedAccount.last_quota_update = dayjs().toISOString();
        
        // Update store inAccountdata
        await accountsStore.updateAccount(updatedAccount);
        emit('update', updatedAccount);
      } catch (error) {
        console.error('Failed to get account info:', error);
        // iffetchfailed，use基thisUpdate
        const updatedAccount = { 
          ...props.account, 
          status: 'active' as const,
          token_expires_at: result.expires_at,
          last_login_at: dayjs().toISOString()
        };
        if (result.plan_name) updatedAccount.plan_name = result.plan_name;
        if (result.used_quota !== undefined) updatedAccount.used_quota = result.used_quota;
        if (result.total_quota !== undefined) updatedAccount.total_quota = result.total_quota;
        if (result.subscription_expires_at) updatedAccount.subscription_expires_at = result.subscription_expires_at;
        emit('update', updatedAccount);
      }
    } else {
      ElMessage.error('Login failed');
    }
  } catch (error) {
    ElMessage.error(`Login failed: ${error}`);
  }
}

function handleEdit() {
  uiStore.openEditAccountDialog(props.account.id);
}

// ==================== Firebase ↔ Devin Login Methodmutual convert ====================

/** CurrentAccountconvertbutton tooltip text（by auth_provider dynamic） */
const convertActionLabel = computed(() => {
  return props.account.auth_provider === 'devin'
    ? 'convert to Firebase Login Method'
    : 'convert to Devin Login Method';
});

const isConvertingAuth = ref(false);

/**
 * from orgs ListpopupboxletUserselectonegrouporg，Backselected org_id；UserCancelBack null。
 *
 * used for Firebase→Devin convertwhen企sideBackmultiple org secondary交互。这inuselightweight
 * ElMessageBox + h() render radio list，avoidquote入extra dialog component。
 */
async function selectOrgInteractively(
  orgs: Array<{ id: string; name: string }>,
): Promise<string | null> {
  if (!orgs.length) return null;
  if (orgs.length === 1) return orgs[0].id;

  const selected = ref<string>(orgs[0].id);
  try {
    await ElMessageBox({
      title: 'selectgrouporg',
      message: () =>
        h('div', { style: 'display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto;' },
          orgs.map((org) =>
            h(
              'label',
              {
                style: 'display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 8px; border-radius: 4px; border: 1px solid var(--el-border-color-light);',
              },
              [
                h('input', {
                  type: 'radio',
                  name: 'convert-org',
                  value: org.id,
                  checked: selected.value === org.id,
                  onChange: () => {
                    selected.value = org.id;
                  },
                }),
                h('div', { style: 'flex: 1; min-width: 0;' }, [
                  h('div', { style: 'font-weight: 500;' }, org.name || '(notnamednamegrouporg)'),
                  h('div', { style: 'font-size: 12px; color: var(--el-text-color-secondary); word-break: break-all;' }, org.id),
                ]),
              ],
            ),
          ),
        ),
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      showCancelButton: true,
      customClass: 'convert-org-select-dialog',
    });
  } catch {
    return null;
  }
  return selected.value || null;
}

/**
 * convertCurrentAccountLoginsystem（Firebase ↔ Devin）
 *
 * internalbyCurrent auth_provider dispatch：
 * - Devin Account → convert_account_to_firebase
 * - Firebase Account → convert_account_to_devin，multiplegroupwhen orgpopupselectafteragaintimecall and pass orgId
 *
 * failedwhenlocalAccountfieldnotchange（backendalready implementoriginalchildproperty）。
 */
async function handleConvertAuthProvider() {
  const isDevin = props.account.auth_provider === 'devin';
  const targetLabel = isDevin ? 'Firebase' : 'Devin';
  const sourceLabel = isDevin ? 'Devin' : 'Firebase';

  try {
    await ElMessageBox.confirm(
      `i.e.willwillAccount ${props.account.nickname || props.account.email} Login Methodfrom 【${sourceLabel}】 convert to 【${targetLabel}】。\n\n` +
        `OperationwillcomplexuseAccountstored plaintextPasswordcall ${targetLabel} officialLoginAPI，successfulthen autoSwitch Accountfield。\n` +
        `failedwhen帐fieldmaintainnotchange。\n\nConfirmcontinue?？`,
      `convert to ${targetLabel} Login Method`,
      {
        confirmButtonText: `convert to ${targetLabel}`,
        cancelButtonText: 'Cancel',
        type: 'warning',
      },
    );
  } catch {
    return;
  }

  isConvertingAuth.value = true;
  try {
    if (isDevin) {
      const result = await devinApi.convertAccountToFirebase({ id: props.account.id });
      if (result.success) {
        ElMessage.success(result.message || 'already convert to Firebase Loginsystem');
        await accountsStore.loadAccounts();
      } else if (result.already_converted) {
        ElMessage.info(result.message || 'Accountalready is Firebase system');
      } else {
        ElMessage.warning(result.message || 'convertnotDone');
      }
      return;
    }

    // Firebase → Devin：firsttimecallnotpass orgId
    let result = await devinApi.convertAccountToDevin({ id: props.account.id });

    // multiplegrouporgbranch：popupselectafteragaintimecall and pass orgId
    if (result.requires_org_selection && result.orgs && result.orgs.length > 0) {
      const chosenOrgId = await selectOrgInteractively(result.orgs);
      if (!chosenOrgId) {
        ElMessage.info('Multi-organization selection cancelled');
        return;
      }
      result = await devinApi.convertAccountToDevin({
        id: props.account.id,
        orgId: chosenOrgId,
      });
    }

    if (result.success) {
      ElMessage.success(result.message || 'already convert to Devin Loginsystem');
      await accountsStore.loadAccounts();
    } else if (result.already_converted) {
      ElMessage.info(result.message || 'Accountalready is Devin system');
    } else {
      ElMessage.warning(result.message || 'convertnotDone');
    }
  } catch (error: any) {
    ElMessage.error(`convertLogin Methodfailed：${error?.message || error || 'Unknown error'}`);
  } finally {
    isConvertingAuth.value = false;
  }
}

function handleAccountInfo() {
  // directlyopenAccountInfoDialog
  uiStore.openAccountInfoDialog(props.account.id);
}

function handleShowAnalytics() {
  // displayuseAnalysisDialog
  showAnalyticsDialog.value = true;
}

function handleTeamSettings() {
  // displayTeam SettingsDialog
  showTeamSettingsDialog.value = true;
}

function handleTeamManagement() {
  showTeamManagementDialog.value = true;
}

function handleAutoRefill() {
  // displayAuto RechargeSettingsDialog
  showAutoRefillDialog.value = true;
}

// Batch ResetTeam MembersCredits
async function handleBatchResetTeamCredits() {
  isResettingCredits.value = true;
  try {
    // Step 1: fetchTeam MembersList
    const membersResult = await invoke<any>('get_team_members', {
      id: props.account.id,
      groupId: null
    });
    
    if (!membersResult.success) {
      ElMessage.error(membersResult.error || 'fetchTeam Membersfailed');
      return;
    }
    
    const data = membersResult.data || {};
    let users = data.subMesssage_1 || [];
    if (users && !Array.isArray(users)) {
      users = [users];
    }
    let userRoles = data.subMesssage_2 || [];
    if (userRoles && !Array.isArray(userRoles)) {
      userRoles = [userRoles];
    }
    
    // buildMemberList and exclude self
    interface TeamMember {
      api_key: string;
      name: string;
      email: string;
    }
    const otherMembers: TeamMember[] = [];
    const currentEmail = props.account.email?.toLowerCase();
    
    for (const user of users) {
      const apiKey = user.string_1 || '';
      const name = user.string_2 || '';
      const email = user.string_3 || '';
      const teamStatus = user.int_8 || 0;
      
      // onlyAddApprovedMember， and exclude self（CurrentAccount）
      if (teamStatus !== 1 && email.toLowerCase() !== currentEmail) {
        otherMembers.push({ api_key: apiKey, name, email });
      }
    }
    
    if (otherMembers.length === 0) {
      ElMessage.warning('no availableResetTeam Members');
      return;
    }
    
    // ConfirmOperation
    try {
      await ElMessageBox.confirm(
        `Confirmneed toReset ${otherMembers.length} Team MembersCredits?？\nthisOperationwillremove and Re-invitetheseMember。`,
        'Batch Reset Team Credits',
        {
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      );
    } catch {
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Step 2: iterateallotherMemberexecuteReset
    for (const member of otherMembers) {
      try {
        // Remove Member
        const removeResult = await invoke<any>('remove_team_member', {
          id: props.account.id,
          memberApiKey: member.api_key
        });
        
        if (!removeResult.success) {
          console.error(`Remove Member ${member.name} failed:`, removeResult.error);
          failCount++;
          continue;
        }
        
        // Re-invite
        const inviteResult = await invoke<any>('invite_team_members', {
          id: props.account.id,
          users: [{ name: member.name, email: member.email }]
        });
        
        if (!inviteResult.success) {
          console.error(`Invite Members ${member.name} failed:`, inviteResult.error);
          failCount++;
          continue;
        }
        
        // auto accept invitation（ifEmailinManagementmanagerin）
        try {
          const accounts = await invoke<any[]>('get_all_accounts');
          const matchedAccount = accounts.find((acc: any) => 
            acc.email?.toLowerCase() === member.email.toLowerCase()
          );
          
          if (matchedAccount) {
            await invoke<any>('accept_invitation', {
              id: matchedAccount.id,
              approvalId: ''
            });
          }
        } catch (e) {
          console.log(`auto accept invitationfailed (${member.email}):`, e);
        }
        
        successCount++;
      } catch (error) {
        console.error(`handleMember ${member.name} error when:`, error);
        failCount++;
      }
    }
    
    // Show Results
    if (failCount === 0) {
      ElMessage.success(`successfulReset ${successCount} Team MembersCredits`);
    } else {
      ElMessage.warning(`ResetDone：successful ${successCount} ，failed ${failCount} `);
    }
    
    // RefreshAccountInfo
    accountsStore.refreshAccountToken(props.account);
  } catch (error: any) {
    ElMessage.error('Batch Reset Team Creditsfailed: ' + error.toString());
  } finally {
    isResettingCredits.value = false;
  }
}

// changeSubscription
function handleUpdatePlan() {
  showUpdatePlanDialog.value = true;
}

// changeSubscriptionsuccessfulbackcall
function handleUpdatePlanSuccess() {
  accountsStore.refreshAccountToken(props.account);
}

// fetchtrialbind cardlink - all trial sign约allneed Turnstile Verify
//
// Windsurf backend `SubscribeToPlan` for `start_trial=true` allplan（Pro/Max/Teams/Devin…）
// allforce captcha validate（Errorcode `failed_precondition` + `captcha required for trial signup`）。
// 早periodonly when Pro use trial、codecodeinby tier routing popup Turnstile ishistory遗留，nowunify成：
// - `startTrial=true` → mustfirstpass Turnstile get token againpleaserequire
// - `startTrial=false`（directlypaid subscription）→ backendnotneed torequire captcha，directlysendpleaserequire
function handleGetTrialLink() {
  const startTrial = settingsStore.settings?.startTrial ?? true;

  if (startTrial) {
    showTurnstileDialog.value = true;
  } else {
    // directlypaid subscription，noneed captcha
    handleTurnstileSuccess('');
  }
}

// Turnstile Verifysuccessfulafterhandle
async function handleTurnstileSuccess(turnstileToken: string) {
  pendingTurnstileToken.value = turnstileToken;
  showTurnstileDialog.value = false;
  
  isGettingTrialLink.value = true;
  try {
    // fromSettingsinreadSubscription参count
    const teamsTier = settingsStore.settings?.subscriptionPlan ?? 2; // default Pro
    const paymentPeriod = settingsStore.settings?.paymentPeriod ?? 1; // defaultMonthly
    // Team/EnterpriseclassplanneedTeam Name，personplannotSettings
    const teamTiers = [1, 3, 4, 5, 7, 10, 11, 12, 14, 15];
    const teamName = teamTiers.includes(teamsTier) ? (settingsStore.settings?.teamName || undefined) : undefined;
    const seatCount = settingsStore.settings?.seatCount ?? 1;
    const startTrial = settingsStore.settings?.startTrial ?? true;
    
    // check ifEnableautoopenpaymentPage
    const autoOpen = settingsStore.settings?.autoOpenPaymentLinkInWebview || false;
    const autoFill = settingsStore.settings?.autoFillPaymentForm || false;
    const autoSubmit = settingsStore.settings?.autoSubmitPaymentForm || false;
    
    // ifEnableautoopen，useenhanceAPI
    if (autoOpen) {
      // fromstoreinfetchmostnewAccountdata，ensuretokenismostnew
      const latestAccount = accountsStore.accounts.find(a => a.id === props.account.id);
      const account = latestAccount || props.account;
      
      if (!account.token) {
        ElMessage.warning('please firstRefreshTokenthen try again');
        isGettingTrialLink.value = false;
        return;
      }
      
      // useenhancepaymentAPI
      const { getTrialPaymentLink, autoFillPaymentForm } = await import('@/utils/cardGenerator');
      
      const result = await getTrialPaymentLink(
        account.nickname || account.email,
        account.token,
        true, // autoopenwindow
        teamsTier,
        paymentPeriod,
        startTrial,
        teamName,
        teamTiers.includes(teamsTier) ? seatCount : undefined, // Team/EnterpriseclassplanneedSeat
        turnstileToken || undefined // trial sign约whenallplanallneed Turnstile token
      );
      
      if (result.success && result.window_opened) {
        ElMessage.success('paymentwindowalready inChromeIncognito Modeunderopen');
        
        // ifEnableauto fill form
        if (autoFill && result.virtual_card && result.window_label) {
          // immediatelyinjectfill inscript（onlywait1secondsletwindowLoading）
          setTimeout(async () => {
            try {
              console.log('startauto fill form，windowTags:', result.window_label);
              
              // viaTauricommandinjectformfill incodecode
              await autoFillPaymentForm(result.window_label, result.virtual_card);
              
              ElMessage.success('currentlyautofill inVirtual CardInfo...');
              
              // ifEnableautoSubmit，injectautoSubmitscript
              if (autoSubmit) {
                console.log('prepareautoSubmitform...');
                await invoke('inject_auto_submit_script', { 
                  windowLabel: result.window_label 
                });
                ElMessage.warning('EnabledautoSubmit，pleasenote观察paymentflow');
              }
              
              // based onSettingsdecidewhetherdisplayVirtual CardInfo
              const showCardInfo = settingsStore.settings?.showVirtualCardInfo || false;
              if (showCardInfo) {
                ElMessageBox.alert(
                  `<div style="text-align: left; font-family: monospace;">
                    <p><strong>Card Number:</strong> ${result.virtual_card.card_number}</p>
                    <p><strong>Expiry:</strong> ${result.virtual_card.expiry_date}</p>
                    <p><strong>CVC:</strong> ${result.virtual_card.cvv}</p>
                    <p><strong>Name:</strong> ${result.virtual_card.cardholder_name}</p>
                    <p><strong>Address:</strong> ${result.virtual_card.billing_address.street_address}</p>
                    <p><strong>City:</strong> ${result.virtual_card.billing_address.city}, ${result.virtual_card.billing_address.state} ${result.virtual_card.billing_address.postal_code}</p>
                  </div>`,
                  'Virtual CardInfo（only used fortest）',
                  {
                    dangerouslyUseHTMLString: true,
                    confirmButtonText: 'Confirm',
                    type: 'warning',
                  }
                );
              }
            } catch (fillError) {
              console.error('auto fill formfailed:', fillError);
            }
          }, 1000); // fixed1secondsdelay，no longerusepageDelay
        }
      } else {
        ElMessage.error(result.error || 'openpaymentwindowfailed');
      }
    } else {
      // useoriginalhasAPI
      const result = await apiService.getTrialPaymentLink(
        props.account.id, 
        teamsTier,
        paymentPeriod,
        startTrial,
        teamName,
        teamTiers.includes(teamsTier) ? seatCount : undefined,
        turnstileToken || undefined
      );

      if (result.success && result.stripe_url) {
        // Copylinktoclipboard
        try {
          await navigator.clipboard.writeText(result.stripe_url);
          ElMessage.success('StripepaymentlinkCopied to clipboard');

          // fetchSettings
          const autoOpen = settingsStore.settings?.autoOpenBrowser ?? true;
          const browserMode = settingsStore.settings?.browserMode ?? 'incognito';
          const isIncognito = browserMode === 'incognito';
          const modeText = isIncognito ? 'Incognito Mode' : 'Normal Mode';
          const openCommand = isIncognito ? 'open_external_link_incognito' : 'open_external_link';

          if (autoOpen) {
            // autoopenbrowser
            try {
              await invoke(openCommand, { url: result.stripe_url });
              ElMessage.success(`Opened in browser${modeText} opened in`);
            } catch (err) {
              ElMessage.error('Failed to open browser, please open the link manually');
              console.error('Failed to open link:', err);
            }
          } else {
            // askwhetherinbrowser opened in
            ElMessageBox.confirm(
              `linkCopied to clipboard，whetherinbrowser${modeText} opened in？`,
              'openlink',
              {
                confirmButtonText: 'open',
                cancelButtonText: 'Cancel',
                type: 'info',
              }
            ).then(async () => {
              try {
                await invoke(openCommand, { url: result.stripe_url });
                ElMessage.success(`Opened in browser${modeText} opened in`);
              } catch (err) {
                ElMessage.error('Failed to open browser, please open the link manually');
                console.error('Failed to open link:', err);
              }
            }).catch(() => {
              // UserCancel，notdoanyOperation
            });
          }
        } catch (clipboardError) {
          // ifCopy failed，directlydisplaylink
          const browserMode = settingsStore.settings?.browserMode ?? 'incognito';
          const isIncognito = browserMode === 'incognito';
          const modeText = isIncognito ? 'Incognito Mode' : 'Normal Mode';
          const openCommand = isIncognito ? 'open_external_link_incognito' : 'open_external_link';
          
          ElMessageBox.alert(
            `<div style="word-break: break-all;">${result.stripe_url}</div>`,
            'Stripepaymentlink',
            {
              dangerouslyUseHTMLString: true,
              confirmButtonText: `in${modeText} opened in`,
            }
          ).then(async () => {
            try {
              await invoke(openCommand, { url: result.stripe_url });
              ElMessage.success(`Opened in browser${modeText} opened in`);
            } catch (err) {
              ElMessage.error('Failed to open browser, please open the link manually');
              console.error('Failed to open link:', err);
            }
          });
        }
      } else {
        ElMessage.error(result.error || 'fetchpaymentlinkfailed');
      }
    }
  } catch (error) {
    ElMessage.error(`fetchpaymentlinkfailed: ${error}`);
  } finally {
    isGettingTrialLink.value = false;
  }
}

// checkProTrial Eligibility
//
// note：Windsurf backendforExpiredbut JWT structure合way Firebase ID Token stillpossiblyBack 200 + qualifiedresponse
// （suspectedonly solve payload get uid notvalidate exp/signname）。becausethiscallbeforemustvia get_account_valid_token
// forceRefresh token，ensurepassgivebackendalwaysisvalid token；refresh failedthendirectlyerror report，no longeruselocal
// possiblyExpired account.token，avoidfalse positive"hasTrial Eligibility"。
async function handleCheckProTrial() {
  if (!props.account.token) {
    ElMessage.warning('AccountnotLogin，please firstRefreshToken');
    return;
  }

  isCheckingProTrial.value = true;
  try {
    // Step 1: forcegotthroughpass ensure_valid_token Refreshaftervalid token
    const tokenResult = await invoke('get_account_valid_token', { id: props.account.id }) as any;
    if (!tokenResult?.success || !tokenResult?.token) {
      ElMessage.error('Token InvalidandnowayRefresh，pleasere-LoginAccountthen try again');
      return;
    }

    // Step 2: usenew token pleaserequirebackend
    const result = await invoke('check_pro_trial_eligibility', {
      authToken: tokenResult.token
    }) as any;

    if (result.success) {
      if (result.is_eligible) {
        // AddTrial EligibilityTags
        const tagName = 'Trial Eligibility';
        const tagColor = '#E6A23C';

        // check ifalready hastheTags
        const hasTag = props.account.tags.includes(tagName);

        if (!hasTag) {
          await invoke('batch_update_account_tags', {
            accountIds: [props.account.id],
            addTags: [tagName],
            removeTags: []
          });

          // ensureglobalTagssavein
          try {
            await invoke('add_tag', { name: tagName, color: tagColor });
          } catch {
            // TagspossiblyAlready exists
          }

          // Update account infotriggerRefresh
          const updatedAccount = { ...props.account, tags: [...props.account.tags, tagName] };
          emit('update', updatedAccount);
          ElMessage.success(result.message || 'youhasqualificationFreetrialPro！already Add Tag');
        } else {
          ElMessage.success(result.message || 'youhasqualificationFreetrialPro！（TagsAlready exists）');
        }
      } else {
        // backendConfirmnoqualification：ifAccountonresidualhistory"Trial Eligibility"Tags，primary动cleanupmaintaindataconsistent
        const tagName = 'Trial Eligibility';
        if (props.account.tags.includes(tagName)) {
          try {
            await invoke('batch_update_account_tags', {
              accountIds: [props.account.id],
              addTags: [],
              removeTags: [tagName],
            });
            const updatedAccount = {
              ...props.account,
              tags: props.account.tags.filter((t) => t !== tagName),
            };
            emit('update', updatedAccount);
            ElMessage.info(`${result.message || 'You have noProTrial Eligibility'}，Removed"${tagName}"Tags`);
          } catch (e) {
            console.error('[handleCheckProTrial] removeTagsfailed:', e);
            ElMessage.warning(`${result.message || 'You have noProTrial Eligibility'}，butremovehistoryTagsfailed: ${e}`);
          }
        } else {
          ElMessage.info(result.message || 'You have noProTrial Eligibility');
        }
      }
    } else {
      ElMessage.error(`Check failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('[handleCheckProTrial] Exception:', error);
    ElMessage.error(`Check failed: ${error}`);
  } finally {
    isCheckingProTrial.value = false;
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      `Confirmneed toDeleteAccount ${props.account.nickname} (${props.account.email}) ?？`,
      'DeleteConfirm',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    
    await accountsStore.deleteAccount(props.account.id);
    ElMessage.success('AccountDeletesuccessful');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Delete failed: ${error}`);
    }
  }
}

async function handleDeleteWindsurfUser() {
  try {
    await ElMessageBox.confirm(
      `Confirmneed toDelete Windsurf User ${props.account.email} ?？\n\n⚠️ thisOperationwillfrom Windsurf ServeronDeletetheUserAccount！`,
      'Delete Windsurf User',
      {
        confirmButtonText: 'Confirm Delete',
        cancelButtonText: 'Cancel',
        type: 'error',
      }
    );
    
    deletingUser.value = true;
    const result = await invoke('delete_windsurf_user', { id: props.account.id }) as any;
    
    if (result.success) {
      ElMessage.success('Windsurf UserDeleted');
    } else {
      ElMessage.error(result.error || 'Delete failed');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Delete failed: ${error}`);
    }
  } finally {
    deletingUser.value = false;
  }
}

async function handleSwitchAccount() {
  const isSeamless = settingsStore.settings?.seamlessSwitchEnabled === true;
  const displayName = props.account.nickname || props.account.email;
  
  const confirmMessage = isSeamless
    ? `Confirmneed tonosenseSwitchtoAccount ${displayName} ?？\n\nthisOperationwill：\n• autoLogin and ResetmachineID\n• noneedrestartClient\n• maintainCurrentworkStatus`
    : `Confirmneed toSwitchtoAccount ${displayName} ?？\n\nthisOperationwill：\n• autodetectClientpath and EnableSeamless Switch\n• autoLogin and ResetmachineID`;

  // firsthandleConfirm：UserCanceldirectlyBack，nottouchprogressStatus
  try {
    await ElMessageBox.confirm(
      confirmMessage,
      isSeamless ? 'nosenseswitch' : 'Switch AccountConfirm',
      {
        confirmButtonText: 'ConfirmSwitch',
        cancelButtonText: 'Cancel',
        type: 'info',
      }
    );
  } catch {
    return; // UserCancel
  }

  // initializeprogressdialogStatus（running state，percent=0 waitbackend#once emit）
  switchProgress.visible = true;
  switchProgress.accountName = displayName;
  switchProgress.step = '';
  switchProgress.label = 'waitbackendstart...';
  switchProgress.percent = 0;
  switchProgress.phase = 'running';

  // Register Tauri event listener —— must be in invoke ofbefore，nothenwill错passbackendfirst 5% "preparing" event
  //
  // defensepropertyrelease放old listener：preventononceswitchexceptionExitwhen遗留under来 handler againtimetrigger。
  // note：backend emit isglobalbroadcast，allcurrentlylisten AccountCard allwill收tosameoneevent；
  // butbecauseIsonlyinclickswitchinstantRegister、Doneafterimmediatelynotecancel，Normalusenotwillappeardoublelisten。
  if (switchProgressUnlisten) {
    switchProgressUnlisten();
    switchProgressUnlisten = null;
  }
  switchProgressUnlisten = await listen<SwitchProgressEventPayload>('switch-progress', (e) => {
    const p = e.payload;
    switchProgress.step = p.step;
    switchProgress.label = p.label;
    switchProgress.percent = p.percent;
    switchProgress.phase = p.phase;
  });

  isSwitching.value = true;
  try {
    const result = await apiService.switchAccount(props.account.id);

    if (result.success) {
      // fallbacksyncmostendstate：ifeventlater than invoke Backnotarrive，manuallysetas success
      // typeassert bypass TS for Vue reactive attribute literal narrowing（assignvalueafter TS misidentifyas phase always 'running'）
      const currentPhase = switchProgress.phase as SwitchProgressPhase;
      if (currentPhase !== 'error') {
        switchProgress.percent = 100;
        switchProgress.phase = 'success';
        switchProgress.step = 'done';
        switchProgress.label = result.message || 'SwitchDone';
      }

      ElMessage.success({
        message: result.message || 'already successfulSwitch Account',
        duration: 5000,
        showClose: true
      });

      if (result.auto_enabled_seamless) {
        await settingsStore.loadSettings();
        ElMessage.info({
          message: 'already autoEnableSeamless Switch，subsequentswitchwillmoremore smooth',
          duration: 5000,
          showClose: true
        });
      }

      if (!result.seamless_patch_active) {
        if (result.machine_id_reset === false) {
          ElMessage.warning({
            message: 'Notice：machineIDnotReset（possiblyneedManagementPermission），butAccountSwitchalready successful',
            duration: 6000,
            showClose: true
          });
        }
        if (result.auth_token) {
          ElMessage.info({
            message: 'ifClientnotautoLogin，pleaseensureClientalready open',
            duration: 5000,
            showClose: true
          });
        }
      }

      const updatedAccount = {
        ...props.account,
        status: 'active' as const,
        last_login_at: dayjs().toISOString()
      };
      emit('update', updatedAccount);

      // successfulafterdelayautodisabledprogressdialog，giveUseronecansense知"Done"feedback
      setTimeout(() => {
        if (switchProgress.phase === 'success') {
          closeSwitchProgress();
        }
      }, 1200);
    } else {
      // businessfailed（success=false）：maintaindialogopen、switch to error state，letUserwatchfailedpointaftermanuallydisabled
      const currentPhase = switchProgress.phase as SwitchProgressPhase;
      if (currentPhase !== 'error') {
        switchProgress.phase = 'error';
        switchProgress.label = result.error || 'Switch account failed';
      }
      ElMessage.error(result.error || 'Switch account failed');
    }
  } catch (error) {
    // invoke levelexception（rarelysee），samesamplefeedbacktodialogon
    if (error !== 'cancel') {
      switchProgress.phase = 'error';
      switchProgress.label = `Switch account failed: ${error}`;
      ElMessage.error(`Switch account failed: ${error}`);
    }
  } finally {
    isSwitching.value = false;
  }
}

</script>

<style scoped>
.account-card {
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.account-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 10px;
  box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0);
  opacity: 0;
  transition: opacity 0.3s ease, box-shadow 0.3s ease;
  pointer-events: none;
}

/* hoverStatus - optimalelegantonfloat */
.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.account-card:hover::before {
  opacity: 1;
  box-shadow: inset 0 0 0 1px rgba(100, 116, 139, 0.15);
}

/* selectedStatus - tech blue (Selected) */
.account-card.selected {
  border-color: transparent;
  background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);
  box-shadow: 
    0 4px 12px rgba(59, 130, 246, 0.15),
    0 0 0 1px rgba(59, 130, 246, 0.1);
}

.account-card.selected::before {
  box-shadow: 
    inset 0 0 0 2px rgba(59, 130, 246, 0.6),
    inset 0 0 12px rgba(59, 130, 246, 0.1);
  opacity: 1;
}

/* CurrentactivateAccount - amber gold (Using) */
.account-card.current {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  box-shadow: 
    0 4px 12px rgba(245, 158, 11, 0.15),
    0 0 0 1px rgba(245, 158, 11, 0.1);
}

.account-card.current::before {
  box-shadow: 
    inset 0 0 0 2px rgba(245, 158, 11, 0.6),
    inset 0 0 12px rgba(245, 158, 11, 0.15);
  opacity: 1;
}

.account-card.current:hover,
.account-card.selected:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* DisabledAccount - redWarning */
.account-card.is-disabled {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  box-shadow: 
    0 4px 12px rgba(239, 68, 68, 0.15),
    0 0 0 1px rgba(239, 68, 68, 0.1);
}

.account-card.is-disabled::before {
  box-shadow: 
    inset 0 0 0 2px rgba(239, 68, 68, 0.5),
    inset 0 0 12px rgba(239, 68, 68, 0.1);
  opacity: 1;
}

.account-card.is-disabled:hover {
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
}

/* Subscription inactive - graystyle */
.account-card.subscription-inactive {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  box-shadow: 
    0 4px 12px rgba(100, 116, 139, 0.15),
    0 0 0 1px rgba(100, 116, 139, 0.1);
  filter: grayscale(30%);
}

.account-card.subscription-inactive::before {
  box-shadow: 
    inset 0 0 0 2px rgba(100, 116, 139, 0.3),
    inset 0 0 12px rgba(100, 116, 139, 0.1);
  opacity: 1;
}

.account-card.subscription-inactive:hover {
  box-shadow: 0 8px 24px rgba(100, 116, 139, 0.2);
  filter: grayscale(20%);
}

/* drag handlestyle */
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 6px;
  cursor: grab;
  color: #94a3b8;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.drag-handle:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.drag-handle:active {
  cursor: grabbing;
  color: #2563eb;
  background: rgba(59, 130, 246, 0.2);
}

:root.dark .drag-handle {
  color: #64748b;
}

:root.dark .drag-handle:hover {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.account-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 6px;
}

.email {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: color 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.email:hover {
  color: #3b82f6;
}

.nickname-tag {
  flex-shrink: 0;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
  color: #92400e !important;
  border: none !important;
  font-weight: 600;
  font-size: 10px;
  padding: 1px 6px !important;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(146, 64, 14, 0.15);
  letter-spacing: 0.3px;
  margin-left: auto;
  margin-right: 4px;
  opacity: 0.9;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.status-indicator:hover {
  background: rgba(0, 0, 0, 0.04);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.status-dot::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.3;
}

.status-active .status-dot {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-active .status-dot::after {
  animation: status-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background: #10b981;
}

.status-inactive .status-dot {
  background: #94a3b8;
}

.status-error .status-dot {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.status-disabled .status-dot {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.status-text {
  font-weight: 500;
  color: #64748b;
}

.status-active .status-text {
  color: #10b981;
  font-weight: 600;
}

.status-error .status-text {
  color: #ef4444;
  font-weight: 600;
}

.status-disabled .status-text {
  color: #f59e0b;
  font-weight: 600;
}

.status-subscription-inactive .status-text {
  color: #64748b;
  font-weight: 600;
}

.status-subscription-inactive .status-dot {
  background: #64748b;
  box-shadow: 0 0 0 2px rgba(100, 116, 139, 0.2);
}

@keyframes status-pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.card-body {
  margin-top: 4px;
}

/* QuotaPartialstyle */
.quota-section {
  background: linear-gradient(135deg, #f6f8fb 0%, #f0f3f8 100%);
  border-radius: 8px;
  padding: 6px;
  margin-bottom: 4px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.quota-section:hover {
  background: linear-gradient(135deg, #f0f3f8 0%, #e8ecf3 100%);
}

.quota-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 6px;
}

.quota-header-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.quota-header-right {
  display: flex;
  align-items: baseline;
  gap: 2px;
  margin-left: auto;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.plan-tag {
  color: white !important;
  border: none !important;
  font-weight: 700;
  font-size: 10.5px;
  padding: 2px 8px;
  height: auto;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  white-space: nowrap;
  border-radius: 6px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  position: relative;
  overflow: hidden;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.plan-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 60%, rgba(0, 0, 0, 0.05) 100%);
  pointer-events: none;
}

.plan-tag:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  filter: brightness(1.05);
}

.plan-tag :deep(.el-tag__content) {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 3px !important;
}

.plan-tag .el-icon {
  font-size: 11px;
  margin-right: 1px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
  display: inline-flex !important;
}

/* Plancolorhierarchy：Free < Trial < Pro < Teams < Enterprise */

/* FreePlan - silvergray，simple */
.plan-tag.plan-free {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}

/* TrialPlan - amber gold，awakeitem */
.plan-tag.plan-trial {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

/* ProPlan - tech blue，Pro */
.plan-tag.plan-pro {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

/* TeamsPlan - jadegreen，vibrant */
.plan-tag.plan-teams {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

/* EnterprisePlan - phantom purple, noble */
.plan-tag.plan-enterprise {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%) !important;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

/* Enterpriseflowing lightanimation */
.plan-tag.plan-enterprise::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(30deg);
  animation: shimmer 3s infinite;
  pointer-events: none;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) rotate(30deg); }
  100% { transform: translateX(100%) rotate(30deg); }
}

/* defaultcolor（otherPlan） */
.plan-tag:not(.plan-free):not(.plan-trial):not(.plan-pro):not(.plan-teams):not(.plan-enterprise) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) !important;
}

.quota-used {
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  letter-spacing: 0.3px;
}

.quota-separator {
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
  margin: 0 1px;
}

.quota-total {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.3px;
}

.quota-progress {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quota-progress .el-progress {
  flex: 1;
}

.quota-progress :deep(.el-progress-bar__outer) {
  background-color: #e2e8f0;
  height: 6px !important;
}

.quota-progress :deep(.el-progress-bar__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;
  background-image: linear-gradient(90deg, var(--color-start) 0%, var(--color-end) 100%);
}

/* asnotsamepercentageSettingsnotsame渐change色 */
.quota-progress :deep(.el-progress-bar__inner[style*="#10b981"]) {
  --color-start: #10b981;
  --color-end: #34d399;
}

.quota-progress :deep(.el-progress-bar__inner[style*="#f59e0b"]) {
  --color-start: #f59e0b;
  --color-end: #fbbf24;
}

.quota-progress :deep(.el-progress-bar__inner[style*="#ef4444"]) {
  --color-start: #ef4444;
  --color-end: #f87171;
}

.quota-percentage {
  min-width: 36px;
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
}

/* QUOTA Mode：day/Weekly Quotapercentagerowstyle */
.quota-percent-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.quota-percent-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  min-width: 36px;
  flex-shrink: 0;
}

.quota-percent-bar {
  flex: 1;
}

.quota-percent-bar :deep(.el-progress-bar__outer) {
  background-color: #e2e8f0;
  height: 6px !important;
}

.quota-percent-bar :deep(.el-progress-bar__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;
}

.quota-percent-value {
  min-width: 36px;
  text-align: right;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  flex-shrink: 0;
}

.quota-reset-time {
  font-size: 10px;
  color: #94a3b8;
  flex-shrink: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* QuotablockinsideSubscription ExpiresTimestyle */
.quota-expiry {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 10px;
}

.quota-expiry .expiry-icon {
  color: #64748b;
  font-size: 12px;
}

.quota-expiry .expiry-label {
  color: #64748b;
  font-weight: 500;
}

.quota-expiry .expiry-date {
  color: #475569;
  font-weight: 500;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.quota-expiry .expiry-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: auto;
  white-space: nowrap;
}

.quota-expiry .expiry-badge.normal {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.quota-expiry .expiry-badge.expiring-soon {
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.15);
  animation: gentle-pulse 2s ease-in-out infinite;
}

.quota-expiry .expiry-badge.expired {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.15);
  font-weight: 700;
}

@keyframes gentle-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(1.02);
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  margin-bottom: 2px;
}

/* customcolorTags */
.custom-tag {
  border-radius: 4px !important;
  font-weight: 500 !important;
  font-size: 10px !important;
  padding: 0 6px !important;
  height: 18px !important;
  line-height: 18px !important;
  transition: all 0.2s ease !important;
}

.custom-tag:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

/* withcolorTagscardborder效果 */
.account-card.has-tag-color {
  border-width: 2px;
  border-style: solid;
}

.account-card.has-tag-color:hover {
  filter: brightness(1.02);
}

.account-card.has-tag-color::before {
  opacity: 0.5;
}

/* InfoTagsgroup */
.info-tags {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  margin-bottom: 2px;
}

.info-tag {
  font-size: 10px !important;
  padding: 0 10px !important;
  height: 20px !important;
  border-radius: 4px !important;
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 4px !important;
  flex: 1;
  justify-content: center !important;
  min-width: 0;
  font-weight: 500;
}

.info-tag :deep(.el-tag__content) {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 4px !important;
}

.info-tag .el-icon {
  font-size: 10px !important;
  margin-right: 1px;
  display: inline-flex !important;
}

.info-tag span {
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

/* GroupTags - light blue */
.group-tag {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #64748b !important;
  border: 1px solid rgba(59, 130, 246, 0.15) !important;
}

/* Created AtTags - light purple */
.create-tag {
  background: rgba(168, 85, 247, 0.1) !important;
  color: #64748b !important;
  border: 1px solid rgba(168, 85, 247, 0.15) !important;
}

/* TokenTagsbased onExpiredTimechange色 */
.token-tag {
  border: none !important;
}

.token-tag.el-tag--success {
  background: rgba(16, 185, 129, 0.1) !important;
  color: #10b981 !important;
  border: 1px solid rgba(16, 185, 129, 0.15) !important;
}

.token-tag.el-tag--warning {
  background: rgba(245, 158, 11, 0.1) !important;
  color: #f59e0b !important;
  border: 1px solid rgba(245, 158, 11, 0.15) !important;
}

.token-tag.el-tag--danger {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;
  border: 1px solid rgba(239, 68, 68, 0.15) !important;
}

.token-tag.el-tag--info {
  background: rgba(107, 114, 128, 0.1) !important;
  color: #6b7280 !important;
  border: 1px solid rgba(107, 114, 128, 0.15) !important;
}

.card-actions {
  padding: 5px 8px;
  border-top: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: space-evenly;
  flex-wrap: nowrap;
  align-items: center;
  padding: 2px;
  height: 28px;
}

.action-buttons .el-button {
  flex: 0 0 auto;
  margin: 0;
}

.action-buttons .el-button.el-button--small.is-circle {
  width: 26px;
  height: 26px;
  padding: 0;
  min-width: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* callwholeiconsize */
.action-buttons .el-button .el-icon {
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Dark Themesupport */
:root.dark .account-card {
  background: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

:root.dark .account-card::before {
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.05);
}

:root.dark .account-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  background: #252525;
}

:root.dark .account-card:hover::before {
  opacity: 1;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* Dark Theme - selectedStatus (Selected - Tech Blue) */
:root.dark .account-card.selected {
  border-color: transparent;
  background: linear-gradient(135deg, #1e293b 0%, #172554 100%);
  box-shadow: 
    0 4px 12px rgba(30, 64, 175, 0.3),
    0 0 0 1px rgba(59, 130, 246, 0.3);
}

:root.dark .account-card.selected::before {
  box-shadow: 
    inset 0 0 0 1px rgba(96, 165, 250, 0.5),
    inset 0 0 20px rgba(37, 99, 235, 0.2);
  opacity: 1;
}

/* Dark Theme - CurrentAccount (Current - Amber Gold) */
:root.dark .account-card.current {
  background: linear-gradient(135deg, #2a2515 0%, #453a10 100%);
  box-shadow: 
    0 4px 12px rgba(180, 83, 9, 0.25),
    0 0 0 1px rgba(245, 158, 11, 0.3);
}

:root.dark .account-card.current::before {
  box-shadow: 
    inset 0 0 0 1px rgba(251, 191, 36, 0.5),
    inset 0 0 20px rgba(217, 119, 6, 0.2);
  opacity: 1;
}

:root.dark .account-card.current:hover,
:root.dark .account-card.selected:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  filter: brightness(1.1);
}

/* Dark Theme - DisabledAccount (Disabled - Warning Red) */
:root.dark .account-card.is-disabled {
  background: linear-gradient(135deg, #2a1515 0%, #451a1a 100%);
  box-shadow: 
    0 4px 12px rgba(185, 28, 28, 0.25),
    0 0 0 1px rgba(239, 68, 68, 0.3);
}

:root.dark .account-card.is-disabled::before {
  box-shadow: 
    inset 0 0 0 1px rgba(248, 113, 113, 0.5),
    inset 0 0 20px rgba(220, 38, 38, 0.2);
  opacity: 1;
}

:root.dark .account-card.is-disabled:hover {
  box-shadow: 0 8px 24px rgba(185, 28, 28, 0.4);
  filter: brightness(1.1);
}

/* Dark Theme - Subscription inactive (gray) */
:root.dark .account-card.subscription-inactive {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  box-shadow: 
    0 4px 12px rgba(71, 85, 105, 0.25),
    0 0 0 1px rgba(100, 116, 139, 0.3);
  filter: grayscale(30%);
}

:root.dark .account-card.subscription-inactive::before {
  box-shadow: 
    inset 0 0 0 1px rgba(148, 163, 184, 0.3),
    inset 0 0 20px rgba(100, 116, 139, 0.2);
  opacity: 1;
}

:root.dark .account-card.subscription-inactive:hover {
  box-shadow: 0 8px 24px rgba(71, 85, 105, 0.4);
  filter: grayscale(20%) brightness(1.1);
}

:root.dark .card-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

:root.dark .email {
  color: #f1f5f9;
}

:root.dark .nickname-tag {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.25) 100%) !important;
  color: #fbbf24 !important;
  box-shadow: 0 1px 3px rgba(251, 191, 36, 0.2);
  opacity: 0.9;
}

:root.dark .status-indicator {
  background: rgba(255, 255, 255, 0.03);
}

:root.dark .status-indicator:hover {
  background: rgba(255, 255, 255, 0.05);
}

:root.dark .status-text {
  color: #94a3b8;
}

:root.dark .status-active .status-text {
  color: #34d399;
}

:root.dark .status-error .status-text {
  color: #f87171;
}

:root.dark .status-active .status-dot {
  background: #34d399;
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.25);
}

:root.dark .status-active .status-dot::after {
  background: #34d399;
}

:root.dark .status-error .status-dot {
  background: #f87171;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.25);
}

:root.dark .status-disabled .status-text {
  color: #fbbf24;
}

:root.dark .status-disabled .status-dot {
  background: #fbbf24;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.25);
}

:root.dark .status-subscription-inactive .status-text {
  color: #94a3b8;
}

:root.dark .status-subscription-inactive .status-dot {
  background: #94a3b8;
  box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.25);
}

/* Dark Theme'sQuotastyle */
:root.dark .quota-section {
  background: linear-gradient(135deg, #2a2a2a 0%, #252525 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root.dark .quota-section:hover {
  background: linear-gradient(135deg, #2f2f2f 0%, #2a2a2a 100%);
}

/* Dark Theme'sPlanTags */
:root.dark .plan-tag {
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

:root.dark .plan-tag::before {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 60%, rgba(0, 0, 0, 0.1) 100%);
}

:root.dark .plan-tag:hover {
  box-shadow: 
    0 4px 10px rgba(0, 0, 0, 0.4),
    0 2px 5px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  filter: brightness(1.1);
}

/* Dark ThemePlancolor */
:root.dark .plan-tag.plan-free {
  background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

:root.dark .plan-tag.plan-trial {
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%) !important;
  box-shadow: 0 2px 6px rgba(180, 83, 9, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

:root.dark .plan-tag.plan-pro {
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%) !important;
  box-shadow: 0 2px 6px rgba(30, 64, 175, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

:root.dark .plan-tag.plan-teams {
  background: linear-gradient(135deg, #047857 0%, #059669 100%) !important;
  box-shadow: 0 2px 6px rgba(4, 120, 87, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

:root.dark .plan-tag.plan-enterprise {
  background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%) !important;
  box-shadow: 0 2px 10px rgba(109, 40, 217, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

:root.dark .plan-tag:not(.plan-free):not(.plan-trial):not(.plan-pro):not(.plan-teams):not(.plan-enterprise) {
  background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%) !important;
  box-shadow: 0 2px 6px rgba(67, 56, 202, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15) !important;
}

:root.dark .quota-used {
  color: #cbd5e1;
}

:root.dark .quota-separator {
  color: #64748b;
}

:root.dark .quota-total {
  color: #94a3b8;
}

:root.dark .quota-percentage {
  color: #cbd5e1;
}

:root.dark .quota-progress :deep(.el-progress-bar__outer) {
  background-color: #374151;
}

:root.dark .quota-percent-label {
  color: #94a3b8;
}

:root.dark .quota-percent-value {
  color: #cbd5e1;
}

:root.dark .quota-percent-bar :deep(.el-progress-bar__outer) {
  background-color: #374151;
}

:root.dark .quota-reset-time {
  color: #64748b;
}

/* Dark Theme'sSubscription ExpiresTimestyle */
:root.dark .quota-expiry {
  border-top-color: rgba(255, 255, 255, 0.08);
}

:root.dark .quota-expiry .expiry-icon {
  color: #94a3b8;
}

:root.dark .quota-expiry .expiry-label {
  color: #94a3b8;
}

:root.dark .quota-expiry .expiry-date {
  color: #cbd5e1;
}

/* Dark Mode'sFeatureButton Style */
:root.dark .card-actions {
  border-top-color: rgba(255, 255, 255, 0.08);
}

:root.dark .action-buttons .el-button.is-circle {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
}

:root.dark .action-buttons .el-button.is-circle:hover {
  background-color: #303133;
  border-color: #5a5b5d;
  color: #409eff;
}

:root.dark .action-buttons .el-button.is-circle:active {
  background-color: #1a1a1c;
  border-color: #409eff;
}

:root.dark .action-buttons .el-button--danger {
  background-color: transparent;
  border-color: rgba(245, 108, 108, 0.3);
  color: #f56c6c;
}

:root.dark .action-buttons .el-button--danger:hover {
  background-color: rgba(245, 108, 108, 0.1);
  border-color: rgba(245, 108, 108, 0.5);
  color: #ff6b6b;
}

:root.dark .quota-expiry .expiry-badge.normal {
  color: #34d399;
  background-color: rgba(52, 211, 153, 0.15);
}

:root.dark .quota-expiry .expiry-badge.expiring-soon {
  color: #fbbf24;
  background-color: rgba(251, 191, 36, 0.2);
}

:root.dark .quota-expiry .expiry-badge.expired {
  color: #f87171;
  background-color: rgba(248, 113, 113, 0.2);
}

/* Dark Theme'sInfoTags */
:root.dark .info-tags {
  gap: 4px;
}

:root.dark .group-tag {
  background: rgba(59, 130, 246, 0.1) !important;
  color: #60a5fa !important;
  border: 1px solid rgba(59, 130, 246, 0.15) !important;
}

:root.dark .create-tag {
  background: rgba(168, 85, 247, 0.1) !important;
  color: #c084fc !important;
  border: 1px solid rgba(168, 85, 247, 0.15) !important;
}

:root.dark .token-tag.el-tag--success {
  background: rgba(16, 185, 129, 0.1) !important;
  color: #34d399 !important;
  border: 1px solid rgba(16, 185, 129, 0.15) !important;
}

:root.dark .token-tag.el-tag--warning {
  background: rgba(245, 158, 11, 0.1) !important;
  color: #fbbf24 !important;
  border: 1px solid rgba(245, 158, 11, 0.15) !important;
}

:root.dark .token-tag.el-tag--danger {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #f87171 !important;
  border: 1px solid rgba(239, 68, 68, 0.15) !important;
}

:root.dark .token-tag.el-tag--info {
  background: rgba(107, 114, 128, 0.1) !important;
  color: #9ca3af !important;
  border: 1px solid rgba(107, 114, 128, 0.15) !important;
}

/* ==================== switch progressdialog ==================== */
.switch-progress-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 8px;
}

.switch-progress-label {
  font-size: 13px;
  color: #606266;
  min-height: 20px;
  line-height: 1.5;
}

.switch-progress-label.is-error {
  color: #F56C6C;
  font-weight: 500;
}

.switch-progress-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
}

.switch-progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #C0C4CC;
  transition: color 0.2s ease;
}

.switch-progress-step .step-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.switch-progress-step.status-done {
  color: #67C23A;
}
.switch-progress-step.status-done .step-icon {
  color: #67C23A;
}

.switch-progress-step.status-running {
  color: #303133;
  font-weight: 500;
}
.switch-progress-step.status-running .step-icon {
  color: #409EFF;
}

.switch-progress-step.status-error {
  color: #F56C6C;
  font-weight: 500;
}
.switch-progress-step.status-error .step-icon {
  color: #F56C6C;
}

.switch-progress-step.status-pending .step-icon {
  color: #DCDFE6;
}

/* running stepstepicon spinner animation */
.switch-progress-step .step-icon.is-spin {
  animation: switch-progress-spin 1s linear infinite;
}

@keyframes switch-progress-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Dark Modeadapt */
:root.dark .switch-progress-label {
  color: #cfd3dc;
}

:root.dark .switch-progress-steps {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

:root.dark .switch-progress-step {
  color: #7a8394;
}

:root.dark .switch-progress-step.status-running {
  color: #e2e8f0;
}

:root.dark .switch-progress-step.status-pending .step-icon {
  color: #4b5563;
}
</style>
