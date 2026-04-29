<template>
  <el-container class="main-container">
    <!-- Sidebar -->
    <el-aside :width="sidebarWidth" class="sidebar" :style="{ overflow: 'hidden' }">
      <div class="app-title">
        <el-icon size="24"><Connection /></el-icon>
        <div v-if="!uiStore.sidebarCollapsed" class="app-title-text">
          <span>Windsurf Manager</span>
          <span class="version-text">v{{ appVersion }}</span>
        </div>
      </div>
      
      <el-menu
        :collapse="uiStore.sidebarCollapsed"
        :default-active="activeMenu"
        :default-openeds="[]"
        class="sidebar-menu"
        :collapse-transition="false"
      >
        <el-menu-item index="accounts" @click="setActiveMenu('accounts')">
          <el-icon><User /></el-icon>
          <template #title>Account Management</template>
        </el-menu-item>
        
        <el-sub-menu
          index="groups"
          class="groups-submenu"
          popper-class="groups-submenu-popper"
        >
          <template #title>
            <el-icon><Folder /></el-icon>
            <span>Group Management</span>
          </template>
          <el-menu-item 
            v-for="group in settingsStore.groups" 
            :key="group"
            :index="`group-${group}`"
            class="group-item"
          >
            <div class="group-item-content">
              <span @click="filterByGroup(group)" class="group-name">{{ group }} <span class="group-count">({{ getGroupAccountCount(group) }})</span></span>
              <div class="group-actions" v-if="group !== 'Default Group'">
                <el-icon @click.stop="showRenameGroupDialog(group)" class="group-action-icon">
                  <Edit />
                </el-icon>
                <el-icon @click.stop="showDeleteGroupConfirm(group)" class="group-action-icon delete">
                  <Delete />
                </el-icon>
              </div>
            </div>
          </el-menu-item>
          <el-menu-item index="add-group" class="group-add-action" @click="showAddGroupDialog">
            <el-icon><Plus /></el-icon>
            Add Group
          </el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="logs" @click="uiStore.openLogsDialog">
          <el-icon><Document /></el-icon>
          <template #title>Operation Logs</template>
        </el-menu-item>
        
        <el-menu-item index="stats" @click="uiStore.openStatsDialog">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>Statistics</template>
        </el-menu-item>
        
        <el-menu-item index="auto-reset" @click="showAutoResetDialog = true">
          <el-icon><Timer /></el-icon>
          <template #title>Auto Reset</template>
        </el-menu-item>
        
        <el-menu-item index="card-generator" @click="showCardGeneratorDialog = true">
          <el-icon><CreditCard /></el-icon>
          <template #title>Virtual Card Generator</template>
        </el-menu-item>
        
        <el-menu-item index="about" @click="showAboutDialog">
          <el-icon><InfoFilled /></el-icon>
          <template #title>About</template>
        </el-menu-item>
        
        <el-menu-item index="settings" @click="uiStore.openSettingsDialog">
          <el-icon><Setting /></el-icon>
          <template #title>Settings</template>
        </el-menu-item>
      </el-menu>
      
      <div class="sidebar-footer">
        <el-button 
          :icon="uiStore.sidebarCollapsed ? ArrowRight : ArrowLeft"
          circle
          @click="uiStore.toggleSidebar"
        />
      </div>
    </el-aside>

    <!-- Main Content -->
    <el-container>
      <!-- Top Action Bar -->
      <el-header class="header">
        <div class="header-left">
          <el-input
            v-model="searchQuery"
            placeholder="Search accounts..."
            :prefix-icon="Search"
            clearable
            class="search-input"
            @input="handleSearch"
          />
          <el-tooltip content="Advanced Filter" placement="bottom">
            <el-button
              :icon="Filter"
              circle
              :type="hasActiveFilter ? 'primary' : 'default'"
              @click="showFilterPanel = !showFilterPanel"
              class="filter-toggle-btn"
            />
          </el-tooltip>
          
          <!-- sortselectmanager -->
          <el-select
            v-model="currentSortField"
            placeholder="Sort By"
            size="default"
            class="sort-select"
            @change="handleSortChange"
          >
            <el-option label="Email" value="email" />
            <el-option label="Created At" value="created_at" />
            <el-option label="Used Credits" value="used_quota" />
            <el-option label="Remaining Credits" value="remaining_quota" />
            <el-option label="Token Expires" value="token_expires_at" />
            <el-option label="Subscription Expires" value="subscription_expires_at" />
            <el-option label="Plan Type" value="plan_name" />
            <el-option label="Daily Quota %" value="daily_quota_remaining" />
            <el-option label="Weekly Quota %" value="weekly_quota_remaining" />
          </el-select>
          <el-tooltip :content="sortDirection === 'asc' ? 'Ascending' : 'Descending'" placement="bottom">
            <el-button
              :icon="sortDirection === 'asc' ? SortUp : SortDown"
              circle
              @click="toggleSortDirection"
            />
          </el-tooltip>
        </div>
        
        <div class="header-right">
          <!-- Batch Delete -->
          <el-tooltip content="Batch Delete" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-badge :value="accountsStore.selectedAccounts.size" :offset="[12, -8]">
              <el-button
                type="danger"
                :icon="Delete"
                circle
                @click="handleBatchDelete"
              />
            </el-badge>
          </el-tooltip>
          
          <el-tooltip content="Batch Transfer Subscription" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-button
              type="success"
              :icon="Switch"
              circle
              @click="showBatchTransferDialog = true"
            />
          </el-tooltip>
          
          <!-- Batch Refresh Status -->
          <el-tooltip content="Batch Refresh Status" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-button
              type="warning"
              :icon="RefreshRight"
              circle
              @click="handleBatchRefresh"
            />
          </el-tooltip>
          
          <el-tooltip content="Batch Change Subscription" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-button
              type="primary"
              :icon="Trophy"
              circle
              @click="showBatchUpdatePlanDialog = true"
            />
          </el-tooltip>
          
          <!-- Export Selected Accounts -->
          <el-tooltip content="Export Selected Accounts" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-button
              type="info"
              :icon="Download"
              circle
              @click="handleExportAccounts(true)"
            />
          </el-tooltip>
          
          <!-- Batch Change Group -->
          <el-tooltip content="Batch Change Group" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-button
              type="primary"
              :icon="FolderOpened"
              circle
              @click="showBatchGroupDialog = true"
            />
          </el-tooltip>
          
          <!-- Clear Selection -->
          <el-tooltip content="Clear Selection" placement="bottom" v-if="accountsStore.selectedAccounts.size > 0">
            <el-button
              :icon="Close"
              circle
              style="background-color: #909399; border-color: #909399; color: white;"
              @click="accountsStore.clearSelection()"
            />
          </el-tooltip>
          
          <!-- Select Page Accounts -->
          <el-tooltip content="Select Page Accounts" placement="bottom">
            <el-button
              :icon="DocumentChecked"
              circle
              type="default"
              @click="selectCurrentPageAccounts"
            />
          </el-tooltip>
          
          <!-- Select Allbutton（withdelimiterline） -->
          <el-tooltip content="Select All" placement="bottom" class="select-all-button">
            <el-button
              :icon="Select"
              circle
              :type="accountsStore.selectedAccounts.size === accountsStore.filteredAccounts.length && accountsStore.filteredAccounts.length > 0 ? 'primary' : 'default'"
              @click="toggleSelectAll"
            />
          </el-tooltip>
          
          <!-- Add Account -->
          <el-tooltip content="Add Account" placement="bottom">
            <el-button 
              type="default" 
              :icon="Plus" 
              circle 
              @click="uiStore.openAddAccountDialog" 
            />
          </el-tooltip>
          
          <!-- batchAdd -->
          <el-tooltip content="Batch Import" placement="bottom">
            <el-button 
              type="default" 
              :icon="Upload"
              circle 
              @click="handleBatchImport"
            />
          </el-tooltip>
          
          <!-- Export Accounts -->
          <el-tooltip content="Export Accounts" placement="bottom">
            <el-button 
              :icon="Download"
              circle 
              type="default"
              @click="handleExportAccounts"
            />
          </el-tooltip>
          
          <!-- Tag Management -->
          <el-tooltip content="Tag Management" placement="bottom">
            <el-button 
              :icon="PriceTag"
              circle 
              type="default"
              @click="showTagManageDialog = true"
            />
          </el-tooltip>
          
          <!-- globalRefresh -->
          <el-tooltip content="Refresh All" placement="bottom">
            <el-button 
              :icon="RefreshRight" 
              circle 
              type="default"
              @click="refreshAccounts" 
            />
          </el-tooltip>
        </div>
      </el-header>

      <!-- Account Cards Area -->
      <el-main class="main-content">
        <!-- filterpanel -->
        <transition name="filter-slide">
          <div v-if="showFilterPanel" class="filter-panel">
            <div class="filter-panel-header">
              <span class="filter-title">Advanced Filter</span>
              <div class="filter-header-actions">
                <el-button size="small" @click="clearAllFilters">Clear Filters</el-button>
                <el-button size="small" type="primary" @click="applyFilters">Apply Filters</el-button>
                <el-button :icon="Close" circle size="small" @click="showFilterPanel = false" />
              </div>
            </div>
            <div class="filter-panel-body">
              <!-- #onerow：countvaluerangefilter -->
              <div class="filter-row">
                <div class="filter-item filter-item-range">
                  <span class="filter-label">Remaining Quota</span>
                  <div class="filter-range">
                    <el-input-number v-model="filterForm.remainingQuotaMin" :min="0" :controls="false" placeholder="Min" size="small" />
                    <span class="range-separator">-</span>
                    <el-input-number v-model="filterForm.remainingQuotaMax" :min="0" :controls="false" placeholder="Max" size="small" />
                  </div>
                </div>
                <div class="filter-item filter-item-range">
                  <span class="filter-label">Total Quota</span>
                  <div class="filter-range">
                    <el-input-number v-model="filterForm.totalQuotaMin" :min="0" :controls="false" placeholder="Min" size="small" />
                    <span class="range-separator">-</span>
                    <el-input-number v-model="filterForm.totalQuotaMax" :min="0" :controls="false" placeholder="Max" size="small" />
                  </div>
                </div>
                <div class="filter-item filter-item-range">
                  <span class="filter-label">Days Remaining</span>
                  <div class="filter-range">
                    <el-input-number v-model="filterForm.expiryDaysMin" :controls="false" placeholder="Min" size="small" />
                    <span class="range-separator">-</span>
                    <el-input-number v-model="filterForm.expiryDaysMax" :controls="false" placeholder="Max" size="small" />
                  </div>
                </div>
              </div>
              <!-- #二row：day/Weekly Quota Remainingpercentage（only  billing_strategy === 2 (QUOTA) Accountparticipate） -->
              <div class="filter-row">
                <div class="filter-item filter-item-range">
                  <span class="filter-label">Daily Quota %</span>
                  <div class="filter-range">
                    <el-input-number v-model="filterForm.dailyQuotaPercentMin" :min="0" :max="100" :controls="false" placeholder="Min" size="small" />
                    <span class="range-separator">-</span>
                    <el-input-number v-model="filterForm.dailyQuotaPercentMax" :min="0" :max="100" :controls="false" placeholder="Max" size="small" />
                  </div>
                </div>
                <div class="filter-item filter-item-range">
                  <span class="filter-label">Weekly Quota %</span>
                  <div class="filter-range">
                    <el-input-number v-model="filterForm.weeklyQuotaPercentMin" :min="0" :max="100" :controls="false" placeholder="Min" size="small" />
                    <span class="range-separator">-</span>
                    <el-input-number v-model="filterForm.weeklyQuotaPercentMax" :min="0" :max="100" :controls="false" placeholder="Max" size="small" />
                  </div>
                </div>
              </div>
              <!-- #三row：selectmanagerfilter -->
              <div class="filter-row filter-row-select">
                <div class="filter-item filter-item-select">
                  <span class="filter-label">Plan</span>
                  <el-select v-model="filterForm.selectedPlans" multiple collapse-tags collapse-tags-tooltip placeholder="All" size="small">
                    <el-option v-for="plan in accountsStore.allPlanNames" :key="plan" :label="plan" :value="plan" />
                  </el-select>
                </div>
                <div class="filter-item filter-item-select">
                  <span class="filter-label">Tags</span>
                  <el-select v-model="filterForm.selectedTags" multiple collapse-tags collapse-tags-tooltip placeholder="All" size="small">
                    <el-option v-for="tag in accountsStore.allTags" :key="tag" :label="tag" :value="tag" />
                  </el-select>
                </div>
                <div class="filter-item filter-item-select">
                  <span class="filter-label">Domain</span>
                  <el-select v-model="filterForm.selectedDomains" multiple collapse-tags collapse-tags-tooltip placeholder="All" size="small">
                    <el-option v-for="domain in accountsStore.allDomains" :key="domain" :label="domain" :value="domain" />
                  </el-select>
                </div>
                <div class="filter-item filter-item-select">
                  <span class="filter-label">Status</span>
                  <el-select v-model="filterForm.selectedStatuses" multiple collapse-tags collapse-tags-tooltip placeholder="All" size="small">
                    <el-option v-for="status in statusOptions" :key="status.value" :label="status.label" :value="status.value" />
                  </el-select>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <div v-if="accountsStore.loading" class="loading-container">
          <el-icon class="is-loading" size="32"><Loading /></el-icon>
        </div>
        
        <div v-else-if="accountsStore.filteredAccounts.length === 0" class="empty-container">
          <el-empty description="No account data">
            <el-button type="primary" @click="uiStore.openAddAccountDialog">
              Add your first account
            </el-button>
          </el-empty>
        </div>
        
        <div v-else class="accounts-container">
          <div class="accounts-grid">
            <AccountCard
              v-for="account in accountsStore.paginatedAccounts"
              :key="account.id"
              :account="account"
              :is-selected="accountsStore.selectedAccounts.has(account.id)"
              :current-email="currentWindsurfEmail"
              @select="handleAccountSelect(account.id, $event)"
              @update="handleAccountUpdate"
            />
          </div>
          
          <!-- Paginationcomponent -->
          <div class="pagination-container" v-if="accountsStore.totalCount > accountsStore.pagination.pageSize">
            <el-pagination
              v-model:current-page="accountsStore.pagination.currentPage"
              v-model:page-size="accountsStore.pagination.pageSize"
              :page-sizes="accountsStore.pagination.pageSizes"
              :total="accountsStore.totalCount"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handlePageSizeChange"
              @current-change="handleCurrentPageChange"
            />
          </div>
        </div>
      </el-main>
    </el-container>

    <!-- Dialogcomponent -->
    <AddAccountDialog />
    <EditAccountDialog />
    <SettingsDialog />
    <BatchImportDialog 
      v-model="showBatchImportDialog" 
      @import="handleBatchImportConfirm" 
      ref="batchImportDialogRef"
    />
    <LogsDialog />
    <StatsDialog />
    <AccountInfoDialog />
    
    <!-- AboutDialog -->
    <AboutDialog 
      v-model="showAbout"
      :current-email="currentWindsurfEmail"
      :windsurf-version="windsurfVersion"
      :client-display-name="windsurfClientDisplayName"
      @open-update-dialog="showUpdateDialog = true"
    />

    <!-- autoUpdateDialog -->
    <UpdateDialog v-model="showUpdateDialog" :current-version="appVersion" />

    <AutoResetDialog v-model="showAutoResetDialog" />
    
    <!-- Virtual Card GeneratorDialog -->
    <CardGeneratorDialog v-model="showCardGeneratorDialog" />
    
    <!-- accountsingleDialog（pass inCurrentViewAccountID and data） -->
    <BillingDialog 
      v-if="uiStore.currentViewingAccountId"
      v-model="uiStore.showBillingDialog"
      :account-id="uiStore.currentViewingAccountId"
      :billing-data="currentBillingData"
      :loading="billingLoading"
      @refresh="refreshBillingData"
    />
    
    <!-- Batch Change SubscriptionDialog -->
    <BatchUpdatePlanDialog 
      v-model="showBatchUpdatePlanDialog"
      :selected-account-ids="Array.from(accountsStore.selectedAccounts)"
      :accounts="accountsStore.accounts"
      @success="accountsStore.loadAccounts()"
    />
    
    <!-- Tag ManagementDialog -->
    <TagManageDialog 
      v-model="showTagManageDialog"
      :selected-account-ids="Array.from(accountsStore.selectedAccounts)"
      @refresh="accountsStore.loadAccounts()"
    />
    
    <!-- Batch Change GroupDialog -->
    <el-dialog
      v-model="showBatchGroupDialog"
      title="Batch Change Group"
      width="400px"
      :close-on-click-modal="false"
      @close="closeBatchGroupDialog"
    >
      <div class="batch-group-content">
        <p class="batch-group-hint">
          Move selected <strong>{{ accountsStore.selectedAccounts.size }}</strong>  accounts to the specified group:
        </p>
        <el-select
          v-model="batchGroupTarget"
          placeholder="Select target group"
          style="width: 100%;"
          size="large"
        >
          <el-option
            v-for="group in settingsStore.groups"
            :key="group"
            :label="group"
            :value="group"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="closeBatchGroupDialog">Cancel</el-button>
        <el-button
          type="primary"
          :disabled="!batchGroupTarget"
          :loading="isBatchUpdatingGroup"
          @click="handleBatchUpdateGroup"
        >
          Confirm Change
        </el-button>
      </template>
    </el-dialog>

    <!-- Batch Transfer SubscriptionDialog -->
    <el-dialog
      v-model="showBatchTransferDialog"
      title="Batch Transfer Subscription"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-alert
        title="Batch Transfer Instructions"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      >
        <template #default>
          <p>Selected <strong>{{ accountsStore.selectedAccounts.size }}</strong>  source accounts need subscription transfer.</p>
          <p>Enter the corresponding number of target emails below (one per line). Source accounts will be removed from the team after transfer.</p>
          <p style="color: #e6a23c; margin-top: 8px;">⚠️ This action cannot be undone！</p>
        </template>
      </el-alert>
      
      <el-form label-width="100px">
        <el-form-item label="Target Email">
          <el-input
            v-model="batchTransferEmails"
            type="textarea"
            :rows="8"
            :placeholder="'Please enter ' + accountsStore.selectedAccounts.size + ' Target Email，One per line\ne.g.：\nuser1@example.com\nuser2@example.com'"
            name="batch-transfer-emails-no-autofill"
            autocomplete="off"
          />
        </el-form-item>
        <el-form-item>
          <div class="email-count-hint">
            Entered: {{ parsedTransferEmails.length }} / {{ accountsStore.selectedAccounts.size }}  emails
            <span v-if="parsedTransferEmails.length !== accountsStore.selectedAccounts.size" style="color: #e6a23c;">
              （Count mismatch）
            </span>
            <span v-else style="color: #67c23a;">
              （Count matched ✓）
            </span>
          </div>
        </el-form-item>
      </el-form>
      
      <!-- transferprogressdisplay -->
      <div v-if="batchTransferring" class="batch-transfer-progress">
        <el-progress
          :percentage="Math.round((batchTransferProgress.current / batchTransferProgress.total) * 100)"
          :stroke-width="12"
        />
        <div class="progress-status">
          {{ batchTransferProgress.status }}
          ({{ batchTransferProgress.current }}/{{ batchTransferProgress.total }})
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showBatchTransferDialog = false" :disabled="batchTransferring">Cancel</el-button>
        <el-button
          type="danger"
          :loading="batchTransferring"
          :disabled="parsedTransferEmails.length !== accountsStore.selectedAccounts.size"
          @click="handleBatchTransfer"
        >
          Confirm Batch Transfer
        </el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { invoke } from '@tauri-apps/api/core';
import {
  User,
  Folder,
  FolderOpened,
  Document,
  Setting,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  Delete,
  Edit,
  RefreshRight,
  Connection,
  Loading,
  DataAnalysis,
  InfoFilled,
  Select,
  Download,
  Upload,
  Trophy,
  Filter,
  Close,
  PriceTag,
  DocumentChecked,
  Timer,
  Switch,
  SortUp,
  SortDown
} from '@element-plus/icons-vue';
import { useAccountsStore, useSettingsStore, useUIStore } from '@/store';
import { apiService, settingsApi, accountApi, devinApi } from '@/api';
import type { Account } from '@/types';
import dayjs from 'dayjs';
import AccountCard from '@/components/AccountCard.vue';
import AddAccountDialog from '@/components/AddAccountDialog.vue';
import EditAccountDialog from '@/components/EditAccountDialog.vue';
import SettingsDialog from '@/components/SettingsDialog.vue';
import BatchImportDialog from '@/components/BatchImportDialog.vue';
import LogsDialog from '@/components/LogsDialog.vue';
import StatsDialog from '@/components/StatsDialog.vue';
import BillingDialog from '@/components/BillingDialog.vue';
import AccountInfoDialog from '@/components/AccountInfoDialog.vue';
import AboutDialog from '@/components/AboutDialog.vue';
import UpdateDialog from '@/components/UpdateDialog.vue';
import { useUpdaterStore } from '@/store/modules/updater';
import BatchUpdatePlanDialog from '@/components/BatchUpdatePlanDialog.vue';
import TagManageDialog from '@/components/TagManageDialog.vue';
import AutoResetDialog from '@/components/AutoResetDialog.vue';
import CardGeneratorDialog from '@/components/CardGeneratorDialog.vue';

const accountsStore = useAccountsStore();
const settingsStore = useSettingsStore();
const uiStore = useUIStore();

const activeMenu = ref('accounts');
const searchQuery = ref('');
const currentBillingData = ref<any>(null);
const billingLoading = ref(false);
const currentWindsurfEmail = ref<string>('');
const windsurfVersion = ref<string>('');
const windsurfClientDisplayName = ref<string>('Windsurf');
const showBatchUpdatePlanDialog = ref(false);
const showAbout = ref(false);
const showUpdateDialog = ref(false);
const updaterStore = useUpdaterStore();
const showTagManageDialog = ref(false);
const showBatchImportDialog = ref(false);
const batchImportDialogRef = ref<InstanceType<typeof BatchImportDialog> | null>(null);
const appVersion = ref<string>('');  // Versionfrombackenddynamicfetch
const showBatchGroupDialog = ref(false);
const batchGroupTarget = ref('');
const isBatchUpdatingGroup = ref(false);
const showAutoResetDialog = ref(false);
const showCardGeneratorDialog = ref(false);

// sortrelated
const currentSortField = ref<string>('custom');
const sortDirection = ref<'asc' | 'desc'>('asc');

// handlesortchangemore
async function handleSortChange(field: string) {
  currentSortField.value = field;
  await accountsStore.setSortConfig(field as any, sortDirection.value);
}

// Switchsortsidetoward
async function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  await accountsStore.setSortConfig(currentSortField.value as any, sortDirection.value);
}

// initializesort config
async function initSortConfig() {
  await accountsStore.loadSortConfig();
  // handleold custom value，autochangeas created_at
  const field = accountsStore.sortConfig.field as string;
  currentSortField.value = (field === 'custom' ? 'created_at' : field) as any;
  sortDirection.value = accountsStore.sortConfig.direction;
}

// Batch Transfer Subscription
const showBatchTransferDialog = ref(false);
const batchTransferEmails = ref('');
const batchTransferring = ref(false);
const batchTransferProgress = ref({ current: 0, total: 0, status: '' });

// parseinputEmailList（support"Email" or "Email Password"format）
const parsedTransferEmails = computed(() => {
  return batchTransferEmails.value
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      // supportspace or 制表符delimiterformat，onlyget#onePartial（Email）
      const parts = trimmed.split(/[\s\t]+/);
      return parts[0] || '';
    })
    .filter(e => e && e.includes('@'));
});

// Auto Resettimer
interface AutoResetConfig {
  id: string;
  targetType: string;
  targetId: string;
  enabled: boolean;
  checkInterval: number;
  usageThreshold: number;
  remainingThreshold: number;
}
const autoResetTimerMap = ref<Map<string, ReturnType<typeof setInterval>>>(new Map());

// initializeAuto Resettimer
async function initAutoResetTimers() {
  try {
    const configs = await invoke<AutoResetConfig[]>('get_auto_reset_configs');
    
    // Clearnowhastimer
    autoResetTimerMap.value.forEach(timer => clearInterval(timer));
    autoResetTimerMap.value.clear();
    
    // aseveryEnableconfigSettingstimer
    configs.filter(c => c.enabled).forEach(config => {
      // immediatelyexecuteoncecheck
      executeAutoResetCheck(config.id);
      
      // Settingstimer
      const timer = setInterval(() => {
        executeAutoResetCheck(config.id);
      }, config.checkInterval * 60 * 1000);
      
      autoResetTimerMap.value.set(config.id, timer);
    });
    
    if (configs.filter(c => c.enabled).length > 0) {
      console.log(`[AutoReset] already launch ${configs.filter(c => c.enabled).length} Auto Resettimer`);
    }
  } catch (error) {
    console.error('[AutoReset] initializetimerfailed:', error);
  }
}

// executeAuto Resetcheck
async function executeAutoResetCheck(configId: string) {
  try {
    const result = await invoke<any>('check_and_auto_reset', { configId });
    
    if (result.reset_count > 0) {
      ElMessage.success(`Auto reset: reset ${result.reset_count}  accounts credits`);
      await accountsStore.loadAccounts();
    }
  } catch (error) {
    console.error('[AutoReset] Check failed:', error);
  }
}

// filterpanelStatus
const showFilterPanel = ref(false);
// Statusoption
const statusOptions = [
  { value: 'normal', label: '🟢 Normal', desc: 'Account normal' },
  { value: 'inactive', label: '🔘 Inactive', desc: 'Subscription inactive' },
  { value: 'disabled', label: '🟠 Disabled', desc: 'Disabled by Windsurf' },
  { value: 'offline', label: '⚪ Offline', desc: 'Token invalid' },
  { value: 'error', label: '🔴 Error', desc: 'Operation error' },
];

const filterForm = ref({
  remainingQuotaMin: undefined as number | undefined,
  remainingQuotaMax: undefined as number | undefined,
  totalQuotaMin: undefined as number | undefined,
  totalQuotaMax: undefined as number | undefined,
  expiryDaysMin: undefined as number | undefined,
  expiryDaysMax: undefined as number | undefined,
  // day/Weekly Quota Remainingpercentage（0-100，only  billing_strategy === 2 (QUOTA) Accountparticipate）
  dailyQuotaPercentMin: undefined as number | undefined,
  dailyQuotaPercentMax: undefined as number | undefined,
  weeklyQuotaPercentMin: undefined as number | undefined,
  weeklyQuotaPercentMax: undefined as number | undefined,
  selectedTags: [] as string[],
  selectedPlans: [] as string[],
  selectedDomains: [] as string[],
  selectedStatuses: [] as string[],
});

// whetherhasactivatefilteritemsitem
const hasActiveFilter = computed(() => {
  const f = accountsStore.currentFilter;
  return !!(
    f.remainingQuotaMin !== undefined ||
    f.remainingQuotaMax !== undefined ||
    f.totalQuotaMin !== undefined ||
    f.totalQuotaMax !== undefined ||
    f.expiryDaysMin !== undefined ||
    f.expiryDaysMax !== undefined ||
    f.dailyQuotaPercentMin !== undefined ||
    f.dailyQuotaPercentMax !== undefined ||
    f.weeklyQuotaPercentMin !== undefined ||
    f.weeklyQuotaPercentMax !== undefined ||
    (f.tags && f.tags.length > 0) ||
    (f.planNames && f.planNames.length > 0) ||
    (f.domains && f.domains.length > 0) ||
    (f.statuses && f.statuses.length > 0)
  );
});

const sidebarWidth = computed(() => uiStore.sidebarCollapsed ? '64px' : '240px');

function setActiveMenu(menu: string) {
  activeMenu.value = menu;
  accountsStore.clearFilter();
}

function getGroupAccountCount(group: string): number {
  return accountsStore.accounts.filter(acc => acc.group === group).length;
}

function filterByGroup(group: string) {
  accountsStore.setFilter({ group });
}

function handleSearch() {
  accountsStore.setFilter({ ...accountsStore.currentFilter, search: searchQuery.value });
}

// Apply Filters
function applyFilters() {
  accountsStore.setFilter({
    ...accountsStore.currentFilter,
    remainingQuotaMin: filterForm.value.remainingQuotaMin,
    remainingQuotaMax: filterForm.value.remainingQuotaMax,
    totalQuotaMin: filterForm.value.totalQuotaMin,
    totalQuotaMax: filterForm.value.totalQuotaMax,
    expiryDaysMin: filterForm.value.expiryDaysMin,
    expiryDaysMax: filterForm.value.expiryDaysMax,
    dailyQuotaPercentMin: filterForm.value.dailyQuotaPercentMin,
    dailyQuotaPercentMax: filterForm.value.dailyQuotaPercentMax,
    weeklyQuotaPercentMin: filterForm.value.weeklyQuotaPercentMin,
    weeklyQuotaPercentMax: filterForm.value.weeklyQuotaPercentMax,
    tags: filterForm.value.selectedTags.length > 0 ? filterForm.value.selectedTags : undefined,
    planNames: filterForm.value.selectedPlans.length > 0 ? filterForm.value.selectedPlans : undefined,
    domains: filterForm.value.selectedDomains.length > 0 ? filterForm.value.selectedDomains : undefined,
    statuses: filterForm.value.selectedStatuses.length > 0 ? filterForm.value.selectedStatuses as any : undefined,
  });
}

// Clearallfilter
function clearAllFilters() {
  filterForm.value = {
    remainingQuotaMin: undefined,
    remainingQuotaMax: undefined,
    totalQuotaMin: undefined,
    totalQuotaMax: undefined,
    expiryDaysMin: undefined,
    expiryDaysMax: undefined,
    dailyQuotaPercentMin: undefined,
    dailyQuotaPercentMax: undefined,
    weeklyQuotaPercentMin: undefined,
    weeklyQuotaPercentMax: undefined,
    selectedTags: [],
    selectedPlans: [],
    selectedDomains: [],
    selectedStatuses: [],
  };
  accountsStore.clearFilter();
  searchQuery.value = '';
}

// Paginationhandle
function handlePageSizeChange(size: number) {
  accountsStore.setPageSize(size);
}

function handleCurrentPageChange(page: number) {
  accountsStore.setCurrentPage(page);
}

function handleAccountSelect(accountId: string, selected: boolean) {
  if (selected) {
    accountsStore.selectedAccounts.add(accountId);
  } else {
    accountsStore.selectedAccounts.delete(accountId);
  }
}

function handleAccountUpdate(account: Account) {
  accountsStore.updateAccount(account);
}

async function refreshAccounts() {
  const loading = ElMessage({
    message: 'Refreshing account list...',
    duration: 0,
    icon: Loading
  });
  
  try {
    // Batch refreshallAccount（useoptimalbatch API）
    if (accountsStore.accounts.length > 0) {
      loading.close();
      
      const totalCount = accountsStore.accounts.length;
      const allIds = accountsStore.accounts.map(a => a.id);
      
      const progressLoading = ElMessage({
        message: `Batch refreshing ${totalCount}  accounts...`,
        duration: 0,
        icon: Loading
      });
      
      // useoptimalBatch refresh API（backend onlySaveonce）
      const result = await apiService.batchRefreshTokens(allIds);
      
      progressLoading.close();
      
      const successCount = result.success_count || 0;
      const failedCount = totalCount - successCount;
      
      // usebackendBackcompletedataUpdatelocal store（noneedre-LoadingPage）
      if (result.results) {
        for (const item of result.results) {
          const idx = accountsStore.accounts.findIndex(a => a.id === item.id);
          if (idx === -1) continue;
          
          if (item.success && item.data) {
            const account = accountsStore.accounts[idx];
            if (item.data.plan_name) account.plan_name = item.data.plan_name;
            if (item.data.used_quota !== undefined) account.used_quota = item.data.used_quota;
            if (item.data.total_quota !== undefined) account.total_quota = item.data.total_quota;
            if (item.data.expires_at) account.token_expires_at = item.data.expires_at;
            if (item.data.windsurf_api_key) account.windsurf_api_key = item.data.windsurf_api_key;
            if (item.data.is_disabled !== undefined) account.is_disabled = item.data.is_disabled;
            if (item.data.subscription_active !== undefined) account.subscription_active = item.data.subscription_active;
            if (item.data.subscription_expires_at && typeof item.data.subscription_expires_at === 'number' && item.data.subscription_expires_at > 0) {
              account.subscription_expires_at = dayjs.unix(item.data.subscription_expires_at).toISOString();
            }
            if (item.data.last_quota_update) account.last_quota_update = item.data.last_quota_update;
            if (item.data.billing_strategy !== undefined) account.billing_strategy = item.data.billing_strategy;
            if (item.data.daily_quota_remaining_percent !== undefined) account.daily_quota_remaining_percent = item.data.daily_quota_remaining_percent;
            if (item.data.weekly_quota_remaining_percent !== undefined) account.weekly_quota_remaining_percent = item.data.weekly_quota_remaining_percent;
            if (item.data.daily_quota_reset_at_unix !== undefined) account.daily_quota_reset_at_unix = item.data.daily_quota_reset_at_unix;
            if (item.data.weekly_quota_reset_at_unix !== undefined) account.weekly_quota_reset_at_unix = item.data.weekly_quota_reset_at_unix;
            if (item.data.overage_balance_micros !== undefined) account.overage_balance_micros = item.data.overage_balance_micros;
            account.status = 'active';
          } else {
            accountsStore.accounts[idx].status = 'error';
          }
        }
      }
      
      // displaydetailedRefreshresult
      if (failedCount === 0) {
        ElMessage.success({
          message: `✅ All refresh completed!\nsuccessful: ${successCount}/${totalCount}`,
          duration: 3000,
          showClose: true
        });
      } else {
        const failedItems = result.results?.filter((r: any) => !r.success) || [];
        const failedDetails = failedItems.slice(0, 3).map((item: any) => {
          const account = accountsStore.accounts.find(a => a.id === item.id);
          return `  • ${account?.email || item.id}: ${item.error || 'Unknown error'}`;
        }).join('\n');
        const moreFailures = failedItems.length > 3 ? `\n  ... and ${failedItems.length - 3}  failed` : '';
        
        ElMessage.warning({
          message: `⚠️ Refresh complete (partial failure)\nsuccessful: ${successCount}/${totalCount}\nfailed: ${failedCount}/${totalCount}\n\nFailed accounts:\n${failedDetails}${moreFailures}`,
          duration: 5000,
          showClose: true,
          dangerouslyUseHTMLString: false
        });
      }
    } else {
      loading.close();
      ElMessage.success('Account list refreshed');
    }
  } catch (error) {
    loading.close();
    ElMessage.error(`Refresh failed: ${error}`);
  }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete the selected ${accountsStore.selectedAccounts.size}  accounts?`,
      'Batch Delete Confirmation',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
    
    const result = await accountsStore.deleteSelectedAccounts();
    ElMessage.success(`Successfully deleted ${result?.success_count || 0}  accounts`);
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Batch delete failed: ${error}`);
    }
  }
}

// Batch Transfer Subscription（concurrentexecute）
async function handleBatchTransfer() {
  const selectedIds = Array.from(accountsStore.selectedAccounts);
  const targetEmails = parsedTransferEmails.value;
  
  if (selectedIds.length !== targetEmails.length) {
    ElMessage.warning('Source account count does not match target email count');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to transfer subscriptions of ${selectedIds.length} accounts to the target emails?\n\nSource accounts will be removed from the team after transfer. This action cannot be undone!`,
      'Confirm Batch Transfer',
      {
        confirmButtonText: 'Confirm Transfer',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );
  } catch {
    return;
  }
  
  batchTransferring.value = true;
  batchTransferProgress.value = { current: 0, total: selectedIds.length, status: 'Concurrent execution...' };
  
  // buildtransfertaskList
  const transferTasks = selectedIds.map((sourceId, index) => {
    const targetEmail = targetEmails[index];
    const sourceAccount = accountsStore.accounts.find(a => a.id === sourceId);
    const sourceEmail = sourceAccount?.email || sourceId;
    
    return (async () => {
      try {
        const result = await invoke<any>('transfer_subscription', {
          id: sourceId,
          targetEmail: targetEmail,
          targetName: targetEmail.split('@')[0]
        });
        
        // Updateprogress
        batchTransferProgress.value = {
          ...batchTransferProgress.value,
          current: batchTransferProgress.value.current + 1
        };
        
        if (result.success) {
          return { sourceEmail, targetEmail, success: true };
        } else {
          return { sourceEmail, targetEmail, success: false, error: result.error || 'Transfer failed' };
        }
      } catch (error: any) {
        batchTransferProgress.value = {
          ...batchTransferProgress.value,
          current: batchTransferProgress.value.current + 1
        };
        return { sourceEmail, targetEmail, success: false, error: error.toString() };
      }
    })();
  });
  
  // concurrentexecutealltransfertask
  const results = await Promise.all(transferTasks);
  
  batchTransferProgress.value = {
    current: selectedIds.length,
    total: selectedIds.length,
    status: 'Done'
  };
  
  batchTransferring.value = false;
  
  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  
  if (failedCount === 0) {
    ElMessage.success(`Batch transfer complete! Success: ${successCount}/${selectedIds.length}`);
  } else {
    const failedDetails = results
      .filter(r => !r.success)
      .slice(0, 3)
      .map(r => `${r.sourceEmail}: ${r.error}`)
      .join('\n');
    ElMessage.warning({
      message: `Batch transfer complete\nsuccessful: ${successCount}, failed: ${failedCount}\n\nFailure details:\n${failedDetails}`,
      duration: 5000,
      showClose: true
    });
  }
  
  // disabledDialog and cleanup
  showBatchTransferDialog.value = false;
  batchTransferEmails.value = '';
  accountsStore.clearSelection();
  
  // Refresh account list
  await accountsStore.loadAccounts();
}

async function refreshBillingData() {
  if (uiStore.currentViewingAccountId) {
    billingLoading.value = true;
    currentBillingData.value = null;
    
    try {
      const result = await apiService.getBilling(uiStore.currentViewingAccountId);
      currentBillingData.value = result;
    } catch (error) {
      ElMessage.error(`Failed to get billing info: ${error}`);
    } finally {
      billingLoading.value = false;
    }
  }
}

// listenaccountsingleDialogopen
watch(() => uiStore.showBillingDialog, (show) => {
  if (show && uiStore.currentViewingAccountId) {
    refreshBillingData();
  } else if (!show) {
    currentBillingData.value = null;
  }
});

// Select All/CancelSelect All
function toggleSelectAll() {
  if (accountsStore.selectedAccounts.size === accountsStore.filteredAccounts.length && accountsStore.filteredAccounts.length > 0) {
    // CurrentisSelect AllStatus，CancelSelect All
    accountsStore.clearSelection();
  } else {
    // selectallAccount
    accountsStore.filteredAccounts.forEach(account => {
      accountsStore.selectedAccounts.add(account.id);
    });
  }
}

// Select Page Accounts
function selectCurrentPageAccounts() {
  const pageAccounts = accountsStore.paginatedAccounts;
  if (pageAccounts.length === 0) {
    ElMessage.info('No accounts on current page');
    return;
  }
  
  // checkthispagewhetheralready Allselected
  const allSelected = pageAccounts.every(acc => accountsStore.selectedAccounts.has(acc.id));
  
  if (allSelected) {
    // ifthispagealready Select All，thenCancelthispageselect
    pageAccounts.forEach(account => {
      accountsStore.selectedAccounts.delete(account.id);
    });
    ElMessage.info(`Deselected current page ${pageAccounts.length}  accounts`);
  } else {
    // selectthispageallAccount
    pageAccounts.forEach(account => {
      accountsStore.selectedAccounts.add(account.id);
    });
    ElMessage.success(`Selected current page ${pageAccounts.length}  accounts`);
  }
}

// openBatch ImportDialog
function handleBatchImport() {
  showBatchImportDialog.value = true;
}

// Batch ImportConfirm（fromDialogreceivedata）
async function handleBatchImportConfirm(
  accountsToImport: Array<{ email: string; password: string; remark: string; refreshToken?: string; sessionToken?: string; auth1Token?: string }>,
  autoLogin: boolean,
  group: string = 'Default Group',
  tags: string[] = [],
  mode: 'password' | 'refresh_token' | 'devin_session_token' | 'devin_auth1_token' = 'password',
  authProvider: 'firebase' | 'devin' | 'smart' = 'firebase'
) {
  // fetchconcurrentSettings
  const unlimitedConcurrent = settingsStore.settings?.unlimitedConcurrentRefresh || false;
  const concurrencyLimit = settingsStore.settings?.concurrent_limit || 5;

  // === Devin Session Token Mode：eachitemscall add_account_by_devin_session_token，not use sniff/importTask ===
  if (mode === 'devin_session_token') {
    await handleDevinSessionTokenBatchImport(accountsToImport, group, tags, unlimitedConcurrent, concurrencyLimit);
    return;
  }

  // === Devin Auth1 Token Mode：eachitemscall add_account_by_devin_auth1_token（autoSelectPrimaryOrg=true） ===
  if (mode === 'devin_auth1_token') {
    await handleDevinAuth1TokenBatchImport(accountsToImport, group, tags, unlimitedConcurrent, concurrencyLimit);
    return;
  }

  const providerLabel =
    authProvider === 'devin' ? 'Devin'
    : authProvider === 'smart' ? 'Smart Detection'
    : 'Firebase';
  const modeLabel = mode === 'refresh_token' ? 'Refresh Token' : 'Email/Password';
  const fullLabel = `${providerLabel} · ${modeLabel}`;
  // multiplegrouporgautofirstselectcountcount：batchendaftersummaryTotalNotice
  let devinAutoOrgPickedCount = 0;
  // smartMode'sdetectionresult：email -> actualuse provider
  const resolvedProviders = new Map<string, 'firebase' | 'devin'>();
  // detection环sectionwasskipAccount（SSO / notsetPassword / notRegister / Enterprise禁许 / networkexceptionetc.）
  const skippedBySniff: Array<{ email: string; reason: string }> = [];

  // displayprogressNotice
  let progressMsg = ElMessage({
    message: unlimitedConcurrent
      ? `Full concurrent import of ${accountsToImport.length}  accounts（${fullLabel}）...`
      : `Importing ${accountsToImport.length}  accounts（${fullLabel}，concurrent${concurrencyLimit}）...`,
    duration: 0,
    icon: Loading
  });

  // === Smart DetectionMode：ImportbeforefirstconcurrentdetectionallAccountLoginprovider type ===
  if (authProvider === 'smart' && mode === 'password') {
    progressMsg.close();
    progressMsg = ElMessage({
      message: `Identifying ${accountsToImport.length}  accounts login type...`,
      duration: 0,
      icon: Loading
    });

    const sniffResults = await Promise.all(
      accountsToImport.map(async (item) => {
        try {
          const sniff = await devinApi.sniffLoginMethod(item.email);
          return { email: item.email, sniff, error: null as string | null };
        } catch (e) {
          return { email: item.email, sniff: null, error: String(e) };
        }
      })
    );

    for (const r of sniffResults) {
      if (r.error || !r.sniff) {
        skippedBySniff.push({ email: r.email, reason: `detectionfailed: ${r.error || 'Unknown error'}` });
        continue;
      }
      switch (r.sniff.recommended) {
        case 'firebase':
          resolvedProviders.set(r.email, 'firebase');
          break;
        case 'devin':
          resolvedProviders.set(r.email, 'devin');
          break;
        default:
          // sso / no_password / not_found / blocked —— allnowayautoImport，挂failed
          skippedBySniff.push({
            email: r.email,
            reason: `[${r.sniff.recommended}] ${r.sniff.reason}`,
          });
      }
    }

    progressMsg.close();
    progressMsg = ElMessage({
      message: unlimitedConcurrent
        ? `Detection complete, full concurrent import of ${resolvedProviders.size}  accounts……`
        : `Detection complete, importing ${resolvedProviders.size}  accounts（concurrent${concurrencyLimit}）……`,
      duration: 0,
      icon: Loading
    });
  }

  // 崇探wasskipAccountnotenter importTask，butneed toinresultsetin序column语义on表nowasfailed
  const itemsToImport =
    authProvider === 'smart' && mode === 'password'
      ? accountsToImport.filter(item => resolvedProviders.has(item.email))
      : accountsToImport;

  const results: Array<{
    email: string;
    success: boolean;
    accountId?: string;
    error?: string;
    effectiveProvider?: 'firebase' | 'devin';
  }> = skippedBySniff.map(s => ({ email: s.email, success: false, error: s.reason }));

  // singleImporttask
  const importTask = async (item: { email: string; password: string; remark: string; refreshToken?: string }) => {
    // calculatethisitemsactualuse provider（smartModefromdetectionresultget，its余Modedirectlyuse authProvider）
    const effectiveProvider: 'firebase' | 'devin' =
      authProvider === 'smart' ? resolvedProviders.get(item.email)! : authProvider;

    try {
      if (mode === 'refresh_token' && item.refreshToken) {
        // Refresh Token Mode：callbackendcommand（only  Firebase；Devin/smart inDialog sideDisabledthe radio）
        const result = await invoke<any>('add_account_by_refresh_token', {
          refreshToken: item.refreshToken,
          nickname: item.remark || undefined,
          tags: tags.length > 0 ? [...tags] : [],
          group: group
        });
        
        if (result.success) {
          return { email: result.email, success: true, accountId: result.account?.id, effectiveProvider };
        } else {
          return { email: item.email, success: false, error: result.error || 'Add failed', effectiveProvider };
        }
      } else if (effectiveProvider === 'devin') {
        // Devin credentialsImport：call add_account_by_devin_login；multiplegroupwhen orgautoget orgs[0] againsecondarypersist to DB
        const loginResult = await invoke<any>('add_account_by_devin_login', {
          email: item.email,
          password: item.password,
          nickname: item.remark || undefined,
          tags: tags.length > 0 ? [...tags] : [],
          group: group,
          orgId: null,
        });

        if (loginResult?.success && !loginResult?.requires_org_selection) {
          // singlegrouporgdirectthrough：backendCompletedpersist to DB + enrich
          return {
            email: loginResult.email || item.email,
            success: true,
            accountId: loginResult.account?.id,
            effectiveProvider,
          };
        }

        if (loginResult?.requires_org_selection) {
          const orgs: Array<{ org_id?: string; id?: string; name?: string }> = loginResult.orgs || [];
          const firstOrgId = orgs[0]?.org_id || orgs[0]?.id;
          if (!firstOrgId) {
            return {
              email: item.email,
              success: false,
              error: '[Devin] multiplegrouporgbut orgs[] asempty，nowayautoselect',
              effectiveProvider,
            };
          }
          const auth1Token: string = loginResult.auth1_token;
          if (!auth1Token) {
            return {
              email: item.email,
              success: false,
              error: '[Devin] multiplegrouporgresponse缺失 auth1_token',
              effectiveProvider,
            };
          }
          // secondarypersist to DB（usefirstgrouporg）——pass password letAccountcardcanbackshowUseroriginalPassword
          const withOrgResult = await invoke<any>('add_account_by_devin_with_org', {
            email: item.email,
            auth1Token,
            orgId: firstOrgId,
            nickname: item.remark || undefined,
            tags: tags.length > 0 ? [...tags] : [],
            group: group,
            password: item.password,
          });

          if (withOrgResult?.success) {
            devinAutoOrgPickedCount += 1;
            return {
              email: withOrgResult.email || item.email,
              success: true,
              accountId: withOrgResult.account?.id,
              effectiveProvider,
            };
          }
          return {
            email: item.email,
            success: false,
            error: withOrgResult?.error || '[Devin] multiplegrouporgsecondarypersist to DBfailed',
            effectiveProvider,
          };
        }

        // bothnon- success alsonon- requires_org_selection
        return {
          email: item.email,
          success: false,
          error: loginResult?.error || loginResult?.message || '[Devin] Login failed',
          effectiveProvider,
        };
      } else {
        // Email/PasswordMode（Firebase）
        const newAccount = await accountsStore.addAccount({
          email: item.email,
          password: item.password,
          nickname: item.remark || item.email.split('@')[0],
          tags: tags.length > 0 ? [...tags] : [],
          group: group
        });
        return { email: item.email, success: true, accountId: newAccount.id, effectiveProvider };
      }
    } catch (error) {
      console.error(`ImportAccount ${item.email} failed:`, error);
      return { email: item.email, success: false, error: String(error), effectiveProvider };
    }
  };
  
  try {
    if (unlimitedConcurrent) {
      // full concurrentImport
      const allResults = await Promise.all(itemsToImport.map(item => importTask(item)));
      results.push(...allResults);
    } else {
      // 分批concurrenthandle
      for (let i = 0; i < itemsToImport.length; i += concurrencyLimit) {
        const batch = itemsToImport.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch.map(item => importTask(item)));
        results.push(...batchResults);
        
        // Updateprogress
        progressMsg.close();
        progressMsg = ElMessage({
          message: `Import progress: ${results.length - skippedBySniff.length}/${itemsToImport.length}`,
          duration: 0,
          icon: Loading
        });
      }
    }
    
    // StatisticsAddresult
    const addedAccounts = results.filter(r => r.success);
    const failedAccounts = results.filter(r => !r.success);
    
    // concurrentLoginsuccessfulAddAccount
    // - refresh_token Mode：already getAccount Info，skip
    // - Devin Mode：add_account_by_devin_login Completed post_auth + enrich_account_with_plan_status，skip
    // - Firebase + Email/Password：by autoLogin optiondecidewhethereachAccountcall loginAccount
    //
    // smartModeundersameone批in Firebase/Devin mix，by result.effectiveProvider === 'firebase' filter
    const needsAutoLogin = (r: typeof results[number]) =>
      r.success && r.effectiveProvider === 'firebase';
    let loginSuccessCount = 0;
    if (autoLogin && addedAccounts.some(needsAutoLogin) && mode === 'password') {
      progressMsg.close();
      progressMsg = ElMessage({
        message: unlimitedConcurrent
          ? `Full concurrent login of ${addedAccounts.length}  accounts...`
          : `Logging in ${addedAccounts.length}  accounts（concurrent${concurrencyLimit}）...`,
        duration: 0,
        icon: Loading
      });
      
      // Firebase childset（smartModeunderonly contains effectiveProvider === 'firebase' row）
      const firebaseAddedAccounts = addedAccounts.filter(needsAutoLogin);

      // singleLogintask
      const loginTask = async (item: { email: string; accountId?: string }) => {
        try {
          const loginResult = await apiService.loginAccount(item.accountId!);
          if (loginResult.success) {
            // frombackendfetchcompleteAccount Info（containstoken）
            const latestAccount = await accountApi.getAccount(item.accountId!);
            await accountsStore.updateAccount(latestAccount);
            return { success: true };
          }
          return { success: false };
        } catch (loginError) {
          console.error(`Account ${item.email} Login failed:`, loginError);
          return { success: false };
        }
      };
      
      const loginResults: Array<{ success: boolean }> = [];
      
      if (unlimitedConcurrent) {
        // full concurrentLogin
        const allLoginResults = await Promise.all(firebaseAddedAccounts.map(item => loginTask(item)));
        loginResults.push(...allLoginResults);
      } else {
        // 分批concurrentLogin
        for (let i = 0; i < firebaseAddedAccounts.length; i += concurrencyLimit) {
          const batch = firebaseAddedAccounts.slice(i, i + concurrencyLimit);
          const batchResults = await Promise.all(batch.map(item => loginTask(item)));
          loginResults.push(...batchResults);
          
          // Updateprogress
          progressMsg.close();
          progressMsg = ElMessage({
            message: `Login progress: ${loginResults.length}/${firebaseAddedAccounts.length}`,
            duration: 0,
            icon: Loading
          });
        }
      }
      
      loginSuccessCount = loginResults.filter(r => r.success).length;
    }
    
    progressMsg.close();
    
    // disabledDialog
    showBatchImportDialog.value = false;
    batchImportDialogRef.value?.resetImporting();
    
    // displaymostendresult
    if (addedAccounts.length > 0) {
      let message = `Successfully imported ${addedAccounts.length}  accounts（${providerLabel}）`;
      if (authProvider === 'smart') {
        const firebaseCount = addedAccounts.filter(r => r.effectiveProvider === 'firebase').length;
        const devinCount = addedAccounts.filter(r => r.effectiveProvider === 'devin').length;
        message += `（Firebase ${firebaseCount} · Devin ${devinCount}）`;
      }
      if (autoLogin && loginSuccessCount > 0) {
        message += `，${loginSuccessCount}  logged in`;
      }
      if (devinAutoOrgPickedCount > 0) {
        message += `，${devinAutoOrgPickedCount}  multi-org accounts auto-selected first org`;
      }
      if (skippedBySniff.length > 0) {
        message += `，${skippedBySniff.length}  accounts with unrecognized login method`;
      }
      if (failedAccounts.length - skippedBySniff.length > 0) {
        message += `，, rest failed ${failedAccounts.length - skippedBySniff.length} `;
      }
      ElMessage.success({
        message,
        duration: 5000,
        showClose: true
      });
      await accountsStore.loadAccounts();
    } else {
      let errorMsg = 'No accounts imported successfully';
      if (failedAccounts.length > 0) {
        const details = failedAccounts.slice(0, 3).map(f => `${f.email}（${f.error || 'Unknown'}）`).join('\n');
        errorMsg += `\n${details}${failedAccounts.length > 3 ? '\n...' : ''}`;
      }
      ElMessage.error({
        message: errorMsg,
        duration: 5000,
        showClose: true
      });
    }
  } catch (error) {
    progressMsg.close();
    showBatchImportDialog.value = false;
    batchImportDialogRef.value?.resetImporting();
    ElMessage.error(`Batch import failed: ${error}`);
  }
}

/**
 * Devin Auth1 Token Batch Import helper function count
 *
 * Each item calls devinApi.addAccountByAuth1Token and enabled autoSelectPrimaryOrg:
 * Backend uses auth1_token exchange for session_token → reverse lookup GetCurrentUser get email / Quota → persist to DB.
 * Multiple group org scenario auto select primary org (batch scenario not popup group org select dialog, ensure flow not interrupted).
 *
 * And handleDevinSessionTokenBatchImport for call, area other in persist to DB after Account devin_auth1_token field already filled,
 * subsequent session period can directly use refresh_devin_session refresh, no need re-fetch token.
 */
async function handleDevinAuth1TokenBatchImport(
  items: Array<{ email: string; password: string; remark: string; refreshToken?: string; sessionToken?: string; auth1Token?: string }>,
  group: string,
  tags: string[],
  unlimitedConcurrent: boolean,
  concurrencyLimit: number,
) {
  let progressMsg = ElMessage({
    message: unlimitedConcurrent
      ? `Full concurrent import of ${items.length}  Devin Auth1 Token...`
      : `Importing ${items.length}  Devin Auth1 Token（concurrent${concurrencyLimit}）...`,
    duration: 0,
    icon: Loading,
  });

  const results: Array<{ email: string; success: boolean; error?: string }> = [];

  const importTask = async (item: { remark: string; auth1Token?: string }) => {
    if (!item.auth1Token) {
      return { email: '(missing token)', success: false, error: 'Missing auth1Token' };
    }
    try {
      const result = await devinApi.addAccountByAuth1Token({
        auth1Token: item.auth1Token,
        nickname: item.remark || undefined,
        tags: tags.length > 0 ? [...tags] : [],
        group: group,
        autoSelectPrimaryOrg: true,
      });
      if (result.success) {
        return { email: result.email || '(unknown)', success: true };
      }
      return {
        email: result.email || '(unknown)',
        success: false,
        error: result.message || 'Import failed',
      };
    } catch (e) {
      return {
        email: item.auth1Token.slice(0, 30) + '...',
        success: false,
        error: String(e),
      };
    }
  };

  try {
    if (unlimitedConcurrent) {
      const all = await Promise.all(items.map(importTask));
      results.push(...all);
    } else {
      for (let i = 0; i < items.length; i += concurrencyLimit) {
        const batch = items.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch.map(importTask));
        results.push(...batchResults);
        progressMsg.close();
        progressMsg = ElMessage({
          message: `Import progress: ${results.length}/${items.length}`,
          duration: 0,
          icon: Loading,
        });
      }
    }

    progressMsg.close();
    showBatchImportDialog.value = false;
    batchImportDialogRef.value?.resetImporting();

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);
    if (succeeded > 0) {
      let msg = `Successfully imported via Auth1 Token ${succeeded}  Devin Account`;
      if (failed.length > 0) msg += `，failed ${failed.length} `;
      ElMessage.success({ message: msg, duration: 5000, showClose: true });
      await accountsStore.loadAccounts();
    } else {
      const details = failed.slice(0, 3).map(f => `${f.email}（${f.error || 'Unknown'}）`).join('\n');
      ElMessage.error({
        message: `No accounts imported successfully\n${details}${failed.length > 3 ? '\n...' : ''}`,
        duration: 5000,
        showClose: true,
      });
    }
  } catch (e) {
    progressMsg.close();
    showBatchImportDialog.value = false;
    batchImportDialogRef.value?.resetImporting();
    ElMessage.error(`Batch import failed: ${e}`);
  }
}

/**
 * Devin Session Token Batch Import helper function count
 *
 * Each item calls devinApi.addAccountBySessionToken, backend reverse lookup GetCurrentUser get email / Quota and persist to DB.
 * Not use sniff/importTask chain (session_token this body is Devin credential, no need detection).
 */
async function handleDevinSessionTokenBatchImport(
  items: Array<{ email: string; password: string; remark: string; refreshToken?: string; sessionToken?: string }>,
  group: string,
  tags: string[],
  unlimitedConcurrent: boolean,
  concurrencyLimit: number,
) {
  let progressMsg = ElMessage({
    message: unlimitedConcurrent
      ? `Full concurrent import of ${items.length}  Devin Session Token...`
      : `Importing ${items.length}  Devin Session Token（concurrent${concurrencyLimit}）...`,
    duration: 0,
    icon: Loading,
  });

  const results: Array<{ email: string; success: boolean; error?: string }> = [];

  const importTask = async (item: { remark: string; sessionToken?: string }) => {
    if (!item.sessionToken) {
      return { email: '(missing token)', success: false, error: 'Missing sessionToken' };
    }
    try {
      const result = await devinApi.addAccountBySessionToken({
        sessionToken: item.sessionToken,
        nickname: item.remark || undefined,
        tags: tags.length > 0 ? [...tags] : [],
        group: group,
      });
      if (result.success) {
        return { email: result.email || '(unknown)', success: true };
      }
      return {
        email: result.email || '(unknown)',
        success: false,
        error: result.message || 'Import failed',
      };
    } catch (e) {
      return {
        email: item.sessionToken.slice(0, 30) + '...',
        success: false,
        error: String(e),
      };
    }
  };

  try {
    if (unlimitedConcurrent) {
      const all = await Promise.all(items.map(importTask));
      results.push(...all);
    } else {
      for (let i = 0; i < items.length; i += concurrencyLimit) {
        const batch = items.slice(i, i + concurrencyLimit);
        const batchResults = await Promise.all(batch.map(importTask));
        results.push(...batchResults);
        progressMsg.close();
        progressMsg = ElMessage({
          message: `Import progress: ${results.length}/${items.length}`,
          duration: 0,
          icon: Loading,
        });
      }
    }

    progressMsg.close();
    showBatchImportDialog.value = false;
    batchImportDialogRef.value?.resetImporting();

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);
    if (succeeded > 0) {
      let msg = `Successfully imported via Session Token ${succeeded}  Devin Account`;
      if (failed.length > 0) msg += `，failed ${failed.length} `;
      ElMessage.success({ message: msg, duration: 5000, showClose: true });
      await accountsStore.loadAccounts();
    } else {
      const details = failed.slice(0, 3).map(f => `${f.email}（${f.error || 'Unknown'}）`).join('\n');
      ElMessage.error({
        message: `No accounts imported successfully\n${details}${failed.length > 3 ? '\n...' : ''}`,
        duration: 5000,
        showClose: true,
      });
    }
  } catch (e) {
    progressMsg.close();
    showBatchImportDialog.value = false;
    batchImportDialogRef.value?.resetImporting();
    ElMessage.error(`Batch import failed: ${e}`);
  }
}

// Batch Refresh Status（useoptimalbatch API，onlySaveonce）
async function handleBatchRefresh() {
  const selectedIds = Array.from(accountsStore.selectedAccounts);
  if (selectedIds.length === 0) {
    ElMessage.warning('Please select accounts first');
    return;
  }
  
  const totalCount = selectedIds.length;
  
  const progressLoading = ElMessage({
    message: `Batch refreshing ${totalCount}  accountsStatus...`,
    duration: 0,
    icon: Loading
  });
  
  try {
    // useoptimalBatch refresh API（backend onlySaveonce）
    const result = await apiService.batchRefreshTokens(selectedIds);
    
    progressLoading.close();
    
    const successCount = result.success_count || 0;
    const failedCount = totalCount - successCount;
    
    // RefreshsuccessfulAccount，frombackendre-fetchdataUpdate store
    if (result.results) {
      for (const item of result.results) {
        const idx = accountsStore.accounts.findIndex(a => a.id === item.id);
        if (idx === -1) continue;
        
        if (item.success && item.data) {
          const account = accountsStore.accounts[idx];
          if (item.data.plan_name) account.plan_name = item.data.plan_name;
          if (item.data.used_quota !== undefined) account.used_quota = item.data.used_quota;
          if (item.data.total_quota !== undefined) account.total_quota = item.data.total_quota;
          if (item.data.expires_at) account.token_expires_at = item.data.expires_at;
          if (item.data.windsurf_api_key) account.windsurf_api_key = item.data.windsurf_api_key;
          if (item.data.is_disabled !== undefined) account.is_disabled = item.data.is_disabled;
          if (item.data.subscription_active !== undefined) account.subscription_active = item.data.subscription_active;
          if (item.data.subscription_expires_at && typeof item.data.subscription_expires_at === 'number' && item.data.subscription_expires_at > 0) {
            account.subscription_expires_at = dayjs.unix(item.data.subscription_expires_at).toISOString();
          }
          if (item.data.last_quota_update) account.last_quota_update = item.data.last_quota_update;
          if (item.data.billing_strategy !== undefined) account.billing_strategy = item.data.billing_strategy;
          if (item.data.daily_quota_remaining_percent !== undefined) account.daily_quota_remaining_percent = item.data.daily_quota_remaining_percent;
          if (item.data.weekly_quota_remaining_percent !== undefined) account.weekly_quota_remaining_percent = item.data.weekly_quota_remaining_percent;
          if (item.data.daily_quota_reset_at_unix !== undefined) account.daily_quota_reset_at_unix = item.data.daily_quota_reset_at_unix;
          if (item.data.weekly_quota_reset_at_unix !== undefined) account.weekly_quota_reset_at_unix = item.data.weekly_quota_reset_at_unix;
          if (item.data.overage_balance_micros !== undefined) account.overage_balance_micros = item.data.overage_balance_micros;
          account.status = 'active';
        } else {
          accountsStore.accounts[idx].status = 'error';
        }
      }
    }
    
    // Show Results
    if (failedCount === 0) {
      ElMessage.success(`RefreshDone: successful ${successCount} `);
    } else {
      // collectfailedInfo
      const failedItems = result.results?.filter((r: any) => !r.success) || [];
      const failedEmails = failedItems.slice(0, 3).map((item: any) => {
        const account = accountsStore.accounts.find(a => a.id === item.id);
        return `${account?.email || item.id}: ${item.error || 'Unknown error'}`;
      });
      
      const moreCount = failedItems.length - 3;
      let message = `Refresh complete (partial failure)\nsuccessful: ${successCount}/${totalCount}\nfailed: ${failedCount}/${totalCount}`;
      if (failedEmails.length > 0) {
        message += `\n\nFailed accounts:\n• ${failedEmails.join('\n• ')}`;
        if (moreCount > 0) {
          message += `\n... and ${moreCount}  failed`;
        }
      }
      
      ElMessageBox.alert(message, 'Refreshresult', {
        type: 'warning',
        confirmButtonText: 'Confirm'
      });
    }
    
    accountsStore.clearSelection();
  } catch (error) {
    progressLoading.close();
    ElMessage.error(`batchRefresh failed: ${error}`);
  }
}

// Export Accounts
async function handleExportAccounts(selectedOnly: boolean = false) {
  try {
    let accounts;
    if (selectedOnly) {
      // Export Selected Account
      accounts = accountsStore.filteredAccounts.filter(a => accountsStore.selectedAccounts.has(a.id));
      if (accounts.length === 0) {
        ElMessage.warning('No has selected account');
        return;
      }
    } else {
      // Export All Account
      accounts = accountsStore.filteredAccounts;
      if (accounts.length === 0) {
        ElMessage.warning('No available export account');
        return;
      }
    }
    
    // By waiting for Export Accounts set capability, decide whether to render Devin two options
    // - Auth1 Token: At least one account has devin_auth1_token
    // - Session Token: At least one Devin auth provider account and token non-empty
    const hasDevinAuth1 = accounts.some(a => !!a.devin_auth1_token);
    const hasDevinSession = accounts.some(a => a.auth_provider === 'devin' && !!a.token);

    const devinAuth1OptionHtml = hasDevinAuth1 ? `
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportContent" value="devin_auth1_token" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Email + Devin Auth1 Token</span>
            <span style="color: #909399; margin-left: 8px;">Can secondary exchange for session / device migrate</span>
          </label>` : '';
    const devinSessionOptionHtml = hasDevinSession ? `
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportContent" value="devin_session_token" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Email + Devin Session Token</span>
            <span style="color: #909399; margin-left: 8px;">Current login session credential (short period valid)</span>
          </label>` : '';

    // Create HTML string for single select button
    const radioHtml = `
      <div style="padding: 20px 0;">
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5;">
          <div style="font-weight: 500; margin-bottom: 10px; color: #606266;">Export Content</div>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportContent" value="password" checked style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Email + Password</span>
            <span style="color: #909399; margin-left: 8px;">Traditional login credential</span>
          </label>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportContent" value="refresh_token" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Email + Refresh Token</span>
            <span style="color: #909399; margin-left: 8px;">Can directly refresh fetch account info</span>
          </label>${devinAuth1OptionHtml}${devinSessionOptionHtml}
        </div>
        <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5;">
          <div style="font-weight: 500; margin-bottom: 10px; color: #606266;">Export Format</div>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportFormat" value="3" checked style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Text Format</span>
            <span style="color: #909399; margin-left: 8px;">Simple single list</span>
          </label>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportFormat" value="1" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">CSV Format</span>
            <span style="color: #909399; margin-left: 8px;">Suitable for Excel</span>
          </label>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportFormat" value="2" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">JSON Format</span>
            <span style="color: #909399; margin-left: 8px;">Suitable for program handling</span>
          </label>
        </div>
        <div>
          <div style="font-weight: 500; margin-bottom: 10px; color: #606266;">Export Method</div>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportTarget" value="clipboard" checked style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Copy to Clipboard</span>
            <span style="color: #909399; margin-left: 8px;">Directly paste to use</span>
          </label>
          <label style="display: block; margin: 10px 0; cursor: pointer; font-size: 14px;">
            <input type="radio" name="exportTarget" value="file" style="margin-right: 10px; cursor: pointer; transform: scale(1.2);" />
            <span style="font-weight: 500;">Download File</span>
            <span style="color: #909399; margin-left: 8px;">Save to local</span>
          </label>
        </div>
      </div>
    `;
    
    await ElMessageBox({
      title: 'Select Export Format',
      message: radioHtml,
      showCancelButton: true,
      confirmButtonText: 'Export',
      cancelButtonText: 'Cancel',
      dangerouslyUseHTMLString: true,
      customClass: 'export-dialog',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const radioElement = document.querySelector('input[name="exportFormat"]:checked') as HTMLInputElement;
          if (radioElement) {
            (instance as any).selectedValue = radioElement.value;
          }
        }
        done();
      }
    });
    
    // fetchselectedvalue
    const selectedContentRadio = document.querySelector('input[name="exportContent"]:checked') as HTMLInputElement;
    const selectedFormatRadio = document.querySelector('input[name="exportFormat"]:checked') as HTMLInputElement;
    const selectedTargetRadio = document.querySelector('input[name="exportTarget"]:checked') as HTMLInputElement;
    const exportContent = selectedContentRadio ? selectedContentRadio.value : 'password';
    const format = selectedFormatRadio ? selectedFormatRadio.value : '1';
    const target = selectedTargetRadio ? selectedTargetRadio.value : 'file';
    
    // based onExportContenttypefetchcredential
    // devin_session_token only for auth_provider==='devin' Accounthas意义：
    // old Firebase Account token field持has Firebase access_token，willitsmakeas Devin session Exportwill产生误导，becausethissetempty
    const getCredential = (account: any) => {
      switch (exportContent) {
        case 'refresh_token':
          return account.refresh_token || '';
        case 'devin_auth1_token':
          return account.devin_auth1_token || '';
        case 'devin_session_token':
          return account.auth_provider === 'devin' ? (account.token || '') : '';
        case 'password':
        default:
          return account.password || '';
      }
    };

    const credentialMeta: Record<string, { label: string; key: string; fileSuffix: string }> = {
      password:            { label: 'Password',                key: 'password',            fileSuffix: ''        },
      refresh_token:       { label: 'Refresh Token',       key: 'refresh_token',       fileSuffix: '_token'  },
      devin_auth1_token:   { label: 'Devin Auth1 Token',   key: 'devin_auth1_token',   fileSuffix: '_auth1'  },
      devin_session_token: { label: 'Devin Session Token', key: 'devin_session_token', fileSuffix: '_session'},
    };
    const meta = credentialMeta[exportContent] || credentialMeta.password;
    const credentialLabel = meta.label;
    const credentialKey = meta.key;

    let content = '';
    let filename = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const fileSuffix = meta.fileSuffix;
    
    switch(format) {
      case '1': // CSV
        // clipboarddoes not need BOM
        content = target === 'clipboard' ? `Email,${credentialLabel},Remark,Group,Status,Plan\n` : `\uFEFFEmail,${credentialLabel},Remark,Group,Status,Plan\n`;
        accounts.forEach(account => {
          content += `"${account.email}","${getCredential(account)}","${account.nickname || ''}","${account.group || ''}","${account.status || ''}","${account.plan_name || ''}"\n`;
        });
        filename = `accounts${fileSuffix}_${timestamp}.csv`;
        break;
        
      case '2': // JSON
        content = JSON.stringify(accounts.map(account => ({
          email: account.email,
          [credentialKey]: getCredential(account),
          remark: account.nickname,
          group: account.group,
          status: account.status,
          plan: account.plan_name
        })), null, 2);
        filename = `accounts${fileSuffix}_${timestamp}.json`;
        break;
        
      case '3': // text
        accounts.forEach(account => {
          content += `${account.email} ${getCredential(account)}\n`;
        });
        filename = `accounts${fileSuffix}_${timestamp}.txt`;
        break;
    }
    
    if (target === 'clipboard') {
      // Copytoclipboard
      await navigator.clipboard.writeText(content);
      ElMessage.success(`Copied ${accounts.length}  accountstoclipboard`);
    } else {
      // createDownloadlink
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      ElMessage.success(`Exported ${accounts.length}  accounts`);
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Exportfailed: ${error}`);
    }
  }
}

async function showAddGroupDialog() {
  try {
    const { value } = await ElMessageBox.prompt('Please enter group name', 'Add Group', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: 'Group name length should be 1-20 characters'
    });
    
    await settingsStore.addGroup(value);
    ElMessage.success('Group added successfully');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Add Group failed: ${error}`);
    }
  }
}

async function showRenameGroupDialog(oldName: string) {
  try {
    const { value } = await ElMessageBox.prompt('Please enter new Group name', `Rename Group "${oldName}"`, {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      inputPattern: /^.{1,20}$/,
      inputErrorMessage: 'Group name length should be 1-20 characters',
      inputValue: oldName
    });
    
    if (value === oldName) {
      return;
    }
    
    await settingsStore.renameGroup(oldName, value);
    ElMessage.success('Group renamed successfully');
    
    // Refresh account list
    await accountsStore.loadAccounts();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Rename Group failed: ${error}`);
    }
  }
}

async function showDeleteGroupConfirm(name: string) {
  try {
    await ElMessageBox.confirm(
      `Confirm need to delete Group "${name}"? The group's accounts will move to "No Group"`,
      'Delete Group',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    );
    
    await settingsStore.deleteGroup(name);
    ElMessage.success('Group deleted successfully');
    
    // Refresh account list
    await accountsStore.loadAccounts();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`Delete Group failed: ${error}`);
    }
  }
}

// fetchCurrentActive Windsurf / Windsurf - Next ClientAccount Info
// backendby「进程priority + state.vscdb mtime fallback」autoselectActiveClient
async function fetchCurrentWindsurfInfo() {
  try {
    const info = await settingsApi.getCurrentWindsurfInfo();
    if (info.is_active && info.email) {
      currentWindsurfEmail.value = info.email;
    }
    if (info.version) {
      windsurfVersion.value = info.version;
    }
    // ActiveClientshowname（驱动AboutDialogtitledynamicSwitch）
    if (info.client_display_name) {
      windsurfClientDisplayName.value = info.client_display_name;
    }
  } catch (error) {
    console.error('fetchCurrentWindsurfInfofailed:', error);
  }
}

// disabledbatchGroupDialog
function closeBatchGroupDialog() {
  showBatchGroupDialog.value = false;
  batchGroupTarget.value = '';
}

// Batch Change Group
async function handleBatchUpdateGroup() {
  const selectedIds = Array.from(accountsStore.selectedAccounts);
  if (selectedIds.length === 0) {
    ElMessage.warning('Please select accounts first');
    return;
  }
  
  if (!batchGroupTarget.value) {
    ElMessage.warning('pleaseSelect target group');
    return;
  }
  
  isBatchUpdatingGroup.value = true;
  
  try {
    let successCount = 0;
    let failedCount = 0;
    
    // eachUpdateAccountGroup
    for (const id of selectedIds) {
      const account = accountsStore.accounts.find(a => a.id === id);
      if (account) {
        try {
          const updatedAccount = { ...account, group: batchGroupTarget.value };
          await accountsStore.updateAccount(updatedAccount);
          successCount++;
        } catch (error) {
          console.error(`UpdateAccount ${account.email} Groupfailed:`, error);
          failedCount++;
        }
      }
    }
    
    // Show Results
    if (failedCount === 0) {
      ElMessage.success(`successfulwill ${successCount}  accountsmove动to"${batchGroupTarget.value}"Group`);
    } else {
      ElMessage.warning(`Done：successful ${successCount} ，failed ${failedCount} `);
    }
    
    // disabledDialog and Refresh
    closeBatchGroupDialog();
    accountsStore.clearSelection();
    await accountsStore.loadAccounts();
  } catch (error) {
    ElMessage.error(`Batch Change Groupfailed: ${error}`);
  } finally {
    isBatchUpdatingGroup.value = false;
  }
}

// displayAboutDialog
function showAboutDialog() {
  showAbout.value = true;
}

// initializewhenfetchCurrentAccount Info and applyVersion
onMounted(async () => {
  fetchCurrentWindsurfInfo();
  
  // fetchapplyVersion
  try {
    const versionInfo = await invoke<any>('get_app_version');
    appVersion.value = versionInfo.version;
  } catch (error) {
    console.error('Failed to get app version:', error);
  }
  
  // initializesort config
  initSortConfig();
  
  // initializeAuto Resettimer
  initAutoResetTimers();

  // launch静默detectUpdate（delay 3 seconds，避enabled动高峰；store internal 24h debounce + Skip Version）
  window.setTimeout(async () => {
    try {
      const hasUpdate = await updaterStore.checkUpdate(true);
      if (hasUpdate) {
        showUpdateDialog.value = true;
      }
    } catch (e) {
      console.warn('[Updater] silent check failed:', e);
    }
  }, 3000);
});

// on component unmountClearAuto Resettimer
onUnmounted(() => {
  autoResetTimerMap.value.forEach(timer => clearInterval(timer));
  autoResetTimerMap.value.clear();
});
</script>

<style scoped>
.main-container {
  height: 100vh;
  width: 100vw;
}

.sidebar {
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  overflow: hidden;
}

/* globalhideSidebarallscrollitems */
.el-aside {
  overflow: hidden !important;
}

.sidebar::-webkit-scrollbar,
.sidebar :deep(::-webkit-scrollbar),
.el-aside::-webkit-scrollbar,
.el-menu::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  background: transparent !important;
}

.sidebar,
.sidebar :deep(*),
.el-aside,
.el-menu {
  -ms-overflow-style: none !important;  /* IE and Edge */
  scrollbar-width: none !important;  /* Firefox */
  overflow-x: hidden !important;
}

.app-title {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  
  .el-icon {
    flex-shrink: 0;
  }
  
  .app-title-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .version-text {
      font-size: 12px;
      font-weight: normal;
      color: var(--el-text-color-secondary);
      opacity: 0.8;
    }
  }
}

/* 收缩Statusundertitlestyle */
.sidebar.el-aside--collapse .app-title {
  padding: 16px 8px;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  overflow: hidden !important;
}

/* hideElement Plusmenusinglescrollitems */
.sidebar-menu::-webkit-scrollbar {
  display: none;
}

.sidebar-menu {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.sidebar-footer {
  padding: 12px;
  text-align: center;
  border-top: 1px solid #e4e7ed;
  background: #fff;
  position: relative;
  z-index: 1;
}

.header {
  background: linear-gradient(to bottom, #ffffff 0%, #fafbfc 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  height: 64px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.search-input {
  width: 220px;
}

.sort-select {
  width: 105px;
}

.sort-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  height: 32px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  padding: 0 16px;
  height: 40px;
  background: #ffffff;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  border-color: var(--el-color-primary);
}

.search-input :deep(.el-input__inner) {
  font-size: 14px;
  color: #1e293b;
}

.search-input :deep(.el-input__prefix) {
  font-size: 16px;
  color: #94a3b8;
}

.header-right {
  display: flex;
  gap: 2px;
  align-items: center;
  flex-wrap: nowrap;
}

/* circlebutton徒加badgestyle */
.header-right :deep(.el-badge) {
  vertical-align: middle;
}

.header-right :deep(.el-badge__content) {
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
  font-size: 10px;
  border-radius: 8px;
  background-color: #f56c6c;
  border: none;
}


/* Select Allbuttondelimiterline */
.header-right .select-all-button {
  margin-left: 4px;
  position: relative;
}

.header-right .select-all-button::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  height: 24px;
  width: 1px;
  background-color: #dcdfe6;
  pointer-events: none;
  z-index: 1;
}

/* Batch Operationsbutton - Approved父elementunifySettings间距 */

/* primaryneed toOperationButton Style */
.header-right :deep(.el-button--primary:not(.is-circle)) {
  background: linear-gradient(135deg, #409eff 0%, #3b8cef 100%);
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* circleprimaryneed tobutton - blue */
.header-right :deep(.el-button--primary.is-circle) {
  background: linear-gradient(135deg, #409eff 0%, #3b8cef 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  color: #ffffff;
}

.header-right :deep(.el-button--primary.is-circle:hover) {
  background: linear-gradient(135deg, #3b8cef 0%, #2d7ee5 100%);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.header-right :deep(.el-button--primary:not(.is-circle):hover) {
  background: linear-gradient(135deg, #3b8cef 0%, #2d7ee5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
}

.header-right :deep(.el-button--primary:active) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

/* 危险button - red（Batch Delete） */
.header-right :deep(.el-button--danger.is-circle) {
  background: linear-gradient(135deg, #f56c6c 0%, #f04848 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
  transition: all 0.3s ease;
  color: #ffffff;
}

.header-right :deep(.el-button--danger.is-circle:hover) {
  background: linear-gradient(135deg, #f04848 0%, #e63535 100%);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

.header-right :deep(.el-button--danger:active) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(245, 108, 108, 0.2);
}

/* successfulbutton - green（Batch Transfer Subscription） */
.header-right :deep(.el-button--success.is-circle) {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
  transition: all 0.3s ease;
  color: #ffffff;
}

.header-right :deep(.el-button--success.is-circle:hover) {
  background: linear-gradient(135deg, #5daf34 0%, #529b2e 100%);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

/* Warningbutton - orange（Batch Refresh Status） */
.header-right :deep(.el-button--warning.is-circle) {
  background: linear-gradient(135deg, #e6a23c 0%, #d48a1f 100%);
  border: none;
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
  transition: all 0.3s ease;
  color: #ffffff;
}

.header-right :deep(.el-button--warning.is-circle:hover) {
  background: linear-gradient(135deg, #d48a1f 0%, #c27c0e 100%);
  transform: scale(1.1) rotate(10deg);
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
}

.header-right :deep(.el-button--success:active) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.2);
}

/* normalButton Style */
.header-right :deep(.el-button--default) {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  padding: 10px 20px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #606266;
}

.header-right :deep(.el-button--default:hover) {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.15);
  color: #409eff;
}

.header-right :deep(.el-button--default:active) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* circlebuttonbasicstyle */
.header-right :deep(.el-button.is-circle) {
  transition: all 0.3s ease;
  width: 40px;
  height: 40px;
}

/* defaultcirclebutton - unifygraystyle */
.header-right :deep(.el-button--default.is-circle) {
  color: #606266 !important;  
  background: #ffffff;
  border: 1px solid #dcdfe6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.header-right :deep(.el-button--default.is-circle:hover) {
  color: #409eff !important;
  background: #ecf5ff;
  border-color: #c6e2ff;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

/* 特otherhandlecirclebuttoniconcolor */
.header-right :deep(.el-button.is-circle .el-icon) {
  color: inherit !important;
  font-weight: 500;
}

.header-right :deep(.el-button.is-circle:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-right :deep(.el-button.is-circle:active) {
  transform: rotate(90deg) scale(0.95);
}

/* buttoniconstyle */
.header-right :deep(.el-button .el-icon) {
  font-size: 18px;
  transition: all 0.3s ease;
}

/* defaultbuttoniconcolor */
.header-right :deep(.el-button--default .el-icon) {
  color: #606266 !important;
}

.header-right :deep(.el-button--default:hover .el-icon) {
  color: #409eff !important;
}

/* Select Allbutton - selectedwhenspecialhandle */
.header-right :deep(.el-button--primary.is-circle[class*="el-button--primary"]:first-child) {
  background: #409eff;
  border: none;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

/* dynamicappearbuttonanimation */
.header-right :deep(.el-button--danger.is-circle),
.header-right :deep(.el-button--success.is-circle),
.header-right :deep(.el-button--warning.is-circle) {
  animation: slideInFromLeft 0.3s ease;
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}


/* buttoninsidetextstyle */
.header-right :deep(.el-button span) {
  font-size: 14px;
  letter-spacing: 0.3px;
}

/* buttonLoadingStatus */
.header-right :deep(.el-button.is-loading) {
  opacity: 0.8;
}

/* ExportDialogstyle */
.export-dialog {
  .el-message-box__message {
    padding: 0 !important;
  }
  
  input[type="radio"] {
    accent-color: #409eff;
    width: 16px;
    height: 16px;
    vertical-align: middle;
  }
  
  label:hover {
    background-color: #f5f7fa;
    border-radius: 6px;
    padding: 8px 12px;
    margin-left: -12px;
    margin-right: -12px;
  }
}

/* buttonDisableStatus */
.header-right :deep(.el-button.is-disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* filterpanelstyle */
.filter-panel {
  background: #ffffff;
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.filter-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.filter-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-panel-body {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-row-select {
  gap: 20px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item-range {
  flex: none;
  min-width: auto;
}

.filter-item-select {
  flex-shrink: 0;
}

.filter-item-select .el-select {
  width: 120px;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

.filter-range {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.filter-range .el-input-number {
  width: 72px;
}

.range-separator {
  color: #c0c4cc;
  font-size: 12px;
}

/* filterpanelanimation */
.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: all 0.3s ease;
}

.filter-slide-enter-from,
.filter-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Paginationcontainer */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  margin-top: 16px;
  background: transparent;
}

.pagination-container .el-pagination {
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* filterButton Style */
.filter-toggle-btn {
  margin-left: 12px;
}

.main-content {
  background: #f5f7fa;
  padding: 8px 6px;
}

.loading-container,
.empty-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.accounts-container {
  width: 100%;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
  gap: 8px;
  width: 100%;
  padding: 0;
}

/* responsivelayout */
@media (max-width: 1400px) {
  .accounts-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 1024px) {
  .main-content {
    padding: 10px 6px;
  }
  
  .accounts-grid {
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .accounts-grid {
    grid-template-columns: 1fr;
  }
  
  .header-left {
    max-width: 200px;
  }
  
  .main-content {
    padding: 8px 4px;
  }
}

/* Dark Themesupport */
:root.dark .sidebar {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.08);
}

:root.dark .sidebar-menu {
  background: #1e1e1e;
}

:root.dark .sidebar-menu .el-menu-item {
  background: transparent;
  color: #cfd3dc;
}

:root.dark .sidebar-menu .el-menu-item:hover {
  background-color: rgba(64, 158, 255, 0.05);
}

/* Groupitemstyle */
.group-item {
  position: relative;
}

.group-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.group-name {
  flex: 1;
  cursor: pointer;
}

.group-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

.group-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.group-action-icon {
  cursor: pointer;
  padding: 4px;
  transition: all 0.3s;
  color: #606266;
}

.group-action-icon:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 4px;
}

.group-action-icon.delete:hover {
  color: #f56c6c;
  background-color: rgba(245, 108, 108, 0.1);
}

/* Dark Themeadapt */
:root.dark .sidebar-menu .el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

:root.dark .sidebar-footer {
  background: #1e1e1e;
  border-top-color: rgba(255, 255, 255, 0.08);
}

:root.dark .sidebar-footer .el-button.is-circle {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
}

:root.dark .sidebar-footer .el-button.is-circle:hover {
  background-color: #303133;
  border-color: #5a5b5d;
  color: #409eff;
}

:root.dark .sidebar-footer .el-button.is-circle:active {
  background-color: #1a1a1c;
  border-color: #409eff;
}

:root.dark .header {
  background: linear-gradient(to bottom, #1e1e1e 0%, #1a1a1a 100%);
  border-bottom-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root.dark .search-input :deep(.el-input__wrapper) {
  background: #2a2a2a;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

:root.dark .search-input :deep(.el-input__wrapper:hover) {
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
}

:root.dark .search-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.25);
}

:root.dark .search-input :deep(.el-input__inner) {
  color: #e4e4e7;
}

:root.dark .search-input :deep(.el-input__prefix) {
  color: #94a3b8;
}

:root.dark .header-right :deep(.el-button--primary) {
  background: linear-gradient(135deg, #409eff 0%, #3b8cef 100%);
  box-shadow: 0 3px 10px rgba(64, 158, 255, 0.3);
}

:root.dark .header-right :deep(.el-button--primary:hover) {
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

:root.dark .header-right :deep(.el-button--danger) {
  background: linear-gradient(135deg, #f56c6c 0%, #f04848 100%);
  box-shadow: 0 3px 10px rgba(245, 108, 108, 0.3);
}

:root.dark .header-right :deep(.el-button--danger:hover) {
  box-shadow: 0 6px 16px rgba(245, 108, 108, 0.4);
}

:root.dark .header-right :deep(.el-button--success) {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  box-shadow: 0 3px 10px rgba(103, 194, 58, 0.3);
}

:root.dark .header-right :deep(.el-button--success:hover) {
  box-shadow: 0 6px 16px rgba(103, 194, 58, 0.4);
}

:root.dark .header-right :deep(.el-button--default) {
  background: linear-gradient(135deg, #2a2a2a 0%, #252525 100%);
  border-color: rgba(255, 255, 255, 0.1);
  color: #e4e4e7;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

:root.dark .header-right :deep(.el-button--default:hover) {
  background: linear-gradient(135deg, #303030 0%, #2a2a2a 100%);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}

:root.dark .header-right :deep(.el-button.is-circle) {
  background: linear-gradient(135deg, #2a2a2a 0%, #252525 100%);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

:root.dark .header-right :deep(.el-button.is-circle:hover) {
  background: linear-gradient(135deg, #1e3a5f 0%, #1a3454 100%);
  border-color: var(--el-color-primary-light-3);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

:root.dark .main-content {
  background: #121212;
}

/* Dark Modefilterpanel */
:root.dark .filter-panel {
  background: #1e1e1e;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:root.dark .filter-title {
  color: #e5eaf3;
}

:root.dark .filter-label {
  color: #a0aec0;
}

:root.dark .range-separator {
  color: #4a5568;
}

/* Dark ModePagination */
:root.dark .pagination-container .el-pagination {
  background: #1e1e1e;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* batchGroupDialogstyle */
.batch-group-content {
  padding: 10px 0;
}

.batch-group-hint {
  margin-bottom: 16px;
  color: #606266;
  font-size: 14px;
}

.batch-group-hint strong {
  color: #409eff;
  font-weight: 600;
}

:root.dark .batch-group-hint {
  color: #a0aec0;
}

/* batchtransferDialogstyle */
.email-count-hint {
  font-size: 14px;
  color: #606266;
}

.batch-transfer-progress {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.batch-transfer-progress .progress-status {
  margin-top: 12px;
  text-align: center;
  color: #64748b;
  font-size: 14px;
}

:root.dark .batch-transfer-progress {
  background: #2d3748;
}

:root.dark .batch-transfer-progress .progress-status {
  color: #a0aec0;
}

/* ==================== Group Managementchildmenusingle：超out限高after局部scroll ====================
 * background：global `.sidebar :deep(::-webkit-scrollbar) { display: none !important; }` forcehide
 *   Sidebarallscrollitems。whenGroupCount较multiple（e.g. > 8 ）when，el-sub-menu expand
 *   areawillputundersideothermenusingleitem顶outview口，Usernowayaccess亦nowayscroll。
 *
 * solution：onlyin .groups-submenu expandcontainer（:deep(.el-menu)）onre-Enablescroll：
 *   1. limit max-height（约 8 itemheight），超outthenappearscrollitems；
 *   2. usemore高特异property + !important coverglobal scrollbar hiderules，定制oneitems 6px 细scrollitems；
 *   3. "Add Group"buttonuse position: sticky 钉inbottom，scrollwhenalwayscansee。
 * collapsed state（collapse）under sub-menu is popper formrenderin <body> under，notwillnamedthisrules，no副makeuse。
 */

.sidebar-menu .groups-submenu :deep(.el-menu) {
  max-height: 360px;
  overflow-y: auto !important;
  overflow-x: hidden;
  scrollbar-width: thin !important;
  -ms-overflow-style: auto !important;
}

.sidebar-menu .groups-submenu :deep(.el-menu)::-webkit-scrollbar {
  display: block !important;
  width: 6px !important;
  background: transparent !important;
}

.sidebar-menu .groups-submenu :deep(.el-menu)::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color) !important;
  border-radius: 3px !important;
}

.sidebar-menu .groups-submenu :deep(.el-menu)::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-border-color-darker) !important;
}

/* “Add Group”fixedinexpandareabottom：scrollGroupListwhenthebuttonalwayscansee */
.sidebar-menu .groups-submenu :deep(.group-add-action) {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: var(--el-menu-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

</style>

<!--
  collapsed state sub-menu  popper was Element Plus via Teleport renderto <body> under，
  already 脱离thiscomponent DOM subtree；scoped style  `:deep()` nowaypenetrate Teleport，
  becausethiscollapsed statescrollstylemust放inunderside这“non- scoped” style blockin，
  via popper-class="groups-submenu-popper" 精准锁定，avoid污染global。
-->
<style>
/* ==================== Group Managementchildmenusingle：collapsed state popper overlay ==================== */

/* popper  ul.el-menu 限高 and Enablescroll；containermutualfor定isaslet sticky “Add Group”生效 */
.groups-submenu-popper .el-menu {
  max-height: 70vh;
  overflow-y: auto !important;
  overflow-x: hidden;
  position: relative;
  scrollbar-width: thin !important;
  -ms-overflow-style: auto !important;
}

.groups-submenu-popper .el-menu::-webkit-scrollbar {
  display: block !important;
  width: 6px !important;
  background: transparent !important;
}

.groups-submenu-popper .el-menu::-webkit-scrollbar-thumb {
  background-color: var(--el-border-color) !important;
  border-radius: 3px !important;
}

.groups-submenu-popper .el-menu::-webkit-scrollbar-thumb:hover {
  background-color: var(--el-border-color-darker) !important;
}

/* “Add Group”button贴底：scrollGroupListwhenalwayscansee */
.groups-submenu-popper .el-menu .group-add-action {
  position: sticky;
  bottom: 0;
  z-index: 1;
  background-color: var(--el-bg-color-overlay, var(--el-menu-bg-color));
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
