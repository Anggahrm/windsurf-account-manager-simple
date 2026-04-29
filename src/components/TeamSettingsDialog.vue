<template>
  <el-dialog
    v-model="dialogVisible"
    title="Team Settings (Team Settings)"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
    class="team-settings-dialog"
  >
    <div v-loading="loading" class="settings-container">
      <!-- Windsurf Settings -->
      <div class="settings-section">
        <h3 class="section-title">Windsurf Settings</h3>
        
        <!-- Models -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">model config (Models)</span>
            <span class="setting-desc">configneed toin Windsurf inusemodel</span>
          </div>
          <el-button size="small" @click="openModelsConfig">config</el-button>
        </div>
        
        <!-- Enable Web Search -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">网pageSearch (Web Search)</span>
            <span class="setting-desc">allow Cascade Search网pagefetchrelatedInfo</span>
          </div>
          <el-switch v-model="settings.enableWebSearch" @change="handleSettingChange" />
        </div>
        
        <!-- Auto Run Terminal Commands -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">autoruncommand (Auto Run Commands)</span>
            <span class="setting-desc">allow Cascade inUsermachineonautoexecutecommand</span>
          </div>
          <el-switch v-model="settings.allowAutoRunCommands" @change="handleSettingChange" />
        </div>
        
        <!-- MCP Servers -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">MCP Server</span>
            <span class="setting-desc">allowUseruse and config MCP Server</span>
          </div>
          <el-switch v-model="settings.allowMcpServers" @change="handleSettingChange" />
        </div>
        
        <!-- Whitelisted MCP Servers -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">MCP whitelist</span>
            <span class="setting-desc">notAdd MCP Serverwhen，defaultallServerallinwhitelistin</span>
          </div>
          <el-button size="small" @click="openMcpWhitelist">AddServer</el-button>
        </div>
        
        <!-- App Deploys -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">applydeploy (App Deploys) <el-tag size="small" type="warning">BETA</el-tag></span>
            <span class="setting-desc">ManagementTeamin Cascade indeployPermission</span>
          </div>
          <el-select v-model="settings.appDeploysMode" size="small" style="width: 160px" @change="handleSettingChange">
            <el-option label="完All署Permission" value="full" />
            <el-option label="only internalTeam" value="teams" />
            <el-option label="Disabledeploy" value="disabled" />
          </el-select>
        </div>
        
        <!-- Conversation Sharing -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">dialogshare (Conversation Sharing)</span>
            <span class="setting-desc">allowTeam Membersshare Cascade dialog</span>
          </div>
          <el-switch v-model="settings.allowConversationSharing" @change="handleSettingChange" />
        </div>
        
        <!-- DeepWiki -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">DeepWiki</span>
            <span class="setting-desc">Enable DeepWiki hovercard and codecode符 IDE insidetext章</span>
          </div>
          <el-switch v-model="settings.enableDeepwiki" @change="handleSettingChange" />
        </div>
        
        <!-- Fast Context -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">quickonundertext (Fast Context)</span>
            <span class="setting-desc">EnablequickonundertextFeature</span>
          </div>
          <el-switch v-model="settings.enableFastContext" @change="handleSettingChange" />
        </div>
        
        <!-- Codemaps -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">code map (Codemaps)</span>
            <span class="setting-desc">generate、View and share交互式code map</span>
          </div>
          <el-button size="small" @click="codemapsDialogVisible = true">config</el-button>
        </div>
        
        <!-- Vibe and Replace -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">Vibe and Replace</span>
            <span class="setting-desc">EnableAdvancedcodecodeEdit Vibe and Replace Feature</span>
          </div>
          <el-switch v-model="settings.allowVibeAndReplace" @change="handleSettingChange" />
        </div>
        
        <!-- Github Integration -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">Github integration</span>
            <span class="setting-desc">inTeam GitHub grouporgininstall Windsurf proceed PR review</span>
          </div>
          <el-switch v-model="settings.allowGithubReviews" @change="handleSettingChange" />
        </div>
      </div>
      
      <!-- Other Settings -->
      <div class="settings-section">
        <h3 class="section-title">otherSettings</h3>
        
        <!-- Domain Management -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">DomainManagement (Domain Management)</span>
            <span class="setting-desc">Management and VerifyTeamDomain</span>
          </div>
          <el-button size="small" disabled>config</el-button>
        </div>
        
        <!-- SSO and SAML Configuration -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">SSO  and  SAML config</span>
            <span class="setting-desc">Settings Azure、Google、Okta  or custom SAML singlepointLogin</span>
          </div>
          <el-button size="small" disabled>config</el-button>
        </div>
        
        <!-- Service Key Configuration -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">serviceSecret Keyconfig (Service Key)</span>
            <span class="setting-desc">generateused for SCIM Userconfig and Analysis API serviceSecret Key</span>
          </div>
          <el-button size="small" disabled>config</el-button>
        </div>
        
        <!-- Role Management -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">RoleManagement (Role Management)</span>
            <span class="setting-desc">ManagementUsercanownhasRoleList</span>
          </div>
          <el-button size="small" disabled>config</el-button>
        </div>
        
        <!-- Individual Level Analytics -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">personlevelAnalysis (Individual Analytics)</span>
            <span class="setting-desc">personleveluseAnalysisFeature</span>
          </div>
          <el-switch v-model="settings.allowIndividualAnalytics" @change="handleSettingChange" />
        </div>
        
        <!-- Attribution Toggle -->
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-name">codecodebelong (Attribution) <el-tag size="small" type="warning">BETA</el-tag></span>
            <span class="setting-desc">After enabling Windsurf will阻止write入hasbelongcodecode</span>
          </div>
          <el-switch v-model="settings.allowAttribution" @change="handleSettingChange" />
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">disabled</el-button>
        <el-button type="primary" :loading="saving" @click="saveSettings">
          <el-icon><Check /></el-icon> Save Settings
        </el-button>
      </div>
    </template>
    
    <!-- Models Configuration Dialog -->
    <el-dialog
      v-model="modelsDialogVisible"
      title="model config (Models)"
      width="700px"
      append-to-body
      @open="loadModelsConfig"
    >
      <div class="models-config" v-loading="loadingModels">
        <p class="models-desc">configneed toin Windsurf inusemodel，everyclassotherOptional择multiplemodel</p>
        
        <!-- Cascade Models -->
        <div class="models-section">
          <h4>Cascade model</h4>
          <el-select
            v-model="selectedCascadeModels"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="5"
            placeholder="select Cascade model"
            style="width: 100%"
            popper-class="model-select-dropdown"
          >
            <el-option
              v-for="model in availableCascadeModels"
              :key="model"
              :label="model"
              :value="model"
            >
              <div class="model-option">
                <span class="model-check" :class="{ checked: selectedCascadeModels.includes(model) }">✓</span>
                <span class="model-name">{{ model }}</span>
                <span class="model-multiplier" :class="getMultiplierClass(getModelMultiplier(model, 'cascade'))">
                  {{ formatMultiplier(getModelMultiplier(model, 'cascade')) }}
                </span>
              </div>
            </el-option>
          </el-select>
        </div>
        
        <!-- Command Models -->
        <div class="models-section">
          <h4>Command model</h4>
          <el-select
            v-model="selectedCommandModels"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="5"
            placeholder="select Command model"
            style="width: 100%"
            popper-class="model-select-dropdown"
          >
            <el-option
              v-for="model in availableCommandModels"
              :key="model"
              :label="model"
              :value="model"
            >
              <div class="model-option">
                <span class="model-check" :class="{ checked: selectedCommandModels.includes(model) }">✓</span>
                <span class="model-name">{{ model }}</span>
                <span class="model-multiplier" :class="getMultiplierClass(getModelMultiplier(model, 'command'))">
                  {{ formatMultiplier(getModelMultiplier(model, 'command')) }}
                </span>
              </div>
            </el-option>
          </el-select>
        </div>
        
        <!-- Extension Models -->
        <div class="models-section">
          <h4>Extension model</h4>
          <el-select
            v-model="selectedExtensionModels"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="5"
            placeholder="select Extension model"
            style="width: 100%"
            popper-class="model-select-dropdown"
          >
            <el-option
              v-for="model in availableExtensionModels"
              :key="model"
              :label="model"
              :value="model"
            >
              <div class="model-option">
                <span class="model-check" :class="{ checked: selectedExtensionModels.includes(model) }">✓</span>
                <span class="model-name">{{ model }}</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>
      <template #footer>
        <el-button @click="modelsDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="savingModels" @click="saveModelsConfig">Save</el-button>
      </template>
    </el-dialog>
    
    <!-- MCP Whitelist Dialog -->
    <el-dialog
      v-model="mcpDialogVisible"
      title="Add MCP Server"
      width="500px"
      append-to-body
    >
      <div class="mcp-add-dialog">
        <div class="mcp-header">
          <span class="mcp-label">Server ID</span>
          <el-link type="primary" @click="mcpManualMode = !mcpManualMode">
            {{ mcpManualMode ? 'fromListselect' : 'manuallyinput' }}
          </el-link>
        </div>
        
        <!-- underpullselectMode -->
        <el-select
          v-if="!mcpManualMode"
          v-model="selectedMcpPlugin"
          placeholder="select MCP Server"
          filterable
          style="width: 100%; margin-bottom: 16px"
          :loading="loadingPlugins"
          @visible-change="onMcpSelectOpen"
        >
          <el-option
            v-for="plugin in availableMcpPlugins"
            :key="plugin.id"
            :label="plugin.title"
            :value="plugin.id"
          >
            <div style="display: flex; flex-direction: column;">
              <span style="font-weight: 500;">{{ plugin.title }}</span>
              <span style="font-size: 12px; color: #999;">{{ plugin.id }}</span>
            </div>
          </el-option>
        </el-select>
        
        <!-- manuallyinputMode -->
        <el-input
          v-else
          v-model="newMcpServer"
          placeholder="input MCP Server ID"
          style="margin-bottom: 16px"
        />
        
        <div class="mcp-config-section">
          <span class="mcp-label">Serverconfig (JSON)</span>
          <el-input
            v-model="mcpServerConfig"
            type="textarea"
            :rows="4"
            placeholder="reference MCP ServerdocumentfetchconfigDetails。leave emptywillusedefaultconfig。"
          />
        </div>
        
        <div class="mcp-help-text">
          need帮助？View <el-link type="primary" href="https://docs.windsurf.com/mcp" target="_blank">document</el-link> fetchconfigDetails
        </div>
        
        <!-- AddedServerList -->
        <div class="mcp-added-list" v-if="mcpServers.length">
          <div class="mcp-added-header">AddedServer</div>
          <div class="mcp-list">
            <el-tag
              v-for="(server, index) in mcpServers"
              :key="index"
              closable
              @close="removeMcpServer(index)"
              class="mcp-tag"
            >
              {{ server }}
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="mcpDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="addSelectedMcpServer">Add</el-button>
      </template>
    </el-dialog>
    
    <!-- Codemaps Configuration Dialog -->
    <el-dialog
      v-model="codemapsDialogVisible"
      title="code map (Codemaps)"
      width="500px"
      append-to-body
    >
      <div class="codemaps-config">
        <p class="codemaps-desc">generate、View and share交互式code map</p>
        
        <div class="codemaps-setting">
          <div class="setting-info">
            <span class="setting-name">Enablecode map (Enable Codemaps)</span>
            <span class="setting-desc">allowTeamgenerate and Viewcode map</span>
          </div>
          <el-switch v-model="settings.enableCodemaps" />
        </div>
        
        <div class="codemaps-setting">
          <div class="setting-info">
            <span class="setting-name">code mapshare (Codemap Sharing)</span>
            <span class="setting-desc">allowTeamsharecode map</span>
          </div>
          <el-select v-model="settings.codemapSharing" size="small" style="width: 130px">
            <el-option label="Enable" value="enabled" />
            <el-option label="only Team" value="team" />
            <el-option label="Disable" value="disabled" />
          </el-select>
        </div>
      </div>
      <template #footer>
        <el-button @click="codemapsDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveCodemapsConfig">Save</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  modelValue: boolean;
  accountId: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const dialogVisible = ref(false);
const loading = ref(false);
const saving = ref(false);
const modelsDialogVisible = ref(false);
const mcpDialogVisible = ref(false);
const codemapsDialogVisible = ref(false);
const newMcpServer = ref('');
const mcpServers = ref<string[]>([]);

// MCP Plugin related
const mcpManualMode = ref(false);
const selectedMcpPlugin = ref('');
const loadingPlugins = ref(false);
const mcpServerConfig = ref('');
const availableMcpPlugins = ref<Array<{id: string; title: string; description?: string; trustLevel?: string}>>([]);

// Settings state
const settings = reactive({
  enableWebSearch: false,
  canEditWebSearch: false,
  allowAutoRunCommands: true,
  allowMcpServers: true,
  appDeploysMode: 'disabled',
  allowConversationSharing: false,
  enableDeepwiki: false,
  enableCodemaps: false,
  codemapSharing: 'enabled',
  enableFastContext: false,
  allowVibeAndReplace: false,
  allowGithubReviews: false,
  allowGithubDescriptionEdits: false,
  allowIndividualAnalytics: false,
  allowAttribution: false,
  allowBrowserFeatures: false,
});

// Models configuration
interface ModelInfo {
  name: string;
  multiplier: number; // multiplier: 0=Free, 0.5=0.5x, 1=1x, 2=2x, 3=3x
}

const loadingModels = ref(false);
const savingModels = ref(false);
const teamId = ref('');
const cascadeModelInfos = ref<ModelInfo[]>([]);
const commandModelInfos = ref<ModelInfo[]>([]);
const extensionModelInfos = ref<ModelInfo[]>([]);
const availableCascadeModels = ref<string[]>([]);
const availableCommandModels = ref<string[]>([]);
const availableExtensionModels = ref<string[]>([]);
const selectedCascadeModels = ref<string[]>([]);
const selectedCommandModels = ref<string[]>([]);
const selectedExtensionModels = ref<string[]>([]);

// fetchmodelmultiplier
function getModelMultiplier(modelName: string, type: 'cascade' | 'command' | 'extension'): number {
  let infos: ModelInfo[] = [];
  if (type === 'cascade') infos = cascadeModelInfos.value;
  else if (type === 'command') infos = commandModelInfos.value;
  else infos = extensionModelInfos.value;
  
  const model = infos.find(m => m.name === modelName);
  return model?.multiplier ?? 1;
}

// formatmultiplierdisplay
function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) return '(Free)';
  if (multiplier === 1) return '(1x credits)';
  if (multiplier < 1) return `(${multiplier}x credits)`;
  return `(${multiplier}x credits)`;
}

// fetchmultiplierstyleclass
function getMultiplierClass(multiplier: number): string {
  if (multiplier === 0) return 'free';
  if (multiplier <= 0.5) return 'low';
  if (multiplier <= 1) return 'normal';
  if (multiplier <= 2) return 'high';
  return 'very-high';
}

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val;
  if (val) {
    loadSettings();
  }
});

watch(dialogVisible, (val) => {
  emit('update:modelValue', val);
});

async function loadSettings() {
  loading.value = true;
  try {
    // call GetTeamConfigRecord API fetchCurrentSettings
    console.log('Loading team config for account:', props.accountId);
    const result = await invoke('get_team_config', { id: props.accountId }) as any;
    console.log('Team config result:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      const config = result.data;
      // parsenestTeamconfigdata
      // responseformat: { "subMesssage_1": { "int_5": 1, ... } }  or  { "1": { ... } }
      const teamConfig = config["subMesssage_1"] || config["1"] || config;
      console.log('Parsed teamConfig:', JSON.stringify(teamConfig, null, 2));
      
      // helper functioncount：fetchfieldvalue（support int_X  and  X two种format）
      const getField = (fieldNum: number): any => {
        return teamConfig[`int_${fieldNum}`] ?? teamConfig[`string_${fieldNum}`] ?? teamConfig[`${fieldNum}`] ?? teamConfig[fieldNum];
      };
      
      // helper functioncount：parse protobuf boolean (1=true, 0/undefined=false)
      const parseBool = (fieldNum: number, defaultVal = false): boolean => {
        const val = getField(fieldNum);
        if (val === 1 || val === true || val === "1") return true;
        if (val === 0 || val === false || val === "0") return false;
        return defaultVal;
      };
      
      // TeamConfig proto fieldmapping:
      // field 5: allow_mcp_servers, field 7: allow_auto_run_commands
      // field 10: allow_app_deployments, field 12: allow_github_reviews
      // field 13: allow_github_description_edits, field 17: allow_individual_level_analytics
      // field 18: allow_conversation_sharing, field 19: allow_sandbox_app_deployments
      // field 20: allow_teams_app_deployments, field 22: allow_attribution
      // field 25: allow_browser_experimental_features, field 27: allow_vibe_and_replace
      // field 28: disable_deepwiki, field 31: disable_codemaps, field 33: disable_fast_context
      
      // allowclassfield (allow_xxx): ifsaveinandas1thenas true
      settings.allowAutoRunCommands = parseBool(7, true);
      settings.allowMcpServers = parseBool(5, true);
      settings.allowConversationSharing = parseBool(18, false);
      settings.allowVibeAndReplace = parseBool(27, false);
      settings.allowGithubReviews = parseBool(12, false);
      settings.allowGithubDescriptionEdits = parseBool(13, false);
      settings.allowIndividualAnalytics = parseBool(17, false);
      settings.allowAttribution = parseBool(22, false);
      settings.allowBrowserFeatures = parseBool(25, false);
      
      // Disableclassfield (disable_xxx): if is1thenFeatureDisable，UIdisplayasdisabled
      // iffieldnotsavein，descriptionnohasDisable，FeatureisEnable
      settings.enableDeepwiki = !parseBool(28, false);
      settings.enableCodemaps = !parseBool(31, false);
      settings.enableFastContext = !parseBool(33, false);
      
      // Codemap sharing (field 32, string: "enabled" or "disabled")
      const codemapSharingValue = getField(32);
      settings.codemapSharing = codemapSharingValue || 'enabled';
      
      // App deploys mode
      // field 10: allow_app_deployments, field 19: allow_sandbox_app_deployments, field 20: allow_teams_app_deployments
      const allowAppDeploys = parseBool(10, false);
      const allowSandboxDeploys = parseBool(19, false);
      const allowTeamsDeploys = parseBool(20, false);
      
      if (allowAppDeploys && allowSandboxDeploys && allowTeamsDeploys) {
        settings.appDeploysMode = 'full';  // Full deploy access
      } else if (allowTeamsDeploys) {
        settings.appDeploysMode = 'teams'; // Internal teams only
      } else {
        settings.appDeploysMode = 'disabled'; // Disable deploys
      }
      
      // MCP servers whitelist (field 23)
      const mcpList = teamConfig["subMesssage_23"] || teamConfig["23"];
      if (mcpList && Array.isArray(mcpList)) {
        mcpServers.value = mcpList;
      }
      
      console.log('Parsed settings:', {
        allowAutoRunCommands: settings.allowAutoRunCommands,
        allowMcpServers: settings.allowMcpServers,
        enableDeepwiki: settings.enableDeepwiki,
        enableCodemaps: settings.enableCodemaps,
        enableFastContext: settings.enableFastContext,
        allowVibeAndReplace: settings.allowVibeAndReplace,
        allowConversationSharing: settings.allowConversationSharing,
        allowIndividualAnalytics: settings.allowIndividualAnalytics,
      });
    } else if (result.error) {
      console.warn('Failed to load team config:', result.error);
      // ifisPermission问topic，静默handle
      ElMessage.warning('theAccountpossiblynohasTeam ManagementPermission');
    }
  } catch (error: any) {
    console.error('Failed to load team settings:', error);
    const errorMsg = error?.message || error?.toString() || 'Unknown error';
    ElMessage.warning(`Load failed: ${errorMsg}`);
  } finally {
    loading.value = false;
  }
}

function handleSettingChange() {
  // cantoin这inAddi.e.whenSave逻辑
}

async function saveSettings() {
  saving.value = true;
  try {
    const updateData = {
      allow_auto_run_commands: settings.allowAutoRunCommands,
      allow_mcp_servers: settings.allowMcpServers,
      allow_conversation_sharing: settings.allowConversationSharing,
      disable_deepwiki: !settings.enableDeepwiki,
      disable_codemaps: !settings.enableCodemaps,
      disable_fast_context: !settings.enableFastContext,
      allow_vibe_and_replace: settings.allowVibeAndReplace,
      allow_github_reviews: settings.allowGithubReviews,
      allow_github_description_edits: settings.allowGithubDescriptionEdits,
      allow_individual_level_analytics: settings.allowIndividualAnalytics,
      allow_attribution: settings.allowAttribution,
      allow_browser_experimental_features: settings.allowBrowserFeatures,
      // App deploys: full = all three, teams = only teams, disabled = none
      allow_app_deployments: settings.appDeploysMode === 'full',
      allow_sandbox_app_deployments: settings.appDeploysMode === 'full',
      allow_teams_app_deployments: settings.appDeploysMode === 'full' || settings.appDeploysMode === 'teams',
      allowed_mcp_servers: mcpServers.value.join(','),
      // Codemaps
      allow_codemap_sharing: settings.codemapSharing,
    };
    
    const result = await invoke('update_team_config', { id: props.accountId, config: updateData }) as any;
    if (result.success) {
      ElMessage.success('Team Settingsalready Save');
    } else {
      ElMessage.error(result.error || 'Savefailed');
    }
  } catch (error) {
    console.error('Failed to save team settings:', error);
    ElMessage.error('SaveTeam Settingsfailed');
  } finally {
    saving.value = false;
  }
}

function openModelsConfig() {
  modelsDialogVisible.value = true;
}

async function loadModelsConfig() {
  loadingModels.value = true;
  try {
    // fetchcanusemodelList
    const modelConfigResult = await invoke('get_cascade_model_configs', { id: props.accountId }) as any;
    console.log('Model configs:', modelConfigResult);
    
    if (modelConfigResult.success && modelConfigResult.data) {
      const data = modelConfigResult.data;
      console.log('Model data keys:', Object.keys(data));
      console.log('Model data full:', JSON.stringify(data, null, 2).substring(0, 2000));
      console.log('subMesssage_2 (sorts):', JSON.stringify(data.subMesssage_2, null, 2));
      console.log('subMesssage_3 (default):', JSON.stringify(data.subMesssage_3, null, 2));
      
      // responseformat: CascadeModelConfigData
      // - subMesssage_1 = client_model_configs (repeated ClientModelConfig)
      // - every ClientModelConfig  string_1 = label (Model Name)
      let modelConfigs: any[] = [];
      
      // trymultiple种possiblyfieldname and nesthierarchy
      const field1 = data.subMesssage_1 || data.subMessage_1 || data.repeated_1 || data["1"];
      console.log('Field1 type:', typeof field1, 'isArray:', Array.isArray(field1));
      
      if (Array.isArray(field1)) {
        modelConfigs = field1;
      } else if (field1 && typeof field1 === 'object') {
        // check ifhasnest repeated field
        const nested = field1.repeated_1 || field1.subMesssage_1 || field1["1"];
        if (Array.isArray(nested)) {
          modelConfigs = nested;
        } else if (field1.string_1) {
          // ifissingleforobject，checkitwhetherhas string_1 field
          modelConfigs = [field1];
        }
      }
      
      console.log('Model configs count:', modelConfigs.length);
      
      // 提getModel Name and multiplier - fromeveryelement string_1  and  float_3 fieldfetch
      // ClientModelConfig: label=1(string), multiplier=3(float), disabled=4(bool)
      const allModels: string[] = [];
      const enabledModels: string[] = [];
      const modelInfos: ModelInfo[] = [];
      
      if (Array.isArray(modelConfigs)) {
        modelConfigs.forEach((config: any, idx: number) => {
          const modelName = config.string_1 || config.label || config["1"];
          // multiplier field (field 3): multiplier，nohasthefieldrepresentFreemodel
          const rawMultiplier = config.float_3 ?? config.multiplier ?? config["3"];
          const multiplier = rawMultiplier !== undefined ? rawMultiplier : 0; // no float_3 = Free
          // disabled field (field 4): true=notselected, false=Selected
          const isDisabled = config.bool_4 === true || config.disabled === true || config["4"] === true;
          
          console.log(`Config ${idx}:`, modelName, 'multiplier:', multiplier, 'disabled:', isDisabled);
          if (modelName && typeof modelName === 'string') {
            allModels.push(modelName);
            modelInfos.push({ name: modelName, multiplier: typeof multiplier === 'number' ? multiplier : 1 });
            if (!isDisabled) {
              enabledModels.push(modelName);
            }
          }
        });
      }
      
      console.log('All cascade models:', allModels.length, 'Enabled:', enabledModels.length);
      
      // canusemodel = allmodel，already selectmodel = disabled=false model
      cascadeModelInfos.value = modelInfos;
      availableCascadeModels.value = allModels.sort();
      selectedCascadeModels.value = enabledModels;
      console.log('Selected cascade models:', enabledModels);
      
      availableExtensionModels.value = [
        'Base Model ⚡️',
        'GPT-4o',
        'o1-preview',
        'o1-mini',
        'Codeium Premier 🔥',
        'Claude 3.7 Sonnet',
        'Claude 3.5 Sonnet',
      ];
    }
    
    // fetch Command model config
    const commandConfigResult = await invoke('get_command_model_configs', { id: props.accountId }) as any;
    console.log('Command configs:', commandConfigResult);
    
    if (commandConfigResult.success && commandConfigResult.data) {
      const cmdData = commandConfigResult.data;
      const cmdField1 = cmdData.subMesssage_1 || cmdData.subMessage_1 || cmdData.repeated_1 || cmdData["1"];
      
      if (Array.isArray(cmdField1)) {
        // from Command API fetchmodelList and Settingsasalready select
        const commandModels: string[] = [];
        const cmdModelInfos: ModelInfo[] = [];
        cmdField1.forEach((config: any) => {
          const modelName = config.string_1 || config.label || config["1"];
          // multiplier field (field 3): multiplier，nohasthefieldrepresentFreemodel
          const rawMultiplier = config.float_3 ?? config.multiplier ?? config["3"];
          const multiplier = rawMultiplier !== undefined ? rawMultiplier : 0; // no float_3 = Free
          if (modelName) {
            commandModels.push(modelName);
            cmdModelInfos.push({ name: modelName, multiplier: typeof multiplier === 'number' ? multiplier : 1 });
          }
        });
        
        console.log('Command models from API:', commandModels);
        commandModelInfos.value = cmdModelInfos;
        availableCommandModels.value = commandModels;
        selectedCommandModels.value = commandModels; // Command API Back就isalready selectmodel
      }
    }
    
    // fetchCurrentTeammodel config
    const controlsResult = await invoke('get_team_organizational_controls', { id: props.accountId }) as any;
    console.log('Team controls:', controlsResult);
    console.log('Team controls data keys:', controlsResult.data ? Object.keys(controlsResult.data) : 'no data');
    
    if (controlsResult.success && controlsResult.data) {
      const data = controlsResult.data;
      console.log('Full data:', JSON.stringify(data, null, 2));
      
      // responseformat: { subMessage_1: { string_1: team_id, repeated_2: [...], repeated_3: [...], repeated_6: [...] } }
      const controls = data.subMessage_1 || data.subMesssage_1 || data["1"] || data;
      console.log('Controls keys:', Object.keys(controls));
      console.log('Controls:', controls);
      
      // parse team_id，possiblycontains protobuf prefixneedcleanup
      let rawTeamId = controls.string_1 || controls["1"] || '';
      // removepossibly protobuf nestmessageprefix (e.g. "\n$")
      if (typeof rawTeamId === 'string' && rawTeamId.includes('$')) {
        rawTeamId = rawTeamId.substring(rawTeamId.indexOf('$') + 1);
      }
      teamId.value = rawTeamId;
      
      // parsealready selectmodel - Rust parser use string_X format
      const parseRepeatedString = (field: any): string[] => {
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') return [field];
        return [];
      };
      
      // string_2 = Cascade, string_3 = Command, string_6 = Extension
      // only whenwhen API Backalready selectmodelonly thencover，nothenkeepfrom Recommended Listfetchdefault value
      const cascadeFromApi = parseRepeatedString(controls.string_2 || controls.repeated_2 || controls["2"]);
      const commandFromApi = parseRepeatedString(controls.string_3 || controls.repeated_3 || controls["3"]);
      const extensionFromApi = parseRepeatedString(controls.string_6 || controls.repeated_6 || controls["6"]);
      
      if (cascadeFromApi.length > 0) {
        selectedCascadeModels.value = cascadeFromApi;
      }
      if (commandFromApi.length > 0) {
        selectedCommandModels.value = commandFromApi;
      }
      if (extensionFromApi.length > 0) {
        selectedExtensionModels.value = extensionFromApi;
      }
      
      // samewhenfromalready selectmodelinUpdatecanuseList（ifhasnewmodel）
      selectedCascadeModels.value.forEach(m => {
        if (!availableCascadeModels.value.includes(m)) {
          availableCascadeModels.value.push(m);
        }
      });
      selectedCommandModels.value.forEach(m => {
        if (!availableCommandModels.value.includes(m)) {
          availableCommandModels.value.push(m);
        }
      });
      selectedExtensionModels.value.forEach(m => {
        if (!availableExtensionModels.value.includes(m)) {
          availableExtensionModels.value.push(m);
        }
      });
      
      console.log('Parsed models:', {
        teamId: teamId.value,
        cascade: selectedCascadeModels.value,
        command: selectedCommandModels.value,
        extension: selectedExtensionModels.value,
      });
    }
  } catch (error) {
    console.error('Failed to load models config:', error);
    ElMessage.error('Loadingmodel configfailed');
  } finally {
    loadingModels.value = false;
  }
}

async function saveModelsConfig() {
  if (!teamId.value) {
    ElMessage.warning('theAccountnotisTeamAccount，nowaySavemodel config');
    return;
  }
  
  savingModels.value = true;
  try {
    const result = await invoke('upsert_team_organizational_controls', {
      id: props.accountId,
      teamId: teamId.value,
      cascadeModels: selectedCascadeModels.value,
      commandModels: selectedCommandModels.value,
      extensionModels: selectedExtensionModels.value,
    }) as any;
    
    if (result.success) {
      ElMessage.success('model configalready Save');
      modelsDialogVisible.value = false;
    } else {
      ElMessage.error(result.error || 'Savefailed');
    }
  } catch (error) {
    console.error('Failed to save models config:', error);
    ElMessage.error('Savemodel configfailed');
  } finally {
    savingModels.value = false;
  }
}

function saveCodemapsConfig() {
  // Codemaps SettingswillinprimarySavewhenonestartSave
  codemapsDialogVisible.value = false;
  ElMessage.success('Codemaps configalready Update');
}

function openMcpWhitelist() {
  mcpDialogVisible.value = true;
  // ResetStatus
  selectedMcpPlugin.value = '';
  newMcpServer.value = '';
  mcpServerConfig.value = '';
  mcpManualMode.value = false;
}

async function onMcpSelectOpen(visible: boolean) {
  if (visible && availableMcpPlugins.value.length === 0) {
    await loadMcpPlugins();
  }
}

async function loadMcpPlugins() {
  loadingPlugins.value = true;
  try {
    const result = await invoke('get_available_mcp_plugins', { id: props.accountId }) as any;
    if (result.success && result.data?.plugins) {
      availableMcpPlugins.value = result.data.plugins.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        trustLevel: p.trustLevel
      }));
      // bytitlesort
      availableMcpPlugins.value.sort((a, b) => a.title.localeCompare(b.title));
    }
  } catch (error) {
    console.error('Failed to load MCP plugins:', error);
  } finally {
    loadingPlugins.value = false;
  }
}

function addSelectedMcpServer() {
  const serverId = mcpManualMode.value ? newMcpServer.value.trim() : selectedMcpPlugin.value;
  if (serverId && !mcpServers.value.includes(serverId)) {
    mcpServers.value.push(serverId);
    // Resetinput
    selectedMcpPlugin.value = '';
    newMcpServer.value = '';
    mcpServerConfig.value = '';
    ElMessage.success(`Added ${serverId}`);
  } else if (mcpServers.value.includes(serverId)) {
    ElMessage.warning('theServeralready inwhitelistin');
  } else {
    ElMessage.warning('Please select or inputServer ID');
  }
}

function removeMcpServer(index: number) {
  mcpServers.value.splice(index, 1);
}
</script>

<style lang="scss" scoped>
.team-settings-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 24px;
    max-height: 70vh;
    overflow-y: auto;
  }
}

.settings-container {
  min-height: 300px;
}

.settings-section {
  margin-bottom: 24px;
  
  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #e4e7ed;
  }
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  .setting-info {
    flex: 1;
    margin-right: 16px;
    
    .setting-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
      
      .el-tag {
        margin-left: 8px;
        vertical-align: middle;
      }
    }
    
    .setting-desc {
      display: block;
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.models-config {
  .models-desc {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
  }
  
  .models-section {
    margin-bottom: 20px;
    
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
    }
  }
}

// underpulloptionstyle (globalstyle)
:global(.model-select-dropdown) {
  .el-select-dropdown__item {
    padding: 8px 12px;
    height: auto;
  }
}

.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  
  .model-check {
    width: 16px;
    color: transparent;
    font-weight: bold;
    
    &.checked {
      color: #10b981;
    }
  }
  
  .model-name {
    flex: 1;
  }
  
  .model-multiplier {
    font-size: 12px;
    margin-left: auto;
    padding: 2px 6px;
    border-radius: 4px;
    
    &.free {
      color: #10b981;
    }
    
    &.low {
      color: #3b82f6;
    }
    
    &.normal {
      color: #6b7280;
    }
    
    &.high {
      color: #f59e0b;
    }
    
    &.very-high {
      color: #ef4444;
    }
  }
}

.codemaps-config {
  .codemaps-desc {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
  }
  
  .codemaps-setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .setting-info {
      flex: 1;
      
      .setting-name {
        display: block;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
      }
      
      .setting-desc {
        font-size: 12px;
        color: #999;
      }
    }
  }
}

.mcp-whitelist {
  .mcp-list {
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .mcp-tag {
    font-size: 13px;
  }
}

.mcp-add-dialog {
  .mcp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .mcp-label {
    font-weight: 500;
    color: #333;
    display: block;
    margin-bottom: 8px;
  }
  
  .mcp-config-section {
    margin-bottom: 16px;
  }
  
  .mcp-help-text {
    font-size: 12px;
    color: #666;
    margin-bottom: 16px;
  }
  
  .mcp-added-list {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    
    .mcp-added-header {
      font-weight: 500;
      color: #333;
      margin-bottom: 12px;
    }
    
    .mcp-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .mcp-tag {
      font-size: 13px;
    }
  }
}
</style>
