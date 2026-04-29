<template>
  <el-dialog
    v-model="uiStore.showSettingsDialog"
    title="Settings"
    width="700px"
  >
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Basic Settings Tab Page -->
      <el-tab-pane label="Basic Settings" name="basic">
        <el-form :model="settings" label-width="140px">
          <el-form-item label="Auto Refresh Token">
            <el-switch v-model="settings.auto_refresh_token" />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, Token will auto refresh when expires
            </div>
          </el-form-item>
          
          <el-form-item label="Full Concurrent Refresh" v-if="settings.auto_refresh_token">
            <el-switch v-model="settings.unlimitedConcurrentRefresh" />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, auto refresh token when all accounts concurrent, not limited by concurrent limit, can save significant time
            </div>
          </el-form-item>
          
          <!-- Seat Countoption - simple VersionDisabled
          <el-form-item label="Seat Countoption">
            <el-input
              v-model="seatCountOptionsInput"
              placeholder="e.g.: 18, 19, 20"
              style="width: 200px;"
              @blur="parseSeatCountOptions"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              CreditsResetwhenround番useSeat Count，use逗delimiter（e.g.：18, 19, 20）
            </div>
          </el-form-item>
          -->
          
          <el-form-item label="Retry Count">
            <el-input-number
              v-model="settings.retry_times"
              :min="1"
              :max="5"
              :step="1"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              API call failed retry count
            </div>
          </el-form-item>
          
          <el-form-item label="Concurrent Limit">
            <el-input-number
              v-model="settings.concurrent_limit"
              :min="1"
              :max="10"
              :step="1"
              :disabled="settings.unlimitedConcurrentRefresh"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              {{ settings.unlimitedConcurrentRefresh ? 'Already enabled full concurrent refresh, this setting does not affect auto refresh' : 'Batch operations max concurrent count' }}
            </div>
          </el-form-item>
          
          <el-form-item label="Theme">
            <el-radio-group v-model="settings.theme">
              <el-radio-button label="light">light</el-radio-button>
              <el-radio-button label="dark">dark</el-radio-button>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="Display Detailed Result">
            <el-switch 
              v-model="settings.show_seats_result_dialog"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, credits reset will display detailed seat update result dialog
            </div>
          </el-form-item>
          
          <el-form-item label="Privacy Mode">
            <el-switch 
              v-model="settings.privacyMode"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, all email addresses will display as random characters to protect privacy (suitable for screenshot demos)
            </div>
          </el-form-item>
          
          <el-divider content-position="left">Network Maintenance</el-divider>
          
          <el-form-item label="Lightweight Level API">
            <el-switch 
              v-model="settings.useLightweightApi"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Enabled when using GetPlanStatus to fetch quota info (faster), disabled when using GetCurrentUser (data more complete)
            </div>
          </el-form-item>
          
          <el-form-item label="Enable Proxy">
            <el-switch 
              v-model="settings.proxyEnabled"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, login and refresh token, Google API requests will proceed via proxy
            </div>
          </el-form-item>
          
          <el-form-item label="ProxyAddress" v-if="settings.proxyEnabled">
            <el-input
              v-model="settings.proxyUrl"
              placeholder="http://127.0.0.1:7890"
              style="width: 280px;"
              clearable
            >
              <template #prefix>
                <el-icon><Connection /></el-icon>
              </template>
            </el-input>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              support HTTP/HTTPS/SOCKS5 Proxy，format：http://host:port  or  socks5://host:port
            </div>
          </el-form-item>
          
          <el-form-item label="Reset Network Connect">
            <el-button 
              type="warning" 
              @click="handleResetHttpClient"
              :loading="resettingHttp"
            >
              Reset HTTP Client
            </el-button>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              When meeting consecutive API request failures, click this button to reset network connection pool
            </div>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      
      <!-- Payment Settings Tab Page -->
      <el-tab-pane label="Payment Settings" name="payment">
        <el-form :model="settings" label-width="140px">
          <el-divider content-position="left">Subscription Plan Settings</el-divider>
          
          <el-form-item label="Subscription Plan">
            <el-select v-model="settings.subscriptionPlan" style="width: 100%;">
              <el-option-group label="Windsurf common">
                <el-option label="Pro Pro" :value="2" />
                <el-option label="Max Flagship" :value="18" />
                <el-option label="Teams Team" :value="1" />
                <el-option label="Trial Trial" :value="9" />
                <el-option label="Free Free" :value="0" />
              </el-option-group>
              <el-option-group label="Windsurf Ultimate">
                <el-option label="Pro Ultimate" :value="8" />
                <el-option label="Teams Ultimate" :value="7" />
              </el-option-group>
              <el-option-group label="Enterprise">
                <el-option label="Enterprise SaaS" :value="3" />
                <el-option label="Enterprise Self-Serve" :value="10" />
                <el-option label="Enterprise Self-Hosted" :value="5" />
                <el-option label="Enterprise SaaS Pooled" :value="11" />
                <el-option label="Hybrid" :value="4" />
              </el-option-group>
              <el-option-group label="Devin">
                <el-option label="Devin Pro" :value="16" />
                <el-option label="Devin Max" :value="17" />
                <el-option label="Devin Teams" :value="14" />
                <el-option label="Devin Teams V2" :value="15" />
                <el-option label="Devin Enterprise" :value="12" />
                <el-option label="Devin Free" :value="19" />
                <el-option label="Devin Trial" :value="20" />
              </el-option-group>
              <el-option-group label="Other">
                <el-option label="Waitlist Pro" :value="6" />
              </el-option-group>
            </el-select>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Select subscription plan type, Pro plan needs to complete Turnstile human verification
            </div>
          </el-form-item>
          
          <el-form-item label="Payment Period">
            <el-select v-model="settings.paymentPeriod" style="width: 100%;">
              <el-option label="Monthly" :value="1" />
              <el-option label="Annually" :value="2" />
            </el-select>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Annually can usually enjoy optimal discounted prices
            </div>
          </el-form-item>
          
          <el-form-item label="Enable Trial">
            <el-switch 
              v-model="settings.startTrial"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Use trial method to start subscription, disabled then directly enter paid subscription
            </div>
          </el-form-item>
          
          <el-form-item label="Team Name" v-if="[1, 3, 4, 5, 7, 10, 11, 12, 14, 15].includes(settings.subscriptionPlan)">
            <el-input 
              v-model="settings.teamName" 
              placeholder="Input team name (required for Teams class plan)"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Teams class plan needs to fill in team name
            </div>
          </el-form-item>
          
          <el-form-item label="Seat Count" v-if="[1, 3, 4, 5, 7, 10, 11, 12, 14, 15].includes(settings.subscriptionPlan)">
            <el-input-number 
              v-model="settings.seatCount" 
              :min="1" 
              :max="1000"
              style="width: 100%;"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Teams Plan Seat Count
            </div>
          </el-form-item>
          
          <el-divider content-position="left">Payment Page Settings</el-divider>
          
          <el-form-item label="Auto Open Payment Page">
            <el-switch 
              v-model="settings.autoOpenPaymentLinkInWebview"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, fetch bind card link successfully will auto open built-in browser window in payment page (privacy mode, will not save any data)
            </div>
          </el-form-item>
          
          <el-divider content-position="left">External Browser Settings</el-divider>
          
          <el-form-item label="Auto Open External Browser">
            <el-switch 
              v-model="settings.autoOpenBrowser"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, fetch bind card link will auto open in external browser (no need to click confirm)
            </div>
          </el-form-item>
          
          <el-form-item label="Browser Mode">
            <el-radio-group v-model="settings.browserMode">
              <el-radio-button label="incognito">Incognito Mode</el-radio-button>
              <el-radio-button label="normal">Normal Mode</el-radio-button>
            </el-radio-group>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Select mode when opening external browser (Incognito mode more secure, recommended)
            </div>
          </el-form-item>
          
          <el-divider content-position="left">Auto Fill Settings</el-divider>
          
          <el-form-item label="Auto Fill Payment Form">
            <el-switch 
              v-model="settings.autoFillPaymentForm"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, will auto use virtual card info to fill in Stripe payment form (only for testing)
            </div>
          </el-form-item>
          
          <el-form-item label="Display Virtual Card Info">
            <el-switch 
              v-model="settings.showVirtualCardInfo"
              active-text="enabled"
              inactive-text="disabled"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, auto fill form will display generated virtual card info in dialog
            </div>
          </el-form-item>
          
          <el-form-item label="Auto Submit Form">
            <el-switch 
              v-model="settings.autoSubmitPaymentForm"
              active-text="enabled"
              inactive-text="disabled"
              :disabled="!settings.autoFillPaymentForm"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, will auto submit after form fill is complete (use carefully)
            </div>
          </el-form-item>
          
          <el-form-item label="Payment Page Delay (seconds)">
            <el-input-number
              v-model="settings.paymentPageDelay"
              :min="1"
              :max="10"
              :step="1"
              :disabled="!settings.autoFillPaymentForm"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Wait a few seconds after starting auto fill form
            </div>
          </el-form-item>
          
          <el-form-item label="Custom Card Header">
            <el-input
              v-model="settings.customCardBin"
              placeholder="Please enter 4-12 digit number"
              maxlength="12"
              @input="validateCardBin"
            >
              <template #append>
                <el-button @click="resetCardBin">Restore Default</el-button>
              </template>
            </el-input>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Set virtual card prefix (BIN), must be 4-12 digit number, default is 626202
            </div>
          </el-form-item>
          
          <el-form-item label="Card Range (Optional)">
            <el-input
              v-model="settings.customCardBinRange"
              placeholder="e.g.: 626200-626300"
              @input="validateCardBinRange"
            >
              <template #append>
                <el-button @click="clearCardBinRange">Clear</el-button>
              </template>
            </el-input>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After setting card range, bind card will randomly select one BIN from the range. Format: startBIN-endBIN
            </div>
          </el-form-item>
          
          <el-form-item label="Bind Card Failed Retry Count">
            <el-input-number
              v-model="settings.cardBindRetryTimes"
              :min="0"
              :max="20"
              :step="1"
              controls-position="right"
            />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Bind card failed then auto regenerate card number retry count, set as 0 to not retry
            </div>
          </el-form-item>
          
          <el-divider content-position="left">Card BIN Pool Feature</el-divider>
          
          <el-form-item label="Test Mode">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-switch v-model="settings.testModeEnabled" />
              <el-button 
                size="small" 
                type="warning" 
                @click="resetTestModeProgress"
                :disabled="!testModeProgress"
              >
                Reset Progress
              </el-button>
            </div>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, iterate card BIN range in order and collect successful BIN (pool count: {{ successBinCount }})
              <span v-if="testModeProgress" style="color: #67C23A;">
                <br/>Current progress: {{ testModeProgress }}
              </span>
            </div>
          </el-form-item>
          
          <el-form-item label="Use Local BIN Pool">
            <el-switch v-model="settings.useLocalSuccessBins" :disabled="successBinCount === 0" />
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              After enabling, auto fetch card BIN from local successful BIN pool randomly to generate card number
            </div>
          </el-form-item>
          
          <el-form-item label="BIN Pool Management">
            <el-button-group>
              <el-button size="small" @click="viewSuccessBins" :disabled="successBinCount === 0">
                View BIN Pool
              </el-button>
              <el-button size="small" type="danger" @click="clearSuccessBins" :disabled="successBinCount === 0">
                Clear BIN Pool
              </el-button>
            </el-button-group>
          </el-form-item>
          
          <el-alert
            title="Important Notice"
            type="warning"
            :closable="false"
            show-icon
            style="margin-top: 20px;"
          >
            <template #default>
              <div style="font-size: 12px; line-height: 1.6;">
                <p>🔒 Built-in browser uses privacy mode, will not save any browser data, cookies or history records.</p>
                <p>⚠️ Virtual card info generation can only be used for testing, please do not use for actual payments.</p>
                <p>⚠️ When using this feature, please ensure compliance with Stripe and related payment service terms.</p>
                <p>⚠️ Do not generate virtual card info for any fraudulent or unauthorized use.</p>
              </div>
            </template>
          </el-alert>
        </el-form>
      </el-tab-pane>
      
      <!-- Seamless Switch Tab Page -->
      <el-tab-pane label="Seamless Switch" name="seamless">
        <el-form :model="settings" label-width="140px">
          <el-form-item label="Client Type">
            <el-select
              v-model="settings.windsurfClientType"
              style="width: 200px;"
              @change="handleClientTypeChange"
            >
              <el-option label="Windsurf" value="windsurf" />
              <el-option label="Windsurf - Next" value="windsurf-next" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Install Path">
            <el-input
              v-model="windsurfPath"
              placeholder="Please enter or click auto detect to fetch path"
              @blur="handlePathChange"
            >
              <template #append>
                <el-button-group>
                  <el-button @click="detectWindsurfPath" :loading="detectingPath">
                    Auto Detect
                  </el-button>
                  <el-button @click="browseWindsurfPath">
                    Browse
                  </el-button>
                </el-button-group>
              </template>
            </el-input>
            <div style="margin-top: 5px; color: #909399; font-size: 12px;">
              Can manually input path or auto detect from start menu {{ settings.windsurfClientType === 'windsurf-next' ? 'Windsurf - Next' : 'Windsurf' }} Install Path
            </div>
          </el-form-item>
          
          <el-form-item label="Enable Seamless Switch">
            <el-switch 
              v-model="settings.seamlessSwitchEnabled"
              active-text="enabled"
              inactive-text="disabled"
              :loading="patchLoading"
              @change="handleSeamlessSwitch"
              :disabled="!windsurfPath"
            />
          </el-form-item>
          
          <el-form-item label="patchStatus">
            <div class="patch-status-block">
              <!-- summaryTotal tag + Operationbutton -->
              <div class="patch-status-header">
                <el-tag :type="patchSummary.type">{{ patchSummary.label }}</el-tag>
                <el-button
                  v-if="canUpgrade"
                  type="warning"
                  size="small"
                  :loading="patchLoading"
                  @click="handleUpgradePatch"
                >
                  Upgrade Patch
                </el-button>
                <el-button
                  v-if="windsurfPath"
                  size="small"
                  @click="checkPatchStatus"
                >
                  Re-detect
                </el-button>
              </div>
              <!-- Sub-item checklist (show when has path and no IO error) -->
              <div
                v-if="windsurfPath && !patchStatus.error"
                class="patch-checklist"
              >
                <div
                  v-for="item in patchItems"
                  :key="item.key"
                  class="patch-checklist-item"
                  :class="{ 'is-applied': item.applied }"
                >
                  <el-icon v-if="item.applied" class="patch-checklist-icon is-applied">
                    <Check />
                  </el-icon>
                  <el-icon v-else class="patch-checklist-icon">
                    <Close />
                  </el-icon>
                  <span>{{ item.label }}</span>
                </div>
              </div>
            </div>
          </el-form-item>
          
          <el-alert
            title="Feature Description"
            type="info"
            :closable="false"
            show-icon
            style="margin-top: 20px;"
          >
            <template #default>
              <div style="font-size: 12px; line-height: 1.6;">
                <p>🚀 Seamless Switch Feature: Implement Windsurf / Windsurf - Next Account no sense switch</p>
                <p>⚠️ Note: Enabled/disabled when if client currently running then auto restart, not running then not restart</p>
              </div>
            </template>
          </el-alert>
          
          <el-divider content-position="left">Windsurf MCP</el-divider>
          
          <el-form-item label="Enable MCP Feature">
            <el-switch 
              v-model="settings.cunzhiEnabled"
              active-text="enabled"
              inactive-text="disabled"
              :loading="cunzhiLoading"
              @change="handleCunzhiSwitch"
            />
          </el-form-item>
          
          <el-form-item label="Rate Limit Status">
            <el-tag v-if="cunzhiStatus.installed" type="success">Installed</el-tag>
            <el-tag v-else-if="cunzhiStatus.error" type="danger">{{ cunzhiStatus.error }}</el-tag>
            <el-tag v-else type="info">Not installed</el-tag>
            <el-button 
              v-if="cunzhiStatus.installed" 
              size="small" 
              style="margin-left: 10px;"
              @click="checkCunzhiStatus"
            >
              Re-detect
            </el-button>
          </el-form-item>
          
          <el-alert
            title="MCP Feature Description"
            type="success"
            :closable="false"
            show-icon
            style="margin-top: 10px;"
          >
            <template #default>
              <div style="font-size: 12px; line-height: 1.6;">
                <p>💊 MCP Feature: Prevent AI from ending dialog automatically, let you control dialog pace</p>
                <p>⚠️ Note: Enabled/disabled after need restart Windsurf to take effect</p>
              </div>
            </template>
          </el-alert>
        </el-form>
      </el-tab-pane>
      
      <!-- Backup Settings Tab Page -->
      <el-tab-pane label="Backup Settings" name="backup">
        <el-form :model="settings" label-width="140px">
          <el-form-item label="Auto Backup">
            <el-switch v-model="settings.autoBackupEnabled" />
            <span style="margin-left: 10px; color: #909399; font-size: 12px;">
              After enabling, will auto backup data at set interval
            </span>
          </el-form-item>
          
          <el-form-item label="Backup Interval">
            <el-input-number
              v-model="settings.backupInterval"
              :min="1"
              :max="1440"
              :step="5"
              :disabled="!settings.autoBackupEnabled"
            />
            <span style="margin-left: 10px; color: #909399;">minutes</span>
          </el-form-item>
          
          <el-form-item label="Maxbackupcount">
            <el-input-number
              v-model="settings.backupMaxCount"
              :min="1"
              :max="100"
            />
            <span style="margin-left: 10px; color: #909399;">份（超outthen autoDeletemost早backup）</span>
          </el-form-item>
          
          <el-divider content-position="left">manuallyOperation</el-divider>
          
          <el-form-item label="immediatelybackup">
            <el-button type="primary" @click="handleManualBackup" :loading="backupLoading">
              createbackup
            </el-button>
          </el-form-item>
          
          <el-form-item label="backupList">
            <el-button @click="handleShowBackups" :loading="loadingBackups">
              Viewbackup
            </el-button>
          </el-form-item>
          
          <el-alert type="info" :closable="false" style="margin-top: 15px;">
            <template #title>
              <span style="font-weight: bold;">backupdescription</span>
            </template>
            <template #default>
              <div style="line-height: 1.8;">
                <p>backupfileSaveinapplydataitem录 <code>backups</code> file夹in</p>
                <p>containstounderdata：Account Info、Group、Tags、Settingsetc.</p>
              </div>
            </template>
          </el-alert>
        </el-form>
        
        <!-- backupListDialog -->
        <el-dialog
          v-model="showBackupsDialog"
          title="backupList"
          width="600px"
          append-to-body
        >
          <el-table :data="backupList" v-loading="loadingBackups" max-height="400">
            <el-table-column prop="name" label="filename" />
            <el-table-column label="size" width="100">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column label="Created At" width="180">
              <template #default="{ row }">
                {{ formatBackupTime(row.name) }}
              </template>
            </el-table-column>
            <el-table-column label="Operation" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="handleRestoreBackup(row)">
                  restore
                </el-button>
                <el-button type="danger" size="small" link @click="handleDeleteBackup(row)">
                  Delete
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
    
    <template #footer>
      <el-button @click="handleClose">Cancel</el-button>
      <el-button type="primary" @click="handleSave" :loading="loading">
        Save
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Connection, Check, Close } from '@element-plus/icons-vue';
import { useSettingsStore, useUIStore } from '@/store';
import { invoke } from '@tauri-apps/api/core';
import { systemApi } from '@/api';

const settingsStore = useSettingsStore();
const uiStore = useUIStore();

const loading = ref(false);
const activeTab = ref('basic');  // CurrentactivateTagspage
const seatCountOptionsInput = ref('18, 19, 20');  // Seat Countoptioninputbox
const resettingHttp = ref(false);  // HTTPClientResetin

// parseSeat Countoption
function parseSeatCountOptions() {
  const input = seatCountOptionsInput.value.trim();
  if (!input) {
    settings.seat_count_options = [18, 19, 20];
    seatCountOptionsInput.value = '18, 19, 20';
    return;
  }
  
  const numbers = input.split(/[,，\s]+/)
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n > 0);
  
  if (numbers.length === 0) {
    ElMessage.warning('Please entervalidSeat Count');
    settings.seat_count_options = [18, 19, 20];
    seatCountOptionsInput.value = '18, 19, 20';
  } else {
    settings.seat_count_options = numbers;
    seatCountOptionsInput.value = numbers.join(', ');
  }
}

const settings = reactive<{
  auto_refresh_token: boolean;
  seat_count_options: number[];
  retry_times: number;
  theme: string;
  concurrent_limit: number;
  show_seats_result_dialog: boolean;
  autoOpenPaymentLinkInWebview: boolean;
  autoFillPaymentForm: boolean;
  autoSubmitPaymentForm: boolean;
  paymentPageDelay: number;
  showVirtualCardInfo: boolean;
  customCardBin: string;
  customCardBinRange: string;
  cardBindRetryTimes: number;
  testModeEnabled: boolean;
  useLocalSuccessBins: boolean;
  seamlessSwitchEnabled: boolean;
  windsurfClientType: 'windsurf' | 'windsurf-next';
  windsurfPath: string | null;
  patchBackupPath: string | null;
  autoOpenBrowser: boolean;
  browserMode: 'incognito' | 'normal';
  privacyMode: boolean;
  unlimitedConcurrentRefresh: boolean;
  proxyEnabled: boolean;
  proxyUrl: string | null;
  useLightweightApi: boolean;
  subscriptionPlan: number;
  paymentPeriod: number;
  startTrial: boolean;
  teamName: string;
  seatCount: number;
  cunzhiEnabled: boolean;
  autoBackupEnabled: boolean;
  backupInterval: number;
  backupMaxCount: number;
}>({
  auto_refresh_token: true,
  seat_count_options: [18, 19, 20],
  retry_times: 2,
  theme: 'light',
  concurrent_limit: 5,
  show_seats_result_dialog: false,  // defaultdisabled
  autoOpenPaymentLinkInWebview: false,  // defaultdisabledautoopenpaymentPage
  autoFillPaymentForm: false,  // defaultdisabledauto fill form
  autoSubmitPaymentForm: false,  // defaultdisabledautoSubmit
  paymentPageDelay: 2,  // defaultdelay2seconds
  showVirtualCardInfo: false,  // defaultdisabledVirtual CardInfodialog
  customCardBin: '626202',  // defaultcard header
  customCardBinRange: '',  // defaultnotusecard range
  cardBindRetryTimes: 5,  // defaultbind cardretry5time
  testModeEnabled: false,  // defaultdisabledtestMode
  useLocalSuccessBins: false,  // defaultnotuselocalBINpool
  seamlessSwitchEnabled: false,  // defaultdisabledSeamless Switch
  windsurfClientType: 'windsurf',  // default Windsurf Client
  windsurfPath: null,  // Windsurfpath
  patchBackupPath: null,  // patchbackuppath
  autoOpenBrowser: true,  // defaultautoopenbrowser
  browserMode: 'incognito',  // defaultIncognito Mode
  privacyMode: false,  // defaultdisabledprivacyMode
  unlimitedConcurrentRefresh: false,  // defaultdisabledfull concurrentRefresh
  proxyEnabled: false,  // defaultdisabledProxy
  proxyUrl: null,  // defaultnoProxyAddress
  useLightweightApi: true,  // defaultuselightweightlevelAPI
  subscriptionPlan: 2,  // default Pro plan
  paymentPeriod: 1,  // defaultMonthly
  startTrial: true,  // defaultenabledtrial
  teamName: '',  // defaultemptyTeam Name
  seatCount: 1,  // default1Seat
  cunzhiEnabled: false,  // defaultdisabledMCP Feature
  autoBackupEnabled: true,  // defaultEnableautobackup
  backupInterval: 10,  // default10minutes
  backupMaxCount: 10,  // defaultmostmultiple10份
});

// backuprelated
const backupLoading = ref(false);
const loadingBackups = ref(false);
const showBackupsDialog = ref(false);
const backupList = ref<Array<{ name: string; path: string; size: number }>>([]);

interface BackupInfo {
  name: string;
  path: string;
  size: number;
}

async function handleManualBackup() {
  backupLoading.value = true;
  try {
    const result = await invoke<{ success: boolean; path: string; message: string }>('create_backup');
    if (result.success) {
      ElMessage.success('backupcreatesuccessful');
    }
  } catch (e: any) {
    ElMessage.error(`backupfailed: ${e}`);
  } finally {
    backupLoading.value = false;
  }
}

async function handleShowBackups() {
  loadingBackups.value = true;
  showBackupsDialog.value = true;
  try {
    backupList.value = await invoke<BackupInfo[]>('list_backups');
  } catch (e: any) {
    ElMessage.error(`fetchbackupListfailed: ${e}`);
    backupList.value = [];
  } finally {
    loadingBackups.value = false;
  }
}

async function handleRestoreBackup(backup: BackupInfo) {
  try {
    await ElMessageBox.confirm(
      `Confirmneed tofrombackup "${backup.name}" restoredata?？Currentdatawillwascover（willfirstautobackupCurrentdata）。`,
      'Confirmrestore',
      { type: 'warning' }
    );
    
    await invoke('restore_backup', { backupPath: backup.path });
    ElMessage.success('restoresuccessful，pleaseRefreshPage');
    showBackupsDialog.value = false;
    await settingsStore.loadSettings();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(`restorefailed: ${e}`);
    }
  }
}

async function handleDeleteBackup(backup: BackupInfo) {
  try {
    await ElMessageBox.confirm(
      `Confirmneed toDeletebackup "${backup.name}" ?？thisOperationnotcanrestore。`,
      'Confirm Delete',
      { type: 'warning' }
    );
    
    await invoke('delete_backup', { backupName: backup.name });
    ElMessage.success('backupDeleted');
    await handleShowBackups();
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(`Delete failed: ${e}`);
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatBackupTime(name: string): string {
  // fromfilename accounts_20260109_231500.json 提getTime
  const match = name.match(/accounts_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
  }
  return name;
}

// successfulBINpoolrelated
const successBinCount = ref(0);
const testModeProgress = ref<string | null>(null);

async function loadSuccessBinCount() {
  try {
    const bins = await invoke<string[]>('get_success_bins');
    successBinCount.value = bins.length;
  } catch (e) {
    successBinCount.value = 0;
  }
}

async function loadTestModeProgress() {
  try {
    testModeProgress.value = await invoke<string | null>('get_test_mode_progress');
  } catch (e) {
    testModeProgress.value = null;
  }
}

async function resetTestModeProgress() {
  try {
    await ElMessageBox.confirm('Confirmneed toResettestModeprogress?？undertimewillfromrangestartsetstart。', 'ConfirmReset', {
      type: 'warning'
    });
    await invoke('reset_test_mode_progress');
    testModeProgress.value = null;
    ElMessage.success('progressReset');
  } catch (e) {
    // UserCancel
  }
}

async function viewSuccessBins() {
  try {
    const bins = await invoke<string[]>('get_success_bins');
    if (bins.length === 0) {
      ElMessage.info('BINpoolasempty');
      return;
    }
    ElMessageBox.alert(
      `<div style="max-height: 300px; overflow-y: auto;">
        <p><b>total ${bins.length}  succeededBIN：</b></p>
        <p style="font-family: monospace; word-break: break-all;">${bins.join(', ')}</p>
      </div>`,
      'successfulBINpool',
      { dangerouslyUseHTMLString: true }
    );
  } catch (e) {
    ElMessage.error('fetchBINpoolfailed');
  }
}

async function clearSuccessBins() {
  try {
    await ElMessageBox.confirm('Confirmneed toClearallsuccessfulcardBIN?？', 'ConfirmClear', {
      type: 'warning'
    });
    await invoke('clear_success_bins');
    successBinCount.value = 0;
    ElMessage.success('BINpoolalready Clear');
  } catch (e) {
    // UserCancel
  }
}

// Seamless Switchrelated
const windsurfPath = ref('');
const detectingPath = ref(false);
const patchLoading = ref(false);
// patchStatus（fieldwith backend check_patch_status Backoneonecorresponding）
// - installed: three child itemspatchAllapply = true（bybackendsummaryTotal）
// - oauthHandler / timeoutRemoved / promptBypassApplied: three child itemspatch各自whetheralready apply
// - currentVersion: fileinwhether含has"CurrentVersioninjectcodecode"特征string，used fordistinguish
//   Currenttool vs history/third-partytool打patch（see CURRENT_VERSION_MARKER）
const patchStatus = reactive({
  installed: false,
  error: '',
  oauthHandler: false,
  timeoutRemoved: false,
  promptBypassApplied: false,
  currentVersion: false,
});

// patchthree child itemsContentstructuredata，驱动 UI checklist render
// orderwith backend apply branchmaintainconsistent（6.1 / 6.2 / 6.3），side便Userfor照
const patchItems = computed(() => [
  { key: 'oauthHandler', label: 'OAuth backcallhandlemanager', applied: patchStatus.oauthHandler },
  { key: 'timeoutRemoved', label: 'remove 180 secondstimeoutlimit', applied: patchStatus.timeoutRemoved },
  { key: 'promptBypassApplied', label: 'skipswitchConfirmDialog', applied: patchStatus.promptBypassApplied },
]);

// already applysub-itemcount（0 ~ 3），UI summaryTotaltextuse
const patchAppliedCount = computed(() =>
  patchItems.value.filter(item => item.applied).length
);

// whetherdisplay"uplevelpatch"button：fileinalready throughis"CurrentVersioninjectcodecode"，butcertainsomesub-itemalsonoapply。
// 典typescenario：Userofbefore打passoldversiontoolgenerate 1+2 patch，newtoolVersion又加# 3 items，needone键补齐。
const canUpgrade = computed(() =>
  patchStatus.currentVersion &&
  !patchStatus.installed &&
  patchAppliedCount.value > 0
);

// summaryTotal tag：based onthree child itemsStatus + current_version dispatch生四种render
// - error: backendon报read/rulesError
// - Not installed: 0/3
// - Installed: 3/3（installed=true）
// - Upgradable: isCurrentVersionpatchbutnotcomplete → canUpgrade=true
// - third-partypatch: PartialapplybutnoCurrentVersion特征 → possiblyishistoryVersion or othertool打
const patchSummary = computed<{ type: 'success' | 'info' | 'warning' | 'danger'; label: string }>(() => {
  if (patchStatus.error) {
    return { type: 'danger', label: patchStatus.error };
  }
  if (patchStatus.installed) {
    return { type: 'success', label: 'Installed' };
  }
  if (patchAppliedCount.value === 0) {
    return { type: 'info', label: 'Not installed' };
  }
  if (canUpgrade.value) {
    return { type: 'warning', label: `Upgradable ${patchAppliedCount.value}/3` };
  }
  return { type: 'warning', label: `third-partypatch ${patchAppliedCount.value}/3` };
});

// MCP(Rate Limit)related
const cunzhiLoading = ref(false);
const cunzhiStatus = reactive({
  installed: false,
  error: '',
});

watch(() => uiStore.showSettingsDialog, async (show) => {
  if (show && settingsStore.settings) {
    Object.assign(settings, settingsStore.settings);
    windsurfPath.value = settings.windsurfPath || '';
    // syncSeat Countoptiontoinputbox
    if (settings.seat_count_options && settings.seat_count_options.length > 0) {
      seatCountOptionsInput.value = settings.seat_count_options.join(', ');
    }
    // checkpatchStatus
    if (windsurfPath.value) {
      await checkPatchStatus();
    }
    // checkMCPStatus
    await checkCunzhiStatus();
    // LoadingsuccessfulBINpoolCount and testModeprogress
    await loadSuccessBinCount();
    await loadTestModeProgress();
  }
});

onMounted(async () => {
  // ifalready haspath，checkStatus
  const storedPath = (settingsStore.settings as any)?.windsurfPath;
  if (storedPath) {
    settings.windsurfPath = storedPath;
    windsurfPath.value = storedPath;
    await checkPatchStatus();
  }
});

async function handleSave() {
  loading.value = true;
  try {
    // ensureSavepathSettings
    if (windsurfPath.value) {
      settings.windsurfPath = windsurfPath.value;
    }
    await settingsStore.updateSettings(settings);
    uiStore.setTheme(settings.theme as 'light' | 'dark');
    ElMessage.success('SettingsSavesuccessful');
    handleClose();
  } catch (error) {
    ElMessage.error(`Savefailed: ${error}`);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  uiStore.showSettingsDialog = false;
}

// Verifycard headerinput
function validateCardBin(value: string) {
  // onlyallowcountcharacter
  const cleaned = value.replace(/[^\d]/g, '');
  settings.customCardBin = cleaned;
  
  // checklength
  if (cleaned.length > 0 && cleaned.length < 4) {
    ElMessage.warning('card headermust be4-12-digit number');
  }
}

// restoredefaultcard header
function resetCardBin() {
  settings.customCardBin = '626202';
  ElMessage.success('already restoredefaultcard header');
}

// Verifycard rangeformat
function validateCardBinRange(value: string) {
  // onlyallowcountcharacter and 连character
  const cleaned = value.replace(/[^\d-]/g, '');
  settings.customCardBinRange = cleaned;
  
  // ifinputContent，Verifyformat
  if (cleaned && cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length === 2) {
      const [start, end] = parts;
      // Verifytwosidelengthmutualsameandalliscountcharacter
      if (start && end && start.length === end.length) {
        const startNum = parseInt(start, 10);
        const endNum = parseInt(end, 10);
        if (startNum > endNum) {
          ElMessage.warning('startBINmustless than or etc.于endBIN');
        }
      } else if (start && end && start.length !== end.length) {
        ElMessage.warning('start and endBINlengthmustmutualsame');
      }
    }
  }
}

// Clearcard range
function clearCardBinRange() {
  settings.customCardBinRange = '';
  ElMessage.success('already Clearcard range');
}

// SwitchClienttypewhenClearpath and re-detect
async function handleClientTypeChange() {
  windsurfPath.value = '';
  settings.windsurfPath = null;
  settings.seamlessSwitchEnabled = false;
  patchStatus.installed = false;
  patchStatus.error = '';
  patchStatus.oauthHandler = false;
  patchStatus.timeoutRemoved = false;
  patchStatus.promptBypassApplied = false;
  patchStatus.currentVersion = false;
  await settingsStore.updateSettings(settings);
  // autodetectnewClientpath
  await detectWindsurfPath();
}

// detectWindsurfpath
async function detectWindsurfPath() {
  detectingPath.value = true;
  const clientLabel = settings.windsurfClientType === 'windsurf-next' ? 'Windsurf - Next' : 'Windsurf';
  try {
    const path = await invoke<string>('get_windsurf_path', {
      clientType: settings.windsurfClientType
    });
    windsurfPath.value = path;
    settings.windsurfPath = path;
    ElMessage.success(`Found ${clientLabel} Install Path`);
    // checkpatchStatus
    await checkPatchStatus();
    // SavepathSettingsto local
    await settingsStore.updateSettings(settings);
  } catch (error) {
    ElMessage.error(`detectfailed: ${error}`);
    windsurfPath.value = '';
  } finally {
    detectingPath.value = false;
  }
}

// checkpatchStatus
async function checkPatchStatus() {
  if (!windsurfPath.value) return;
  
  try {
    const status = await invoke<any>('check_patch_status', {
      windsurfPath: windsurfPath.value
    });
    patchStatus.installed = status.installed;
    patchStatus.error = status.error || '';
    patchStatus.oauthHandler = !!status.oauth_handler;
    patchStatus.timeoutRemoved = !!status.timeout_removed;
    patchStatus.promptBypassApplied = !!status.prompt_bypass_applied;
    patchStatus.currentVersion = !!status.current_version;
    
    // synctoggleStatusandactualpatchStatus
    if (status.installed !== settings.seamlessSwitchEnabled) {
      settings.seamlessSwitchEnabled = status.installed;
      // SavesyncafterStatus
      await settingsStore.updateSettings(settings);
    }
  } catch (error) {
    patchStatus.installed = false;
    patchStatus.oauthHandler = false;
    patchStatus.timeoutRemoved = false;
    patchStatus.promptBypassApplied = false;
    patchStatus.currentVersion = false;
    patchStatus.error = error as string;
  }
}

// handlepathchange
function handlePathChange() {
  if (windsurfPath.value) {
    settings.windsurfPath = windsurfPath.value;
    // checknewpathpatchStatus
    checkPatchStatus();
  }
}

// browseselectpath
async function browseWindsurfPath() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'selectWindsurfinstallitem录'
    });
    
    if (selected && typeof selected === 'string') {
      // Verifyselectpathwhethercontainsextension.jsfile
      const isValid = await invoke<boolean>('validate_windsurf_path', {
        path: selected
      });
      
      if (isValid) {
        windsurfPath.value = selected;
        settings.windsurfPath = selected;
        ElMessage.success('SelectedWindsurfpath');
        await checkPatchStatus();
        // SavepathSettingsto local
        await settingsStore.updateSettings(settings);
      } else {
        ElMessage.error('所selectitem录notisvalidWindsurfinstallitem录');
      }
    }
  } catch (error) {
    ElMessage.error(`selectpathfailed: ${error}`);
  }
}

// handleSeamless Switchtoggle
async function handleSeamlessSwitch(value: boolean) {
  if (!windsurfPath.value) {
    ElMessage.error('please firstdetect or SettingsClientpath');
    settings.seamlessSwitchEnabled = !value;
    return;
  }
  
  // ConfirmDialog
  const action = value ? 'enabled' : 'disabled';
  const clientLabel = settings.windsurfClientType === 'windsurf-next' ? 'Windsurf - Next' : 'Windsurf';
  const message = value 
    ? `enabledSeamless Switchwillmodify ${clientLabel}  extension.js file，ifClientcurrentlyrunthenautorestart，whethercontinue？`
    : `disabledSeamless Switchwillalsooriginaloriginalfile，ifClientcurrentlyrunthenautorestart，whethercontinue？`;
  
  try {
    await ElMessageBox.confirm(
      message,
      `${action}Seamless Switch`,
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
  } catch {
    // UserCancel，restoretoggleStatus
    settings.seamlessSwitchEnabled = !value;
    return;
  }
  
  patchLoading.value = true;
  try {
    let result;
    if (value) {
      // Apply patch
      result = await invoke<any>('apply_seamless_patch', {
        windsurfPath: windsurfPath.value
      });
    } else {
      // Restore patch
      result = await invoke<any>('restore_seamless_patch');
    }
    
    if (result.success) {
      ElMessage.success(result.message || `Seamless switch ${action}`);
      if (result.already_patched) {
        ElMessage.info('Patch already applied');
      }
      // UpdateStatus
      await checkPatchStatus();
      // Save Settingsto local
      settings.windsurfPath = windsurfPath.value;
      settings.patchBackupPath = result.backup_file || settings.patchBackupPath;
      // immediatelySaveto localfile
      await settingsStore.updateSettings(settings);
    } else {
      ElMessage.error(result.message || `${action}failed`);
      settings.seamlessSwitchEnabled = !value;
    }
  } catch (error) {
    ElMessage.error(`${action}failed: ${error}`);
    settings.seamlessSwitchEnabled = !value;
  } finally {
    patchLoading.value = false;
  }
}

// uplevelpatch（only in canUpgrade=true display whenbutton）
// this质就isagain跑once apply：backend dry-run sendnow三items pattern andnot yet替换，
// willuse apply branchforRemainingsub-itemdo增量替换；already throughchangewritepass pattern willautoskip，
// becausethisnotwill重complex打CompletedPartial，alsonotwill产生invalidbackup（originalstructurealready notmatchbranch no-op）。
async function handleUpgradePatch() {
  if (!windsurfPath.value) return;
  patchLoading.value = true;
  try {
    const result = await invoke<any>('apply_seamless_patch', {
      windsurfPath: windsurfPath.value
    });
    if (result.success) {
      const mods: string[] = result.modifications || [];
      if (mods.length > 0) {
        ElMessage.success(`Patch upgraded：${mods.join('、')}`);
      } else {
        ElMessage.info(result.message || 'Patch is up to date');
      }
      await checkPatchStatus();
      settings.windsurfPath = windsurfPath.value;
      settings.patchBackupPath = result.backup_file || settings.patchBackupPath;
      await settingsStore.updateSettings(settings);
    } else {
      ElMessage.error(result.message || 'Upgrade failed');
    }
  } catch (error) {
    ElMessage.error(`Upgrade failed: ${error}`);
  } finally {
    patchLoading.value = false;
  }
}

// Reset HTTP Client
async function handleResetHttpClient() {
  resettingHttp.value = true;
  try {
    const result = await systemApi.resetHttpClient();
    if (result.success) {
      ElMessage.success(result.message || 'HTTP client reset');
    } else {
      ElMessage.error('Reset failed');
    }
  } catch (error) {
    ElMessage.error(`Reset failed: ${error}`);
  } finally {
    resettingHttp.value = false;
  }
}

// checkMCP(Rate Limit)Status
async function checkCunzhiStatus() {
  try {
    const status = await invoke<any>('check_cunzhi_status');
    cunzhiStatus.installed = status.installed;
    cunzhiStatus.error = status.error || '';
    
    // synctoggleStatusandactualStatus
    if (status.installed !== settings.cunzhiEnabled) {
      settings.cunzhiEnabled = status.installed;
      await settingsStore.updateSettings(settings);
    }
  } catch (error) {
    cunzhiStatus.installed = false;
    cunzhiStatus.error = error as string;
  }
}

// handleMCPtoggle
async function handleCunzhiSwitch(value: boolean) {
  const action = value ? 'enabled' : 'disabled';
  const message = value 
    ? 'Enabling this feature will install MCP server and global rules. Continue?'
    : 'Disabling this feature will remove MCP configuration and global rules. Continue?';
  
  try {
    await ElMessageBox.confirm(
      message,
      `${action}MCP Feature`,
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );
  } catch {
    // UserCancel，restoretoggleStatus
    settings.cunzhiEnabled = !value;
    return;
  }
  
  cunzhiLoading.value = true;
  try {
    let result;
    if (value) {
      // installMCP
      result = await invoke<any>('install_cunzhi', { windsurfPath: settings.windsurfPath || null });
    } else {
      // Uninstall MCP
      result = await invoke<any>('uninstall_cunzhi', { windsurfPath: settings.windsurfPath || null });
    }
    
    if (result.success) {
      ElMessage.success(result.message || `MCP Featurealready ${action}`);
      // UpdateStatus
      await checkCunzhiStatus();
      // Save Settings
      await settingsStore.updateSettings(settings);
      // Noticerestart
      ElMessage.warning('Please restart Windsurf tousemorechange生效');
    } else {
      ElMessage.error(result.message || `${action}failed`);
      settings.cunzhiEnabled = !value;
    }
  } catch (error) {
    ElMessage.error(`${action}failed: ${error}`);
    settings.cunzhiEnabled = !value;
  } finally {
    cunzhiLoading.value = false;
  }
}

// simple VersionDisabledFeature
void parseSeatCountOptions;
</script>

<style scoped>
/* Dark Modestyle */
:deep(.el-dialog) {
  /* inDark Modeunderbyglobalstyle控制 */
}

/* Dark Mode's描述text */
:root.dark .el-form-item > div[style*="color: #909399"] {
  color: #94a3b8 !important;
}

/* Dark Mode'sTagspageContent */
:root.dark .el-tabs__content {
  background-color: transparent;
}

/* Dark Mode'sformitemTags */
:root.dark .el-form-item__label {
  color: #cfd3dc;
}

/* Dark Mode'salert */
:root.dark .el-alert--warning {
  background-color: rgba(230, 162, 60, 0.1);
  border-color: rgba(230, 162, 60, 0.3);
}

:root.dark .el-alert--warning .el-alert__description {
  color: #cfd3dc;
}

/* ==================== patchStatusblock ==================== */
.patch-status-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.patch-status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.patch-checklist {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 4px;
}

.patch-checklist-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #909399;
}

.patch-checklist-item.is-applied {
  color: #303133;
}

.patch-checklist-icon {
  font-size: 14px;
  color: #C0C4CC;
}

.patch-checklist-icon.is-applied {
  color: #67C23A;
}

/* Dark Modeadapt */
:root.dark .patch-checklist {
  background-color: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.08);
}

:root.dark .patch-checklist-item {
  color: #7a8394;
}

:root.dark .patch-checklist-item.is-applied {
  color: #cfd3dc;
}
</style>
