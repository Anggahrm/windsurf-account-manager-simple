<template>
  <el-dialog
    v-model="dialogVisible"
    title="Team Management"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    class="team-management-dialog"
  >
    <div v-loading="loading" class="team-container">
      <!-- Tagspage -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- Team MembersList -->
        <el-tab-pane label="Team Members" name="members">
          <!-- invite linkarea -->
          <div v-if="teamInviteId" class="invite-link-section">
            <div class="invite-link-label">
              <el-icon><Link /></el-icon>
              <span>Team InvitationID:</span>
            </div>
            <div class="invite-link-content">
              <el-input
                v-model="teamInviteId"
                readonly
                size="small"
                class="invite-id-input"
              />
              <el-button type="primary" size="small" @click="copyInviteId">
                <el-icon><CopyDocument /></el-icon>
                Copy
              </el-button>
              <el-button size="small" @click="copyInviteUrl">
                <el-icon><Link /></el-icon>
                Copylink
              </el-button>
            </div>
          </div>
          
          <div class="tab-header">
            <el-button type="primary" size="small" @click="showInviteDialog = true">
              <el-icon><Plus /></el-icon>
              Invite Members
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              :loading="batchResettingCredits"
              :disabled="otherMembers.length === 0"
              @click="batchResetMemberCredits"
            >
              <el-icon><RefreshRight /></el-icon>
              Batch ResetCredits
            </el-button>
            <el-button size="small" @click="loadTeamMembers">
              <el-icon><Refresh /></el-icon>
              Refresh
            </el-button>
            <el-button type="danger" size="small" @click="showTransferDialog = true">
              <el-icon><Switch /></el-icon>
              transferSubscription
            </el-button>
          </div>
          
          <el-table :data="members" style="width: 100%" max-height="400" class="member-table">
            <el-table-column label="Name & Email" min-width="220">
              <template #default="{ row }">
                <div class="member-cell">
                  <div class="member-cell-name">
                    {{ row.name }}
                    <el-tag v-if="row.role === 'Admin'" type="warning" size="small" class="role-tag">Admin</el-tag>
                  </div>
                  <div class="member-cell-email">{{ row.email }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="lastuse" width="120" align="center">
              <template #default="{ row }">
                <span class="time-text">{{ formatLastUsed(row.last_update_time) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Used Credits" width="100" align="center">
              <template #default="{ row }">
                <span>{{ Math.floor((row.prompts_used || 0) / 100) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="Access Disabled" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.disable_codeium ? 'danger' : 'success'" size="small">
                  {{ row.disable_codeium ? 'is' : 'no' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Operation" width="180" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="info" size="small" text @click="openMemberDetail(row)">
                  Edit
                </el-button>
                <template v-if="row.role !== 'Admin'">
                  <el-popconfirm
                    title="Confirmneed toremovetheMember?？"
                    confirm-button-text="Confirm"
                    cancel-button-text="Cancel"
                    @confirm="removeMember(row)"
                  >
                    <template #reference>
                      <el-button type="danger" size="small" text>
                        remove
                      </el-button>
                    </template>
                  </el-popconfirm>
                  <el-button type="primary" size="small" text :loading="row.rejoining" @click="rejoinMember(row)">
                    Reset Credits
                  </el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="members.length === 0 && !loading" class="empty-state">
            <el-empty description="NoneTeam Members" />
          </div>
        </el-tab-pane>
        
        <!-- pending invitations -->
        <el-tab-pane label="pending invitations" name="invitations">
          <div class="tab-header">
            <el-button size="small" @click="loadPendingInvitations">
              <el-icon><Refresh /></el-icon>
              Refresh
            </el-button>
          </div>
          
          <el-table :data="pendingInvitations" style="width: 100%" max-height="400">
            <el-table-column prop="name" label="Name" width="150" />
            <el-table-column prop="email" label="Email" min-width="200" />
            <el-table-column prop="created_at" label="inviteTime" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="Operation" width="100" fixed="right">
              <template #default="{ row }">
                <el-popconfirm
                  title="Confirmneed torevoketheinvite?？"
                  confirm-button-text="Confirm"
                  cancel-button-text="Cancel"
                  @confirm="revokeInvitation(row)"
                >
                  <template #reference>
                    <el-button type="warning" size="small" text>
                      revoke
                    </el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="pendingInvitations.length === 0 && !loading" class="empty-state">
            <el-empty description="Nonepending invitations" />
          </div>
        </el-tab-pane>
        
        <!-- Iinvite（normalUser） -->
        <el-tab-pane label="Iinvite" name="my-invitation">
          <div class="my-invitation-section">
            <div v-if="myInvitation" class="invitation-card">
              <div class="invitation-info">
                <h3>you收toTeam Invitation</h3>
                <p><strong>Team Name:</strong> {{ myInvitation.team_name || 'UnknownTeam' }}</p>
                <p><strong>inviteperson:</strong> {{ myInvitation.admin_name || 'Management' }}</p>
              </div>
              <div class="invitation-actions">
                <el-button type="primary" @click="acceptInvitation">
                  accept invitation
                </el-button>
                <el-button type="danger" @click="rejectInvitation">
                  rejectinvite
                </el-button>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-empty description="Nonewaithandleinvite" />
              <el-button size="small" @click="loadMyInvitation">
                <el-icon><Refresh /></el-icon>
                checkinvite
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- apply to joinTeam -->
        <el-tab-pane label="apply to join" name="join-team">
          <div class="join-team-section">
            <el-alert
              title="viainvite linkjoinTeam"
              type="info"
              description="inputTeam ManagementshareinviteID，apply to joinTeam。applySubmitafterneedwaitManagementapprove。"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            />
            <el-form :model="joinForm" label-width="100px">
              <el-form-item label="invite linkID">
                <el-input
                  v-model="joinForm.inviteId"
                  placeholder="inputinviteID（UUIDformat）"
                  clearable
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :loading="joining" @click="submitJoinRequest">
                  Submitapply
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- Pending Approvalapply（Management） -->
        <el-tab-pane label="Pending Approval" name="pending-requests">
          <div class="tab-header">
            <el-button size="small" @click="loadTeamMembers">
              <el-icon><Refresh /></el-icon>
              Refresh
            </el-button>
          </div>
          
          <el-table :data="pendingMembers" style="width: 100%" max-height="400">
            <el-table-column prop="name" label="Name" width="150" />
            <el-table-column prop="email" label="Email" min-width="200" />
            <el-table-column prop="status" label="Status" width="100">
              <template #default>
                <el-tag type="warning" size="small">Pending Approval</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Operation" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="success" size="small" text @click="approveJoinRequest(row, 'approve')">
                  agree
                </el-button>
                <el-button type="danger" size="small" text @click="approveJoinRequest(row, 'reject')">
                  reject
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div v-if="pendingMembers.length === 0 && !loading" class="empty-state">
            <el-empty description="NonePending Approvaljoinapply" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- Invite MembersDialog -->
    <el-dialog
      v-model="showInviteDialog"
      title="Invite Members"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="inviteForm" label-width="60px">
        <div v-for="(user, index) in inviteForm.users" :key="index" class="invite-user-row">
          <div class="invite-user-fields">
            <el-form-item label="Name">
              <el-input v-model="user.name" placeholder="Member Name" />
            </el-form-item>
            <el-form-item label="Email">
              <el-input v-model="user.email" placeholder="MemberEmail" />
            </el-form-item>
          </div>
          <el-button
            v-if="inviteForm.users.length > 1 && index > 0"
            type="danger"
            :icon="Delete"
            circle
            size="small"
            class="delete-btn"
            @click="removeInviteUser(index)"
          />
        </div>
        <el-button class="add-more-btn" @click="addInviteUser">
          <el-icon><Plus /></el-icon>
          Addmoremultiple
        </el-button>
        
        <!-- autojointoggle -->
        <div class="auto-join-section">
          <el-switch v-model="autoJoinEnabled" />
          <span class="auto-join-label">autojoin</span>
          <el-tooltip content="inviteafter，ifMemberEmailinAccount Managementmanagerin，willauto accept invitationjoinTeam" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showInviteDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="inviting" @click="submitInvite">
          {{ autoJoinEnabled ? 'invite and autojoin' : 'sendinvite' }}
        </el-button>
      </template>
    </el-dialog>
    
    <!-- transferSubscriptionDialog -->
    <el-dialog
      v-model="showTransferDialog"
      title="transferSubscription"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-alert
        title="transferSubscriptiondescription"
        type="warning"
        description="transferafter，youwillwasmoveoutTeam，Subscriptionwill转movegivetargetUser。This action cannot be undone！"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />
      <el-form :model="transferForm" label-width="100px" autocomplete="off">
        <el-form-item label="Target Email" required>
          <el-input
            v-model="transferForm.email"
            placeholder="inputreceiveSubscriptionUserEmail"
            clearable
            name="transfer-target-email-no-autofill"
            autocomplete="off"
            data-form-type="other"
          />
        </el-form-item>
        <el-form-item label="UserName">
          <el-input
            v-model="transferForm.name"
            placeholder="Optional，UserName"
            clearable
            name="transfer-target-name-no-autofill"
            autocomplete="off"
            data-form-type="other"
          />
        </el-form-item>
      </el-form>
      
      <!-- transferprogressdisplay -->
      <div v-if="transferring" class="transfer-progress">
        <el-steps :active="transferStep" finish-status="success" simple>
          <el-step title="Access Disabled" />
          <el-step title="inviteUser" />
          <el-step title="grantManagement" />
          <el-step title="removeself" />
        </el-steps>
        <div class="transfer-status">{{ transferStatus }}</div>
      </div>
      
      <template #footer>
        <el-button @click="showTransferDialog = false" :disabled="transferring">Cancel</el-button>
        <el-button type="danger" :loading="transferring" @click="executeTransfer">
          Confirm Transfer
        </el-button>
      </template>
    </el-dialog>

    <!-- Member DetailsDialog -->
    <el-dialog
      v-model="showMemberDetail"
      :title="selectedMember?.name || 'Member Details'"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
      class="member-detail-dialog"
    >
      <div v-if="selectedMember" class="member-detail-content">
        <!-- UserBasic Infocard -->
        <div class="info-card">
          <div class="info-header">
            <el-avatar :size="48" class="member-avatar">
              {{ selectedMember.name?.charAt(0)?.toUpperCase() || '?' }}
            </el-avatar>
            <div class="member-info">
              <div class="member-name">{{ selectedMember.name }}</div>
              <div class="member-email">{{ selectedMember.email }}</div>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <el-form label-width="120px" class="detail-form">
          <el-form-item label="API Key">
            <el-input 
              :value="selectedMember.api_key" 
              readonly 
              size="small"
              class="api-key-input"
            >
              <template #append>
                <el-tooltip content="Copy" placement="top">
                  <el-button :icon="CopyDocument" @click="copyApiKey" />
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="Registration Time">
            <span class="info-value">{{ formatSignUpTime(selectedMember.sign_up_time) }}</span>
          </el-form-item>
          
          <el-form-item label="Role">
            <el-select v-model="memberDetailForm.role" style="width: 200px" size="default">
              <el-option label="normalUser" value="User" />
              <el-option label="Management" value="Admin" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="Access Disabled">
            <el-switch 
              v-model="memberDetailForm.disableAccess"
              active-text="Disabled"
              inactive-text=""
              style="--el-switch-on-color: #f56c6c"
            />
            <div class="form-tip">DisableaftertheMemberwillnowayuse Windsurf，andnotoccupyuseSeat</div>
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button type="danger" plain @click="handleRemoveMember" :loading="memberDetailLoading">
            Remove Member
          </el-button>
          <el-button type="primary" @click="saveMemberDetail" :loading="memberDetailLoading">
            Savemodify
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Delete, Link, CopyDocument, QuestionFilled, RefreshRight, Switch } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  accountId: string
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const activeTab = ref('members')

// Team InvitationID
const teamInviteId = ref('')

// Team Membersdata
interface TeamMember {
  api_key: string
  name: string
  email: string
  role?: string
  sign_up_time?: number
  last_update_time?: number
  prompts_used?: number
  disable_codeium?: boolean
}
const members = ref<TeamMember[]>([])

// Member DetailsDialog
const showMemberDetail = ref(false)
const selectedMember = ref<TeamMember | null>(null)
const memberDetailLoading = ref(false)
const memberDetailForm = ref({
  role: 'User',
  disableAccess: false
})

// pending invitations
interface PendingInvitation {
  id: string
  name: string
  email: string
  created_at?: number
}
const pendingInvitations = ref<PendingInvitation[]>([])

// Iinvite
interface MyInvitation {
  approval_id: string
  team_name?: string
  admin_name?: string
}
const myInvitation = ref<MyInvitation | null>(null)

// inviteform
const showInviteDialog = ref(false)
const inviting = ref(false)
const inviteForm = ref({
  users: [{ name: '', email: '' }]
})
const autoJoinEnabled = ref(true)  // autojointoggle，defaultenabled

// apply to joinTeam
const joining = ref(false)
const joinForm = ref({
  inviteId: ''
})

// Pending ApprovalMember（team_status = PENDING）
const pendingMembers = ref<TeamMember[]>([])

// Batch ResetCreditsStatus
const batchResettingCredits = ref(false)

// transferSubscriptionrelated
const showTransferDialog = ref(false)
const transferring = ref(false)
const transferStep = ref(0)
const transferStatus = ref('')
const transferForm = ref({
  email: '',
  name: ''
})

// CurrentAccount Email（used forexclude self）
const currentAccountEmail = ref('')

// calculateotherMemberList（exclude self）
const otherMembers = computed(() => {
  return members.value.filter(m => m.email?.toLowerCase() !== currentAccountEmail.value?.toLowerCase())
})

// LoadingTeam Members
async function loadTeamMembers() {
  if (!props.accountId) return
  
  loading.value = true
  try {
    const result = await invoke<any>('get_team_members', {
      id: props.accountId,
      groupId: null
    })

    if (result.success) {
      const data = result.data || {}
      
      // subMesssage_1 is User[] countgroup（possiblyissingleforobject）
      let users = data.subMesssage_1 || []
      // ifissingleforobject，convert tocountgroup
      if (users && !Array.isArray(users)) {
        users = [users]
      }
      // subMesssage_2 is UserRole[] countgroup（possiblyissingleforobject）
      let userRoles = data.subMesssage_2 || []
      if (userRoles && !Array.isArray(userRoles)) {
        userRoles = [userRoles]
      }
      // subMesssage_4 is UserCascadeDetails，possiblyiscountgroup or singleforobject
      const cascadeDetails = data.subMesssage_4 || []
      
      // buildMemberList
      const approvedList: TeamMember[] = []
      const pendingList: TeamMember[] = []
      
      // iterateUsercountgroup
      if (Array.isArray(users) && users.length > 0) {
        for (const user of users) {
          const apiKey = user.string_1 || ''
          const firebaseId = user.string_6 || ''
          const name = user.string_2 || ''
          const email = user.string_3 || ''
          const teamStatus = user.int_8 || 0
          // signup_time: field 4 is Timestamp，its seconds in subMesssage_4.int_1
          const signUpTime = user.subMesssage_4?.int_1 || 0
          // last_update_time: field 26 is Timestamp
          const lastUpdateTime = user.subMesssage_26?.int_1 || 0
          // disable_codeium: field 16，bool type，parseas int_16
          const disableCodeium = user.int_16 === 1
          
          // findRole
          let role = 'User'
          if (Array.isArray(userRoles)) {
            const roleInfo = userRoles.find((r: any) => r.string_1 === apiKey)
            if (roleInfo) {
              role = roleInfo.string_4 || roleInfo.string_2 || 'User'
            }
          }
          
          // findUsage（via firebase_id associate）
          let promptsUsed = 0
          if (Array.isArray(cascadeDetails)) {
            // ifiscountgroup
            const usageInfo = cascadeDetails.find((c: any) => c.string_1 === firebaseId)
            if (usageInfo) {
              promptsUsed = usageInfo.int_2 || 0
            }
          } else if (cascadeDetails && typeof cascadeDetails === 'object') {
            // ifissingleforobject
            if (cascadeDetails.string_1 === firebaseId) {
              promptsUsed = cascadeDetails.int_2 || 0
            }
          }
          
          const member: TeamMember = { 
            api_key: apiKey, 
            name, 
            email, 
            role,
            sign_up_time: signUpTime,
            last_update_time: lastUpdateTime,
            prompts_used: promptsUsed,
            disable_codeium: disableCodeium
          }
          
          // based on team_status category：1=PENDING, 2=APPROVED
          if (teamStatus === 1) {
            pendingList.push(member)
          } else {
            approvedList.push(member)
          }
        }
      }
      
      // sort：Managementrowinmostbeforeside
      approvedList.sort((a, b) => {
        const aRole = typeof a.role === 'string' ? a.role.toLowerCase() : ''
        const bRole = typeof b.role === 'string' ? b.role.toLowerCase() : ''
        const aIsAdmin = aRole === 'admin' ? 0 : 1
        const bIsAdmin = bRole === 'admin' ? 0 : 1
        return aIsAdmin - bIsAdmin
      })
      
      members.value = approvedList
      pendingMembers.value = pendingList
    } else {
      ElMessage.error(result.error || 'fetchTeam Membersfailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// Remove Member
async function removeMember(member: TeamMember) {
  loading.value = true
  try {
    const result = await invoke<any>('remove_team_member', {
      id: props.accountId,
      memberApiKey: member.api_key
    })
    
    if (result.success) {
      ElMessage.success('MemberRemoved')
      loadTeamMembers()
    } else {
      ElMessage.error(result.error || 'Remove Memberfailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// ==================== Member Detailsrelated ====================

// openMember DetailsDialog
function openMemberDetail(member: TeamMember) {
  selectedMember.value = member
  // Rolemapping：ensurevalueand el-option  value match
  let role = typeof member.role === 'string' ? member.role : 'User'
  if (role.toLowerCase() === 'admin') role = 'Admin'
  else role = 'User'
  
  memberDetailForm.value = {
    role: role,
    disableAccess: member.disable_codeium || false
  }
  showMemberDetail.value = true
}

// CopyAPI Key
function copyApiKey() {
  if (!selectedMember.value) return
  navigator.clipboard.writeText(selectedMember.value.api_key)
    .then(() => ElMessage.success('Copied API Key'))
    .catch(() => ElMessage.error('Copy failed'))
}

// formatRegistration Time
function formatSignUpTime(timestamp?: number): string {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}

// formatlastuseTime（mutualforTime）
function formatLastUsed(timestamp?: number): string {
  if (!timestamp) return 'Unused'
  
  const now = Date.now()
  const time = timestamp * 1000
  const diff = now - time
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}minutes ago`
  if (hours < 24) return `${hours}hours ago`
  if (days < 30) return `${days}days ago`
  
  return new Date(time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// ==================== update_codeium_access Errormapping ====================

/**
 * backend Connect Protocol Errorcode → intext友好Notice。
 *
 * these code 来自 `update_codeium_access` command 400 response `parsed_error.code`，
 * by `windsurf_service.rs::update_codeium_access` in 400 branchparsebut来。
 *
 * 典typescenario：
 * - `failed_precondition`: Devin Plan门槛（only  Teams-v2 support Windsurf accessManagement）
 * - `permission_denied`:   CurrentAccountnon-Team Management
 * - `unauthenticated`:     primaryauth token invalid
 */
const UPDATE_ACCESS_ERROR_MESSAGES: Record<string, string> = {
  failed_precondition: 'Current Devin Plannotsupport Windsurf accessManagement，needuplevelto Teams-v2 Planafteruse',
  permission_denied: 'Permissionnotenough：only Team ManagementcanOperationaccessPermission',
  unauthenticated: 'authinvalid，pleaseRefreshAccountLoginStatusafterretry',
  invalid_argument: 'pleaserequire参countinvalid，Member API Key possiblyInvalid',
  not_found: 'targetMembernotfind，possiblyalready wasremove',
}

/** frombackendfailedBack体in提getoneitems友好intextErrormessage，fallbacktoserveroriginaltext or throughusetext */
function extractUpdateAccessErrorMessage(result: any): string {
  const code = result?.parsed_error?.code as string | undefined
  const serverMsg = result?.parsed_error?.message as string | undefined
  const friendly = code ? UPDATE_ACCESS_ERROR_MESSAGES[code] : undefined
  return friendly || serverMsg || result?.error || 'UpdateaccessPermissionfailed'
}

/**
 * call `update_codeium_access` command；ifbackend `success === false` then抛outwith
 * 友好message Error，便于on层 try/catch unifyuse `ElMessage.error` render。
 */
async function invokeUpdateCodeiumAccess(
  accountId: string,
  memberApiKey: string,
  disableAccess: boolean,
): Promise<any> {
  const result = await invoke<any>('update_codeium_access', {
    id: accountId,
    memberApiKey,
    disableAccess,
  })
  if (result && result.success === false) {
    throw new Error(extractUpdateAccessErrorMessage(result))
  }
  return result
}

// SaveMember Details（Role and accessPermission）
async function saveMemberDetail() {
  if (!selectedMember.value) return
  
  memberDetailLoading.value = true
  try {
    // StandardRolevalueproceedcompare
    let originalRole = typeof selectedMember.value.role === 'string' ? selectedMember.value.role : 'User'
    if (originalRole.toLowerCase() === 'admin') originalRole = 'Admin'
    else originalRole = 'User'
    
    const newRole = memberDetailForm.value.role
    const originalDisabled = selectedMember.value.disable_codeium || false
    const newDisabled = memberDetailForm.value.disableAccess
    
    // UpdateRole（ifhaschange）
    if (originalRole !== newRole) {
      // firstremoveoldRole（use root.xxx format）
      if (originalRole !== 'User') {
        const oldRoleApi = originalRole === 'Admin' ? 'root.admin' : `root.${originalRole.toLowerCase()}`
        await invoke<any>('remove_user_role', {
          id: props.accountId,
          memberApiKey: selectedMember.value.api_key,
          role: oldRoleApi
        })
      }
      // AddnewRole（use root.xxx format）
      if (newRole !== 'User') {
        const newRoleApi = newRole === 'Admin' ? 'root.admin' : `root.${newRole.toLowerCase()}`
        await invoke<any>('add_user_role', {
          id: props.accountId,
          memberApiKey: selectedMember.value.api_key,
          role: newRoleApi
        })
      }
    }
    
    // UpdateaccessPermission（ifhaschange）
    if (originalDisabled !== newDisabled) {
      await invokeUpdateCodeiumAccess(
        props.accountId,
        selectedMember.value.api_key,
        newDisabled,
      )
    }
    
    ElMessage.success('Savesuccessful')
    showMemberDetail.value = false
    loadTeamMembers()
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    memberDetailLoading.value = false
  }
}

// fromDetailsDialogRemove Member
async function handleRemoveMember() {
  if (!selectedMember.value) return
  
  try {
    await ElMessageBox.confirm('Confirmneed toremovetheMember?？', 'Confirm', {
      confirmButtonText: 'Confirm',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    
    memberDetailLoading.value = true
    const result = await invoke<any>('remove_team_member', {
      id: props.accountId,
      memberApiKey: selectedMember.value.api_key
    })
    
    if (result.success) {
      ElMessage.success('MemberRemoved')
      showMemberDetail.value = false
      loadTeamMembers()
    } else {
      ElMessage.error(result.error || 'Remove Memberfailed')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.toString())
    }
  } finally {
    memberDetailLoading.value = false
  }
}

// re-joinMember（remove → invite → autoaccept）
async function rejoinMember(member: TeamMember) {
  loading.value = true
  try {
    // Step 1: Remove Member
    const removeResult = await invoke<any>('remove_team_member', {
      id: props.accountId,
      memberApiKey: member.api_key
    })
    
    if (!removeResult.success) {
      ElMessage.error(removeResult.error || 'Remove Memberfailed')
      return
    }
    
    // Step 2: Re-invite
    const inviteResult = await invoke<any>('invite_team_members', {
      id: props.accountId,
      users: [{ name: member.name, email: member.email }]
    })
    
    if (!inviteResult.success) {
      ElMessage.error(inviteResult.error || 'Re-invitefailed')
      loadTeamMembers()
      return
    }
    
    // Step 3: auto accept invitation（ifEmailinManagementmanagerin）
    const autoJoinResults = await autoAcceptInvitations([member.email])
    const joined = autoJoinResults.some(r => r.success)
    
    if (joined) {
      ElMessage.success(`${member.name} CreditsResetsuccessful`)
    } else {
      ElMessage.success(`already Re-invite ${member.name}，waitaccept invitation`)
    }
    
    loadTeamMembers()
    loadPendingInvitations()
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// Batch ResetTeam MembersCredits（exclude self）
async function batchResetMemberCredits() {
  const membersToReset = otherMembers.value
  
  if (membersToReset.length === 0) {
    ElMessage.warning('no availableResetMember')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `Confirmneed toReset ${membersToReset.length} MemberCredits?？thisOperationwillremove and Re-invitetheseMember。`,
      'Batch ResetCredits',
      {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  batchResettingCredits.value = true
  let successCount = 0
  let failCount = 0
  
  try {
    for (const member of membersToReset) {
      try {
        // Step 1: Remove Member
        const removeResult = await invoke<any>('remove_team_member', {
          id: props.accountId,
          memberApiKey: member.api_key
        })
        
        if (!removeResult.success) {
          console.error(`Remove Member ${member.name} failed:`, removeResult.error)
          failCount++
          continue
        }
        
        // Step 2: Re-invite
        const inviteResult = await invoke<any>('invite_team_members', {
          id: props.accountId,
          users: [{ name: member.name, email: member.email }]
        })
        
        if (!inviteResult.success) {
          console.error(`Invite Members ${member.name} failed:`, inviteResult.error)
          failCount++
          continue
        }
        
        // Step 3: auto accept invitation
        const autoJoinResults = await autoAcceptInvitations([member.email])
        const joined = autoJoinResults.some(r => r.success)
        
        if (joined) {
          successCount++
        } else {
          // invitealready sendbutnotcanautojoin（possiblyEmailnotinManagementmanagerin）
          successCount++
        }
      } catch (error) {
        console.error(`handleMember ${member.name} error when:`, error)
        failCount++
      }
    }
    
    // Show Results
    if (failCount === 0) {
      ElMessage.success(`successfulReset ${successCount} MemberCredits`)
    } else {
      ElMessage.warning(`ResetDone：successful ${successCount} ，failed ${failCount} `)
    }
    
    // RefreshList
    loadTeamMembers()
    loadPendingInvitations()
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    batchResettingCredits.value = false
  }
}

// Loadingpending invitations
async function loadPendingInvitations() {
  if (!props.accountId) return
  
  loading.value = true
  try {
    const result = await invoke<any>('get_pending_invitations', {
      id: props.accountId
    })
    
    if (result.success) {
      const data = result.data || {}
      console.log('[PendingInvitations] Full data:', JSON.stringify(data, null, 2))
      const preapprovals = data.subMesssage_1 || []
      console.log('[PendingInvitations] preapprovals:', preapprovals)
      
      if (Array.isArray(preapprovals)) {
        pendingInvitations.value = preapprovals.map((p: any) => ({
          id: p.string_1 || '',
          name: p.string_2 || '',
          email: p.string_3 || '',
          created_at: p.subMesssage_6?.int_1
        }))
      } else if (preapprovals && typeof preapprovals === 'object') {
        // possiblyissingleforobjectbutnotiscountgroup
        pendingInvitations.value = [{
          id: preapprovals.string_1 || '',
          name: preapprovals.string_2 || '',
          email: preapprovals.string_3 || '',
          created_at: preapprovals.subMesssage_6?.int_1
        }]
      } else {
        pendingInvitations.value = []
      }
      console.log('[PendingInvitations] Parsed:', pendingInvitations.value)
    } else {
      ElMessage.error(result.error || 'fetchpending invitationsfailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// revokeinvite
async function revokeInvitation(invitation: PendingInvitation) {
  loading.value = true
  try {
    const result = await invoke<any>('revoke_invitation', {
      id: props.accountId,
      approvalId: invitation.id
    })
    
    if (result.success) {
      ElMessage.success('invitealready revoke')
      loadPendingInvitations()
    } else {
      ElMessage.error(result.error || 'revokeinvitefailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// LoadingIinvite
async function loadMyInvitation() {
  if (!props.accountId) return
  
  loading.value = true
  try {
    const result = await invoke<any>('get_my_pending_invitation', {
      id: props.accountId
    })
    
    if (result.success && result.has_pending_invitation) {
      const data = result.data || {}
      myInvitation.value = {
        approval_id: data.subMesssage_1?.string_1 || '',
        team_name: data.string_3 || '',
        admin_name: data.string_2 || ''
      }
    } else {
      myInvitation.value = null
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// accept invitation
async function acceptInvitation() {
  if (!myInvitation.value) return
  
  loading.value = true
  try {
    const result = await invoke<any>('accept_invitation', {
      id: props.accountId,
      approvalId: myInvitation.value.approval_id
    })
    
    if (result.success) {
      ElMessage.success('already successfuljoinTeam')
      myInvitation.value = null
    } else {
      ElMessage.error(result.error || 'accept invitationfailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// rejectinvite
async function rejectInvitation() {
  if (!myInvitation.value) return
  
  try {
    await ElMessageBox.confirm('Confirmneed torejecttheinvite?？', 'Confirm', {
      type: 'warning'
    })
    
    loading.value = true
    const result = await invoke<any>('reject_invitation', {
      id: props.accountId,
      approvalId: myInvitation.value.approval_id
    })
    
    if (result.success) {
      ElMessage.success('Rejectedinvite')
      myInvitation.value = null
    } else {
      ElMessage.error(result.error || 'rejectinvitefailed')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.toString())
    }
  } finally {
    loading.value = false
  }
}

// inviteformOperation
function addInviteUser() {
  inviteForm.value.users.push({ name: '', email: '' })
}

function removeInviteUser(index: number) {
  inviteForm.value.users.splice(index, 1)
}

async function submitInvite() {
  const validUsers = inviteForm.value.users.filter(u => u.name && u.email)
  
  if (validUsers.length === 0) {
    ElMessage.warning('pleaseat leastfill inonevalidMemberInfo')
    return
  }
  
  inviting.value = true
  try {
    const result = await invoke<any>('invite_team_members', {
      id: props.accountId,
      users: validUsers
    })
    
    if (result.success) {
      const invitedCount = result.invited_count || validUsers.length
      
      // ifenabledautojoin，tryletManagementmanagerinAccountauto accept invitation
      if (autoJoinEnabled.value) {
        const autoJoinResults = await autoAcceptInvitations(validUsers.map(u => u.email))
        const joinedCount = autoJoinResults.filter(r => r.success).length
        
        if (joinedCount > 0) {
          ElMessage.success(`successfulinvite ${invitedCount} Member，${joinedCount} already autojoin`)
        } else {
          ElMessage.success(`successfulinvite ${invitedCount} Member`)
        }
      } else {
        ElMessage.success(`successfulinvite ${invitedCount} Member`)
      }
      
      showInviteDialog.value = false
      inviteForm.value.users = [{ name: '', email: '' }]
      loadPendingInvitations()
      loadTeamMembers()
    } else {
      ElMessage.error(result.error || 'invitefailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    inviting.value = false
  }
}

// auto accept invitation（batchhandle）
async function autoAcceptInvitations(emails: string[]): Promise<{ email: string; success: boolean }[]> {
  const results: { email: string; success: boolean }[] = []
  
  try {
    // fetchallAccount
    const accounts = await invoke<any[]>('get_all_accounts')
    
    for (const email of emails) {
      // findEmailmatchAccount（ignoresizewrite）
      const matchedAccount = accounts.find((acc: any) => 
        acc.email?.toLowerCase() === email.toLowerCase()
      )
      
      if (matchedAccount) {
        console.log(`[AutoJoin] Found account for ${email}, attempting to accept invitation...`)
        
        try {
          // usetheAccountaccept invitation
          const acceptResult = await invoke<any>('accept_invitation', {
            id: matchedAccount.id,
            approvalId: '' // emptystringrepresentacceptmostnewinvite
          })
          
          results.push({ email, success: acceptResult.success === true })
          
          if (acceptResult.success) {
            console.log(`[AutoJoin] ${email} successfully joined the team`)
          }
        } catch (e) {
          console.error(`[AutoJoin] Failed to accept invitation for ${email}:`, e)
          results.push({ email, success: false })
        }
      } else {
        console.log(`[AutoJoin] No account found for ${email}`)
        results.push({ email, success: false })
      }
    }
  } catch (error) {
    console.error('[AutoJoin] Failed to get accounts:', error)
  }
  
  return results
}

// formatTime
function formatTime(timestamp?: number): string {
  if (!timestamp) return '-'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN')
}

// apply to joinTeam
async function submitJoinRequest() {
  if (!joinForm.value.inviteId.trim()) {
    ElMessage.warning('Please enterinvite linkID')
    return
  }
  
  joining.value = true
  try {
    const result = await invoke<any>('request_team_access', {
      id: props.accountId,
      inviteId: joinForm.value.inviteId.trim()
    })
    
    if (result.success) {
      ElMessage.success(result.message || 'applyalready Submit，waitManagementapprove')
      joinForm.value.inviteId = ''
    } else {
      ElMessage.error(result.error || 'applyfailed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    joining.value = false
  }
}

// approvejoinapply（Management）
async function approveJoinRequest(member: TeamMember, action: 'approve' | 'reject') {
  loading.value = true
  try {
    const result = await invoke<any>('approve_team_join_request', {
      id: props.accountId,
      userApiKey: member.api_key,
      action: action
    })
    
    if (result.success) {
      ElMessage.success(result.message || (action === 'approve' ? 'already agreejoin' : 'Rejectedjoin'))
      loadTeamMembers()
    } else {
      ElMessage.error(result.error || 'Operation failed')
    }
  } catch (error: any) {
    ElMessage.error(error.toString())
  } finally {
    loading.value = false
  }
}

// executeSubscriptiontransfer
async function executeTransfer() {
  if (!transferForm.value.email.trim()) {
    ElMessage.warning('Please entertargetUserEmail')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `Confirmneed towillSubscriptiontransfergive ${transferForm.value.email} ?？\n\ntransferafteryouwillwasmoveoutTeam，This action cannot be undone！`,
      'Confirm Transfer',
      {
        confirmButtonText: 'Confirm Transfer',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
  } catch {
    return
  }
  
  transferring.value = true
  transferStep.value = 0
  
  try {
    const targetEmail = transferForm.value.email.trim()
    const targetName = transferForm.value.name.trim() || targetEmail.split('@')[0]
    
    // Step 1: DisableselfaccessPermission
    transferStatus.value = 'currentlyDisableselfaccessPermission...'
    transferStep.value = 0
    
    // findCurrentAccountMemberInfo and Access Disabled
    const currentMember = members.value.find(m => m.email?.toLowerCase() === currentAccountEmail.value?.toLowerCase())
    if (currentMember && !currentMember.disable_codeium) {
      await invokeUpdateCodeiumAccess(
        props.accountId,
        currentMember.api_key,
        true,
      )
    }
    
    // findtargetUserwhetheralready inTeamin
    const existingMember = members.value.find(m => m.email?.toLowerCase() === targetEmail.toLowerCase())
    
    // Step 2: inviteUserjoinTeam
    transferStatus.value = 'currentlyinviteUser...'
    transferStep.value = 1
    
    let memberApiKey = existingMember?.api_key
    
    if (!existingMember) {
      // UsernotinTeamin，sendinvite
      const inviteResult = await invoke<any>('invite_team_members', {
        id: props.accountId,
        users: [{ name: targetName, email: targetEmail }]
      })
      
      if (!inviteResult.success) {
        throw new Error(inviteResult.error || 'inviteUserfailed')
      }
      
      // tryauto accept invitation（ifEmailinAccount Managementmanagerin）
      const autoJoinResults = await autoAcceptInvitations([targetEmail])
      const joined = autoJoinResults.some(r => r.success)
      
      if (!joined) {
        // Usernotcanautojoin，needwaitmanuallyaccept
        ElMessage.warning('invitealready send，butUserneedmanuallyaccept invitationafter才canDonetransfer。pleaseinUseracceptafterretry。')
        showTransferDialog.value = false
        transferring.value = false
        loadPendingInvitations()
        return
      }
      
      // re-LoadingMemberListfetchnewMember API Key
      await loadTeamMembers()
      const newMember = members.value.find(m => m.email?.toLowerCase() === targetEmail.toLowerCase())
      if (!newMember) {
        throw new Error('nowayfindnewjoinMember')
      }
      memberApiKey = newMember.api_key
    }
    
    // Step 3: assign予UserManagementPermission
    transferStatus.value = 'currentlygrantManagementPermission...'
    transferStep.value = 2
    
    await invoke<any>('add_user_role', {
      id: props.accountId,
      memberApiKey: memberApiKey,
      role: 'root.admin'
    })
    
    // Step 4: putselfremoveTeam
    transferStatus.value = 'currentlyremoveself...'
    transferStep.value = 3
    
    // use Step 1 infindCurrentAccountMemberInfo
    if (currentMember) {
      await invoke<any>('remove_team_member', {
        id: props.accountId,
        memberApiKey: currentMember.api_key
      })
    }
    
    transferStep.value = 4
    transferStatus.value = 'transferDone！'
    
    ElMessage.success(`Subscriptionalready successfultransfergive ${targetEmail}`)
    
    // Resetform and disabledDialog
    showTransferDialog.value = false
    transferForm.value = { email: '', name: '' }
    dialogVisible.value = false
    
  } catch (error: any) {
    ElMessage.error(`Transfer failed: ${error.message || error}`)
  } finally {
    transferring.value = false
    transferStep.value = 0
    transferStatus.value = ''
  }
}

// LoadingTeamInfo（fetchinviteID）
async function loadTeamInfo() {
  if (!props.accountId) return
  
  try {
    const result = await invoke<any>('get_current_user_parsed', {
      id: props.accountId
    })
    
    console.log('[TeamManagement] get_current_user_parsed result:', result)
    
    // datastructure：result.data.team.invite_id, result.data.user.email
    if (result.success) {
      if (result.data?.team?.invite_id) {
        teamInviteId.value = result.data.team.invite_id
        console.log('[TeamManagement] Team invite ID:', teamInviteId.value)
      }
      if (result.data?.user?.email) {
        currentAccountEmail.value = result.data.user.email
        console.log('[TeamManagement] Current account email:', currentAccountEmail.value)
      }
    }
  } catch (error: any) {
    console.error('Failed to load team info:', error)
  }
}

// CopyinviteID
async function copyInviteId() {
  if (!teamInviteId.value) return
  
  try {
    await navigator.clipboard.writeText(teamInviteId.value)
    ElMessage.success('inviteIDCopied to clipboard')
  } catch (error) {
    // prepareusemethod
    const textarea = document.createElement('textarea')
    textarea.value = teamInviteId.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('inviteIDCopied to clipboard')
  }
}

// Copycompleteinvite link
async function copyInviteUrl() {
  if (!teamInviteId.value) return
  
  const inviteUrl = `https://windsurf.com/team/join/${teamInviteId.value}`
  
  try {
    await navigator.clipboard.writeText(inviteUrl)
    ElMessage.success('invite linkCopied to clipboard')
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = inviteUrl
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    ElMessage.success('invite linkCopied to clipboard')
  }
}

// listenDialogopen
watch(dialogVisible, (val) => {
  if (val) {
    loadTeamInfo()
    loadTeamMembers()
    loadPendingInvitations()
    loadMyInvitation()
  }
})
</script>

<style scoped>
/* globalcontainer */
  .team-management-dialog :deep(.el-dialog__body) {
    padding: 0;
    background-color: #f8fafc;
  }

  .team-container {
    min-height: 550px;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  /* Tagspagebeautiful */
  :deep(.el-tabs--border-card) {
    border: none;
    box-shadow: none;
    background: transparent;
  }

  :deep(.el-tabs--border-card > .el-tabs__header) {
    background-color: #fff;
    border-bottom: 1px solid #f1f5f9;
    padding: 16px 32px 0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  :deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item) {
    border: none;
    margin-right: 32px;
    padding: 12px 4px;
    height: auto;
    font-size: 15px;
    font-weight: 500;
    color: #64748b;
    transition: all 0.2s ease;
  }

  :deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item:hover) {
    color: #3b82f6;
  }

  :deep(.el-tabs--border-card > .el-tabs__header .el-tabs__item.is-active) {
    color: #3b82f6;
    font-weight: 600;
    border-bottom: 3px solid #3b82f6;
    background: transparent;
  }

  :deep(.el-tabs--border-card > .el-tabs__content) {
    padding: 24px 32px;
  }

  /* invite linkcard - viewfeel焦point */
  .invite-link-section {
    background: linear-gradient(120deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    color: white;
    box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3);
    position: relative;
    overflow: hidden;
  }

  .invite-link-section::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(30%, -30%);
  }

  .invite-link-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 12px;
  }

  .invite-link-label .el-icon {
    color: white;
  }

  .invite-link-content {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 6px 6px 6px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
  }

  .invite-id-input {
    flex: 1;
  }

  .invite-id-input :deep(.el-input__wrapper) {
    box-shadow: none !important;
    background: transparent;
    padding: 0;
  }

  .invite-id-input :deep(.el-input__inner) {
    font-family: 'JetBrains Mono', 'Monaco', monospace;
    font-size: 15px;
    color: white;
    letter-spacing: 0.5px;
  }

  .invite-link-content .el-button {
    background: white;
    border: none;
    color: #4f46e5;
    font-weight: 600;
    height: 32px;
    padding: 0 16px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .invite-link-content .el-button:hover {
    background: #f0fdf4;
    transform: translateY(-1px);
  }

  /* Operation栏 */
  .tab-header {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 20px;
  }

  .tab-header .el-button {
    border-radius: 8px;
    padding: 9px 16px;
    height: auto;
  }

  /* tablestyleoptimal */
  .member-table {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #f1f5f9;
    background: white;
  }

  :deep(.el-table th.el-table__cell) {
    background-color: #f8fafc;
    color: #475569;
    font-weight: 600;
    font-size: 13px;
    height: 54px;
    border-bottom: 1px solid #e2e8f0;
  }

  :deep(.el-table td.el-table__cell) {
    padding: 16px 0;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
    background-color: #f8fafc;
  }

  .member-cell-name {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .member-cell-email {
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;
  }

  .role-tag {
    font-size: 11px;
    padding: 2px 8px;
    height: 22px;
    line-height: 18px;
    border-radius: 6px;
    font-weight: 600;
    border: none;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: white;
  }

  .time-text {
    font-size: 13px;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 8px;
    border-radius: 6px;
  }

  /* Statusbadge */
  :deep(.el-tag--success) {
    background-color: #dcfce7;
    border-color: transparent;
    color: #166534;
  }

  :deep(.el-tag--danger) {
    background-color: #fee2e2;
    border-color: transparent;
    color: #991b1b;
  }

  /* Button Style */
  .el-button--text {
    font-weight: 500;
  }

  .el-button--info.is-text {
    color: #64748b;
  }
  .el-button--info.is-text:hover {
    color: #3b82f6;
    background: #eff6ff;
  }

  .el-button--danger.is-text {
    color: #ef4444;
  }
  .el-button--danger.is-text:hover {
    background: #fef2f2;
  }

  /* emptyStatus */
  .empty-state {
    padding: 64px 0;
    text-align: center;
    background: white;
    border-radius: 16px;
    border: 1px solid #f1f5f9;
  }

  /* Member Detailscard */
  .info-card {
    background: white;
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .member-avatar {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    font-size: 20px;
    border: 4px solid #eff6ff;
  }

  .member-name {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
  }

  /* Detailsform */
  .detail-form .el-form-item {
    margin-bottom: 24px;
  }

  .detail-form :deep(.el-form-item__label) {
    color: #64748b;
    font-weight: 500;
  }

  /* invitecardoptimal */
  .invitation-card {
    background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
    color: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 480px;
    margin: 20px auto;
    position: relative;
    overflow: hidden;
  }

  .invitation-card::after {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 150px;
    height: 150px;
    background: rgba(255,255,255,0.1);
    border-radius: 50%;
  }

  .invitation-actions .el-button {
    border: none;
    height: 40px;
    font-size: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  /* Invite MembersDialog */
  .invite-user-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    margin-bottom: 12px;
    border: 1px solid #e2e8f0;
  }

  .invite-user-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .invite-user-fields .el-form-item {
    margin-bottom: 0;
  }

  .invite-user-row .delete-btn {
    margin-top: 8px;
    flex-shrink: 0;
  }

  .add-more-btn {
    width: 100%;
    height: 44px;
    border: 2px dashed #cbd5e1;
    background: transparent;
    color: #64748b;
    font-weight: 500;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .add-more-btn:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }

  .auto-join-section {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding: 16px;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    border-radius: 10px;
    border: 1px solid #a7f3d0;
  }

  .auto-join-label {
    font-size: 14px;
    color: #065f46;
    font-weight: 600;
  }

  .help-icon {
    color: #10b981;
    cursor: help;
  }

  /* DetailsDialogbottom */
  .dialog-footer {
    display: flex;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }

  .form-tip {
    font-size: 12px;
    color: #64748b;
    margin-top: 8px;
    line-height: 1.5;
  }

  .info-value {
    color: #1e293b;
    font-size: 14px;
    font-weight: 500;
  }

  .member-email {
    font-size: 14px;
    color: #64748b;
  }

  .member-info {
    flex: 1;
  }

  .info-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* transferprogressstyle */
  .transfer-progress {
    margin-top: 20px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
  }

  .transfer-status {
    margin-top: 12px;
    text-align: center;
    color: #64748b;
    font-size: 14px;
  }
</style>
