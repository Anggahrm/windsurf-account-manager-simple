<template>
  <el-dialog
    v-model="visible"
    title="changeSubscriptionplan"
    width="1100px"
    class="plan-dialog"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="plan-selection">
      <!-- CurrentPlanInfo -->
      <div v-if="account?.plan_name" class="current-plan-info">
        <div class="info-left">
          <div class="info-label">CurrentSubscriptionPlan</div>
          <div class="info-value">
            <el-tag :class="['plan-tag', `plan-${account.plan_name?.toLowerCase()}`]" effect="dark">
              <el-icon><Trophy /></el-icon>
              {{ account.plan_name }}
            </el-tag>
          </div>
        </div>
        <div class="info-right" v-if="account.total_quota">
          <div class="quota-label">Quotausage info</div>
          <div class="quota-value">
            <span class="used">{{ formatQuota(account.used_quota) }}</span>
            <span class="separator">/</span>
            <span class="total">{{ formatQuota(account.total_quota) }}</span>
          </div>
          <el-progress 
            :percentage="Math.min(Math.round((account.used_quota || 0) / (account.total_quota || 1) * 100), 100)" 
            :status="getQuotaStatus((account.used_quota || 0) / (account.total_quota || 1))"
            :stroke-width="6"
            :show-text="false"
            class="quota-progress"
          />
        </div>
      </div>
      
      <div class="plans-container">
        <div 
          v-for="plan in planConfigs"
          :key="plan.key"
          class="plan-card"
          :class="{ 
            active: selectedPlan === plan.key,
            'is-current': isCurrentPlan(plan.key)
          }"
          :style="{ '--theme-color': plan.color, '--theme-bg': plan.color + '15', '--theme-shadow': plan.color + '25' }"
          @click="selectedPlan = plan.key as PlanType"
        >
          <div class="tier-badge">Tier {{ plan.tier }}</div>
          <div class="card-header">
            <div class="icon-wrapper" :style="{ background: plan.color + '20', color: plan.color }">
              <el-icon>
                <component :is="getIconComponent(plan.icon)" />
              </el-icon>
            </div>
            <h3>{{ plan.name }}</h3>
            <p class="subtitle">{{ plan.desc }}</p>
          </div>
          
          <div class="card-body">
            <div class="features-list">
              <div v-for="feature in plan.features" :key="feature" class="feature-item">
                <el-icon :style="{ color: plan.color }"><Check /></el-icon>
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <el-button 
              class="select-btn"
              :type="selectedPlan === plan.key ? 'primary' : 'default'"
              :style="selectedPlan === plan.key ? { background: plan.color, borderColor: plan.color } : {}"
              :disabled="isCurrentPlan(plan.key)"
              round
              size="small"
            >
              {{ isCurrentPlan(plan.key) ? 'CurrentPlan' : (selectedPlan === plan.key ? 'Selected' : 'select') }}
            </el-button>
          </div>
          
          <div v-if="isCurrentPlan(plan.key)" class="current-badge">Currentuse</div>
        </div>
      </div>
      
      <!-- Payment Cycle Selection -->
      <div class="payment-period-section">
        <div class="section-title">
          <el-icon><Calendar /></el-icon>
          <span>Payment Cycle</span>
        </div>
        <el-radio-group v-model="paymentPeriod" :disabled="isLooping">
          <el-radio-button :value="1">
            <el-icon><Clock /></el-icon>
            Monthly
          </el-radio-button>
          <el-radio-button :value="2">
            <el-icon><Calendar /></el-icon>
            Annually
          </el-radio-button>
        </el-radio-group>
        <el-button
          type="info"
          plain
          size="small"
          @click="executePreview"
          :loading="loading"
          :disabled="!selectedPlan || isLooping"
          style="margin-left: 16px;"
        >
          <el-icon><View /></el-icon>
          previewbilling
        </el-button>
      </div>

      <!-- billingpreviewresult -->
      <div v-if="billingPreview" class="billing-preview">
        <div class="preview-header">
          <el-icon><Ticket /></el-icon>
          <span>billingpreview</span>
        </div>
        <div class="preview-content">
          <div class="preview-item" v-if="billingPreview.amount_due_immediately !== undefined">
            <span class="label">immediatelyshould付</span>
            <span class="value">${{ billingPreview.amount_due_immediately?.toFixed(2) }}</span>
          </div>
          <div class="preview-item" v-if="billingPreview.price_per_seat !== undefined">
            <span class="label">everySeat价格</span>
            <span class="value">${{ billingPreview.price_per_seat?.toFixed(2) }}</span>
          </div>
          <div class="preview-item" v-if="billingPreview.num_seats !== undefined">
            <span class="label">Seatcount</span>
            <span class="value">{{ billingPreview.num_seats }}</span>
          </div>
          <div class="preview-item" v-if="billingPreview.amount_per_interval !== undefined">
            <span class="label">everycycle费use</span>
            <span class="value">${{ billingPreview.amount_per_interval?.toFixed(2) }}/{{ billingPreview.sub_interval_name === 'yearly' ? '年' : 'month' }}</span>
          </div>
          <div class="preview-item" v-if="billingPreview.billing_start">
            <span class="label">billingstart</span>
            <span class="value">{{ billingPreview.billing_start }}</span>
          </div>
          <div class="preview-item" v-if="billingPreview.billing_end">
            <span class="label">billingend</span>
            <span class="value">{{ billingPreview.billing_end }}</span>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-container">
        <el-alert
          :title="error"
          type="error"
          show-icon
          :closable="false"
        />
      </div>

      <!-- cycle changeSettings -->
      <div class="loop-settings">
        <div class="loop-header">
          <div class="loop-title">
            <el-icon><Refresh /></el-icon>
            <span>cycle changeMode</span>
          </div>
          <el-switch v-model="loopMode" :disabled="isLooping" />
        </div>
        <p class="loop-desc">After enablingwill持续executeSubscriptionchange，directtoconsecutive3timefailed or manuallyStop</p>
        
        <!-- loopexecuteStatus -->
        <div v-if="isLooping || loopStats.totalAttempts > 0" class="loop-status">
          <div class="status-row">
            <div class="stat-item success">
              <el-icon><SuccessFilled /></el-icon>
              <span>successful: {{ loopStats.successCount }}</span>
            </div>
            <div class="stat-item failed">
              <el-icon><CircleCloseFilled /></el-icon>
              <span>failed: {{ loopStats.failedCount }}</span>
            </div>
            <div class="stat-item total">
              <el-icon><DataLine /></el-icon>
              <span>Total: {{ loopStats.totalAttempts }}</span>
            </div>
          </div>
          <div v-if="loopStats.consecutiveFailures > 0" class="consecutive-warn">
            <el-icon><Warning /></el-icon>
            consecutivefailed: {{ loopStats.consecutiveFailures }} / 3
          </div>
          <div v-if="loopStats.lastError" class="last-error">
            <el-icon><InfoFilled /></el-icon>
            {{ loopStats.lastError }}
          </div>
        </div>
      </div>

      <!-- SubscriptionManagementarea -->
      <div class="subscription-management">
        <div class="management-header">
          <span class="title">SubscriptionManagement</span>
          <span class="subtitle">ManagementyouSubscription status</span>
        </div>

        <div class="subscription-actions">
          <el-button
            type="danger"
            plain
            @click="handleCancelSubscription"
            :loading="cancelLoading"
            class="action-btn"
          >
            <el-icon><CircleClose /></el-icon>
            Cancel Subscription
          </el-button>

          <el-button
            type="success"
            plain
            @click="handleResumeSubscription"
            :loading="resumeLoading"
            class="action-btn"
          >
            <el-icon><CircleCheck /></el-icon>
            Restore Subscription
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="isLooping">Cancel</el-button>
        <el-button
          v-if="isLooping"
          type="danger"
          @click="stopLoop"
        >
          <el-icon><VideoPause /></el-icon>
          Stoploop
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="handleConfirm"
          :loading="loading"
          :disabled="!selectedPlan"
        >
          {{ loopMode ? 'startcycle change' : 'Confirmchange' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  UserFilled, OfficeBuilding, Check, Star, Trophy, CircleClose, CircleCheck, 
  Refresh, SuccessFilled, CircleCloseFilled, DataLine, Warning, InfoFilled, 
  VideoPause, Connection, Monitor, Clock, Medal, Promotion, Briefcase, Calendar, Grid,
  View, Ticket, Present, StarFilled, Cpu
} from '@element-plus/icons-vue';
import type { Component } from 'vue';
import { apiService } from '@/api';
import type { Account } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  accountId: string;
  account?: Account;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'success': [];
}>();

const visible = ref(props.modelValue);
// allcanuseSubscriptionplan type
type PlanType = 'free' | 'teams' | 'pro' | 'enterprise_saas' | 'hybrid' | 'enterprise_self_hosted' | 'waitlist_pro' | 'teams_ultimate' | 'pro_ultimate' | 'trial' | 'enterprise_self_serve' | 'enterprise_saas_pooled' | 'devin_enterprise' | 'devin_teams' | 'devin_teams_v2' | 'devin_pro' | 'devin_max' | 'max' | 'devin_free' | 'devin_trial' | '';
const selectedPlan = ref<PlanType>('');
// Payment Cycle: 1=Monthly, 2=Annually
const paymentPeriod = ref<number>(1);

// Subscriptionplanconfig
const planConfigs = [
  { key: 'free', name: 'Free', tier: 0, icon: 'Present', color: '#6b7280', desc: 'Free', features: ['basicFeature', 'Freeuse', '社areasupport'] },
  { key: 'teams', name: 'Teams', tier: 1, icon: 'UserFilled', color: '#10b981', desc: 'Team', features: ['Team协make', 'multipleUserManagement', 'setinbilling'] },
  { key: 'pro', name: 'Pro', tier: 2, icon: 'Star', color: '#3b82f6', desc: 'Pro', features: ['personPro', 'AdvancedFeature', 'prioritysupport'] },
  { key: 'enterprise_saas', name: 'Enterprise SaaS', tier: 3, icon: 'OfficeBuilding', color: '#8b5cf6', desc: 'EnterpriseSaaSversion', features: ['Enterpriselevel安full', 'SaaSdeploy', 'APIaccess'] },
  { key: 'hybrid', name: 'Hybrid', tier: 4, icon: 'Connection', color: '#f59e0b', desc: 'mixdeployversion', features: ['mix云deploy', '灵活config', 'data隔离'] },
  { key: 'enterprise_self_hosted', name: 'Enterprise Self-Hosted', tier: 5, icon: 'Monitor', color: '#ec4899', desc: 'Enterpriseself-hostedversion', features: ['localdeploy', 'complete控制', 'data自primary'] },
  { key: 'waitlist_pro', name: 'Waitlist Pro', tier: 6, icon: 'Clock', color: '#6366f1', desc: 'waitListPro', features: ['预约access', 'priority体验', '特otheroptimal惠'] },
  { key: 'teams_ultimate', name: 'Teams Ultimate', tier: 7, icon: 'Trophy', color: '#14b8a6', desc: 'TeamFlagship', features: ['AllTeamFeature', 'unlimitedQuota', 'VIPsupport'] },
  { key: 'pro_ultimate', name: 'Pro Ultimate', tier: 8, icon: 'Medal', color: '#f97316', desc: 'ProFlagship', features: ['AllProFeature', 'unlimitedQuota', 'VIPsupport'] },
  { key: 'trial', name: 'Trial', tier: 9, icon: 'Promotion', color: '#84cc16', desc: 'Trial', features: ['限when体验', 'AllFeature', 'noneedpaid'] },
  { key: 'enterprise_self_serve', name: 'Enterprise Self-Serve', tier: 10, icon: 'Briefcase', color: '#a855f7', desc: 'Enterpriseself-serviceversion', features: ['EnterpriselevelFeature', 'self-serviceManagement', 'SLA保障'] },
  { key: 'enterprise_saas_pooled', name: 'Enterprise SaaS Pooled', tier: 11, icon: 'Grid', color: '#0891b2', desc: 'EnterpriseSaaSPooled', features: ['total享资源pool', 'popupproperty扩展', '成thisoptimal'] },
  { key: 'devin_enterprise', name: 'Devin Enterprise', tier: 12, icon: 'Cpu', color: '#dc2626', desc: 'DevinEnterprise', features: ['AIProxy', 'Enterpriselevel', 'Team Management'] },
  { key: 'devin_teams', name: 'Devin Teams', tier: 14, icon: 'Cpu', color: '#e11d48', desc: 'DevinTeam', features: ['AIProxy', 'Team协make', 'multipleUser'] },
  { key: 'devin_teams_v2', name: 'Devin Teams V2', tier: 15, icon: 'Cpu', color: '#be123c', desc: 'DevinTeamV2', features: ['AIProxy', 'TeamV2', 'enhanceFeature'] },
  { key: 'devin_pro', name: 'Devin Pro', tier: 16, icon: 'Cpu', color: '#ea580c', desc: 'DevinPro', features: ['AIProxy', 'ProFeature', 'personuse'] },
  { key: 'devin_max', name: 'Devin Max', tier: 17, icon: 'Cpu', color: '#c2410c', desc: 'DevinFlagship', features: ['AIProxy', 'unlimitedFeature', 'most高config'] },
  { key: 'max', name: 'Max', tier: 18, icon: 'StarFilled', color: '#7c3aed', desc: 'Flagship', features: ['most高config', 'unlimitedQuota', 'fullFeaturesolve锁'] },
  { key: 'devin_free', name: 'Devin Free', tier: 19, icon: 'Cpu', color: '#9ca3af', desc: 'DevinFree', features: ['AIProxy', 'basicFeature', 'Freeuse'] },
  { key: 'devin_trial', name: 'Devin Trial', tier: 20, icon: 'Cpu', color: '#f472b6', desc: 'DevinTrial', features: ['AIProxy', '限when体验', 'AllFeature'] },
];
const loading = ref(false);
const cancelLoading = ref(false);
const resumeLoading = ref(false);
const error = ref('');

// iconcomponentmapping
const iconMap: Record<string, Component> = {
  UserFilled, OfficeBuilding, Star, StarFilled, Trophy, Connection, Monitor, Clock, Medal, Promotion, Briefcase, Check, Grid, Present, Cpu
};

// fetchiconcomponent
function getIconComponent(iconName: string): Component {
  return iconMap[iconName] || Star;
}

// judgewhether it isCurrentPlan
function isCurrentPlan(planKey: string): boolean {
  const currentPlan = props.account?.plan_name?.toLowerCase();
  if (!currentPlan) return false;
  // handleonesomespecialmapping
  if (planKey === 'enterprise' && currentPlan.includes('enterprise')) return true;
  return currentPlan === planKey || currentPlan.replace(/[_-]/g, '') === planKey.replace(/[_-]/g, '');
}

// cycle changerelatedStatus
const loopMode = ref(false);
const isLooping = ref(false);
const shouldStopLoop = ref(false);
const loopStats = reactive({
  successCount: 0,
  failedCount: 0,
  totalAttempts: 0,
  consecutiveFailures: 0,
  lastError: ''
});

// previewMode
const previewMode = ref(false);
const billingPreview = ref<{
  amount_due_immediately?: number;
  price_per_seat?: number;
  num_seats?: number;
  sub_interval_name?: string;
  amount_per_interval?: number;
  billing_start?: string;
  billing_end?: string;
} | null>(null);

// Cancelreasonoption
const cancelReasons = [
  { value: 'too_expensive', label: '价格太贵' },
  { value: 'not_using', label: 'no longeruse' },
  { value: 'missing_features', label: 'MissingFeature' },
  { value: 'switching_service', label: 'Switchtootherservice' },
  { value: 'other', label: 'otherreason' }
];

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    selectedPlan.value = '';
    error.value = '';
    loopMode.value = false;
    isLooping.value = false;
    shouldStopLoop.value = false;
    previewMode.value = false;
    billingPreview.value = null;
    resetLoopStats();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

function getQuotaStatus(percentage: number) {
  if (percentage >= 0.9) return 'exception';
  if (percentage >= 0.75) return 'warning';
  return 'success';
}

// ResetloopStatistics
function resetLoopStats() {
  loopStats.successCount = 0;
  loopStats.failedCount = 0;
  loopStats.totalAttempts = 0;
  loopStats.consecutiveFailures = 0;
  loopStats.lastError = '';
}

// Stoploop
function stopLoop() {
  shouldStopLoop.value = true;
  ElMessage.info('currentlyStoploop...');
}

// executesingletimechange
// Back: success=whethersuccessful, hasReason=failedwhenwhetherhasclearreason
async function executeSingleUpdate(): Promise<{ success: boolean; hasReason: boolean }> {
  try {
    const result = await apiService.updatePlan(props.accountId, selectedPlan.value, paymentPeriod.value, false);
    if (result.success) {
      return { success: true, hasReason: false };
    } else {
      const reason = result.payment_failure_reason;
      loopStats.lastError = reason || 'Failed to change plan';
      // hasclearreasonrepresentpayment问topic（e.g.Card NumberError），notinclude inconsecutivefailed
      return { success: false, hasReason: !!reason };
    }
  } catch (err: any) {
    loopStats.lastError = err.toString();
    return { success: false, hasReason: true }; // exceptionalso算has reason
  }
}

// executepreview
async function executePreview(): Promise<void> {
  if (!selectedPlan.value) {
    ElMessage.warning('please firstselectSubscriptionplan');
    return;
  }
  
  loading.value = true;
  error.value = '';
  billingPreview.value = null;
  
  try {
    const result = await apiService.updatePlan(props.accountId, selectedPlan.value, paymentPeriod.value, true);
    if (result.success && result.billing_update) {
      billingPreview.value = result.billing_update;
      ElMessage.success('previewsuccessful，pleaseViewbillingDetails');
    } else if (result.payment_failure_reason) {
      error.value = `paymentfailed: ${result.payment_failure_reason}`;
      ElMessage.error(error.value);
    } else {
      ElMessage.info('previewDone，nobillingchangemore');
    }
  } catch (err: any) {
    error.value = err.toString();
    ElMessage.error(`previewfailed: ${err}`);
  } finally {
    loading.value = false;
  }
}

// delayfunctioncount
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleConfirm() {
  if (!selectedPlan.value) {
    ElMessage.warning('Please selectSubscriptionplan');
    return;
  }

  // ifenabledloopMode
  if (loopMode.value) {
    isLooping.value = true;
    shouldStopLoop.value = false;
    resetLoopStats();
    error.value = '';

    while (!shouldStopLoop.value && loopStats.consecutiveFailures < 3) {
      loopStats.totalAttempts++;
      
      const result = await executeSingleUpdate();
      
      if (result.success) {
        loopStats.successCount++;
        loopStats.consecutiveFailures = 0; // Resetconsecutivefailedcountcount
        loopStats.lastError = '';
      } else {
        loopStats.failedCount++;
        // only whennoclearreasonfailed才include inconsecutivefailedcount
        // hasclearreason（e.g.Card NumberError）failednotinclude in
        if (!result.hasReason) {
          loopStats.consecutiveFailures++;
        } else {
          // has reasonfailedResetcountcountmanager
          loopStats.consecutiveFailures = 0;
        }
      }

      // check ifshouldtheStop
      if (shouldStopLoop.value) {
        ElMessage.warning('loopalready wasmanuallyStop');
        break;
      }

      if (loopStats.consecutiveFailures >= 3) {
        ElMessage.error('consecutive3timenoreasonfailed，loopalready Stop');
        error.value = `consecutive3timenoreasonfailed: ${loopStats.lastError}`;
        break;
      }

      // 短暂delay，avoidpleaserequirepass快
      await delay(500);
    }

    isLooping.value = false;
    
    // displaymostendStatistics
    if (loopStats.successCount > 0) {
      ElMessage.success(`loopend: successful ${loopStats.successCount} time，failed ${loopStats.failedCount} time`);
      emit('success');
    }
  } else {
    // singletimeexecuteMode
    loading.value = true;
    error.value = '';
    const periodName = paymentPeriod.value === 2 ? 'Annually' : 'Monthly';

    try {
      const result = await apiService.updatePlan(props.accountId, selectedPlan.value, paymentPeriod.value, false);
      if (result.success) {
        ElMessage.success(`successfulchangeto ${selectedPlan.value.toUpperCase()} plan（${periodName}）`);
        emit('success');
        handleClose();
      } else {
        error.value = result.payment_failure_reason || 'Failed to change plan';
        ElMessage.error(error.value);
      }
    } catch (err: any) {
      error.value = err.toString();
      ElMessage.error(`Failed to change plan: ${err}`);
    } finally {
      loading.value = false;
    }
  }
}

// Cancel Subscription
async function handleCancelSubscription() {
  try {
    // #onestep：selectCancelreason
    let selectedReason = 'too_expensive'; // default value

    const reasonHtml = `
      <div style="text-align: left; padding: 10px 0;">
        <p style="margin-bottom: 12px; color: #606266;">Please selectCancel Subscriptionreason：</p>
        <el-radio-group id="cancel-reason-group" style="display: flex; flex-direction: column; gap: 8px;">
          ${cancelReasons.map(r => `
            <label style="display: flex; align-items: center; padding: 8px; cursor: pointer; border-radius: 4px; transition: background 0.2s;"
                   onmouseover="this.style.background='#f5f7fa'"
                   onmouseout="this.style.background='transparent'">
              <input type="radio" name="cancel-reason" value="${r.value}" ${r.value === 'too_expensive' ? 'checked' : ''}
                     style="margin-right: 8px;"
                     onchange="window.__selectedCancelReason='${r.value}'">
              <span style="color: #303133;">${r.label}</span>
            </label>
          `).join('')}
        </el-radio-group>
      </div>
    `;

    // initializeglobalvariable
    (window as any).__selectedCancelReason = 'too_expensive';

    await ElMessageBox.confirm(reasonHtml, 'Cancel SubscriptionConfirm', {
      confirmButtonText: 'ConfirmCancel',
      cancelButtonText: 'Back',
      type: 'warning',
      dangerouslyUseHTMLString: true,
      beforeClose: async (action, instance, done) => {
        if (action === 'confirm') {
          selectedReason = (window as any).__selectedCancelReason || 'too_expensive';

          instance.confirmButtonLoading = true;
          instance.confirmButtonText = 'Cancelin...';

          try {
            console.log('Cancel Subscription，reason:', selectedReason);
            const result = await apiService.cancelSubscription(props.accountId, selectedReason);

            if (result.success) {
              ElMessage.success('Subscriptionalready successfulCancel');
              emit('success');
              done();
              handleClose();
            } else {
              ElMessage.error(result.raw_response || 'Cancel Subscriptionfailed');
              instance.confirmButtonLoading = false;
              instance.confirmButtonText = 'ConfirmCancel';
            }
          } catch (err: any) {
            ElMessage.error(`Cancel Subscriptionfailed: ${err}`);
            instance.confirmButtonLoading = false;
            instance.confirmButtonText = 'ConfirmCancel';
          } finally {
            // cleanupglobalvariable
            delete (window as any).__selectedCancelReason;
          }
        } else {
          // cleanupglobalvariable
          delete (window as any).__selectedCancelReason;
          done();
        }
      }
    });
  } catch (err) {
    // UserCancelOperation
    console.log('UserCancelCancel SubscriptionOperation');
    // cleanupglobalvariable
    delete (window as any).__selectedCancelReason;
  }
}

// Restore Subscription
async function handleResumeSubscription() {
  try {
    await ElMessageBox.confirm(
      'Confirmneed toRestore Subscription?？restoreafterwillcontinuebyoriginalplan收费。',
      'Restore SubscriptionConfirm',
      {
        confirmButtonText: 'Confirmrestore',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );

    resumeLoading.value = true;

    try {
      const result = await apiService.resumeSubscription(props.accountId);

      if (result.success) {
        ElMessage.success('Subscriptionalready successfulrestore');
        emit('success');
        handleClose();
      } else {
        ElMessage.error(result.raw_response || 'Restore Subscriptionfailed');
      }
    } catch (err: any) {
      ElMessage.error(`Restore Subscriptionfailed: ${err}`);
    } finally {
      resumeLoading.value = false;
    }
  } catch (err) {
    // UserCancelOperation
    console.log('UserCancelRestore SubscriptionOperation');
  }
}

// formatQuota（divide by100 and displaytwo decimal places）
function formatQuota(num: number | undefined | null) {
  if (!num) return '0.00';
  return (num / 100).toFixed(2);
}

function handleClose() {
  visible.value = false;
}
</script>

<style scoped lang="scss">
.plan-selection {
  padding: 10px;
}

/* CurrentPlanInfo */
.current-plan-info {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .info-left {
    .info-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }
    
    .plan-tag {
      padding: 6px 16px;
      height: 36px;
      font-size: 14px;
      font-weight: 600;
      border: none;
      
      :deep(.el-icon) {
        margin-right: 6px;
        font-size: 16px;
      }

      &.plan-pro { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
      &.plan-teams { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
      &.plan-enterprise { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
    }
  }

  .info-right {
    text-align: right;
    min-width: 200px;

    .quota-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 4px;
    }

    .quota-value {
      font-family: 'Roboto Mono', monospace;
      margin-bottom: 6px;
      
      .used { color: #303133; font-weight: 600; font-size: 18px; }
      .separator { margin: 0 4px; color: #c0c4cc; }
      .total { color: #909399; }
    }

    .quota-progress {
      width: 100%;
    }
  }
}

/* Plancardcontainer - suitableshouldmoremultiplecard */
.plans-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px;
}

/* Plancardbasicstyle - Compact */
.plan-card {
  position: relative;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 200px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-color: var(--theme-color);
    background: var(--theme-bg);
    box-shadow: 0 4px 16px var(--theme-shadow);
  }

  &.is-current {
    border-color: #ffd700;
    border-width: 2px;
  }

  .tier-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.05);
    color: #909399;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
  }

  .current-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
    z-index: 1;
    white-space: nowrap;
  }
}

/* cardheader - Compact */
.card-header {
  text-align: center;
  margin-bottom: 10px;

  .icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 8px;
    font-size: 18px;
    transition: transform 0.2s ease;
  }

  h3 {
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 4px;
    color: #303133;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 11px;
    color: #909399;
    margin: 0;
  }
}

.plan-card:hover .icon-wrapper {
  transform: scale(1.1);
}

/* cardprimary体 - Compact */
.card-body {
  flex: 1;
  margin-bottom: 10px;
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .feature-item {
    display: flex;
    align-items: center;
    font-size: 11px;
    color: #606266;
    
    .el-icon {
      margin-right: 4px;
      font-size: 12px;
    }
  }
}

/* cardbottom - Compact */
.card-footer {
  text-align: center;
  
  .select-btn {
    width: 100%;
    height: 28px;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s ease;

    &:not(.is-disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

/* dynamicprimarytopicApprovedinlinestyleapply */

/* Payment Cycle Selection */
.payment-period-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 10px;
  margin-bottom: 16px;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #92400e;

    .el-icon {
      font-size: 18px;
      color: #d97706;
    }
  }

  :deep(.el-radio-group) {
    .el-radio-button__inner {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
    }
  }
}

/* cycle changeSettings */
.loop-settings {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;

  .loop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .loop-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: #0369a1;

      .el-icon {
        font-size: 18px;
      }
    }
  }

  .loop-desc {
    font-size: 13px;
    color: #64748b;
    margin: 0 0 12px;
  }

  .loop-status {
    background: rgba(255, 255, 255, 0.8);
    border-radius: 8px;
    padding: 12px 16px;

    .status-row {
      display: flex;
      gap: 20px;
      margin-bottom: 8px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;

        &.success {
          color: #16a34a;
          .el-icon { color: #22c55e; }
        }

        &.failed {
          color: #dc2626;
          .el-icon { color: #ef4444; }
        }

        &.total {
          color: #0369a1;
          .el-icon { color: #0ea5e9; }
        }
      }
    }

    .consecutive-warn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #d97706;
      padding: 6px 10px;
      background: #fef3c7;
      border-radius: 6px;
      margin-bottom: 8px;

      .el-icon {
        color: #f59e0b;
      }
    }

    .last-error {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: #64748b;
      padding: 6px 10px;
      background: #f1f5f9;
      border-radius: 6px;
      word-break: break-all;

      .el-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }
}

/* billingpreview */
.billing-preview {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #81c784;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #2e7d32;
    margin-bottom: 12px;

    .el-icon {
      font-size: 18px;
    }
  }

  .preview-content {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .preview-item {
      background: rgba(255, 255, 255, 0.8);
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .label {
        font-size: 12px;
        color: #666;
      }

      .value {
        font-size: 14px;
        font-weight: 600;
        color: #2e7d32;
      }
    }
  }
}

@media (max-width: 768px) {
  .billing-preview .preview-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ErrorNotice */
.error-container {
  margin-bottom: 30px;
}

/* SubscriptionManagement */
.subscription-management {
  background: linear-gradient(to right, #fdf6ec, #fff);
  border-left: 4px solid #e6a23c;
  border-radius: 4px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .management-header {
    display: flex;
    flex-direction: column;
    
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #e6a23c;
      margin-bottom: 4px;
    }
    
    .subtitle {
      font-size: 13px;
      color: #909399;
    }
  }
  
  .subscription-actions {
    display: flex;
    gap: 12px;
    
    .action-btn {
      padding: 8px 20px;
    }
  }
}

/* responsiveadapt */
@media (max-width: 1200px) {
  .plans-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 900px) {
  .plans-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .plans-container {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .current-plan-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    
    .info-right {
      width: 100%;
      text-align: left;
    }
  }
  
  .subscription-management {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    
    .subscription-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
}

@media (max-width: 500px) {
  .plans-container {
    grid-template-columns: 1fr;
  }
}
</style>
