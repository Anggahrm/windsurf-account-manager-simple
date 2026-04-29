/**
 * daily Cascade codecoderowcountStatistics (Field 18: cascade_lines)
 */
export interface DailyCascadeLinesCount {
  /** DateTimetimestamp */
  timestamp: number;
  /** Datestring (YYYY-MM-DD) */
  date: string;
  /** Accepted Lines of Code (Accepted lines) */
  accepted_lines: number;
  /** suggested codecoderowcount (Suggested lines) */
  suggested_lines: number;
}

/**
 * tooluseStatisticsitemsitem
 */
export interface ToolUsageEntry {
  /** toolName */
  tool_name: string;
  /** usage count */
  count: number;
  /** useproportion（percentage） */
  percentage: number;
}

/**
 * modeluseStatisticsitemsitem
 */
export interface ModelUsageEntry {
  /** DateTimetimestamp */
  timestamp: number;
  /** Datestring */
  date: string;
  /** Model Name */
  model_name: string;
  /** runMode */
  mode: string;
  /** Sessions/Messages */
  session_count: number;
  /** TokenUsage */
  token_usage: number;
  /** sessionID */
  session_id: string;
}

/**
 * modelusesummaryTotal
 */
export interface ModelUsageSummary {
  /** Model Name */
  model_name: string;
  /** Totalusage count */
  total_count: number;
  /** TotalTokenConsumed */
  total_tokens: number;
  /** useproportion */
  percentage: number;
}

/**
 * Overall Statistics摘need to
 */
export interface AnalyticsSummary {
  /** Totalcodecoderowcount（accept） */
  total_accepted_lines: number;
  /** Totalcodecoderowcount（build议） */
  total_suggested_lines: number;
  /** 平alldailycodecoderowcount（accept） */
  avg_daily_accepted_lines: number;
  /** 峰valueDate */
  peak_date: string;
  /** 峰valuecodecoderowcount */
  peak_lines: number;
  /** Totaltoolusage count */
  total_tool_usage: number;
  /** TotalSessions */
  total_sessions: number;
  /** TotalTokenConsumed */
  total_tokens: number;
  /** primaryneed tousemodel */
  primary_model: string;
  /** primaryneed tousetool */
  primary_tool: string;
}

// ============== add newtype定义 ==============

/**
 * codecodecontributepercentageStatistics
 */
export interface PercentCodeWritten {
  /** AI 编writecodecodeproportion (%) */
  percent_code_written: number;
  /** viaautoautocompletegenerate bytescount */
  codeium_bytes_by_autocomplete: number;
  /** viacommandgenerate bytescount */
  codeium_bytes_by_command: number;
  /** User编writebytecount */
  user_bytes: number;
  /** AI Totaltotalgenerate bytescount */
  codeium_bytes: number;
  /** Totalbytecount */
  total_bytes: number;
  /** via Supercomplete generate bytescount */
  codeium_bytes_by_supercomplete: number;
  /** via Cascade generate bytescount */
  codeium_bytes_by_cascade: number;
}

/**
 * codecodeautocompleteStatistics
 */
export interface CompletionStatistics {
  /** acceptcount */
  num_acceptances: number;
  /** rejectcount */
  num_rejections: number;
  /** Accepted Lines of Code */
  num_lines_accepted: number;
  /** acceptbytecount */
  num_bytes_accepted: number;
  /** Usercount */
  num_users: number;
  /** Activedevelopdayscount */
  active_developer_days: number;
  /** Activedevelophourscount */
  active_developer_hours: number;
  /** Acceptance Rate (calculatefield) */
  acceptance_rate: number;
}

/**
 * byDateautocompleteStatistics
 */
export interface CompletionByDay {
  /** DateTimetimestamp */
  timestamp: number;
  /** Datestring */
  date: string;
  /** autocompleteStatistics */
  statistics: CompletionStatistics;
}

/**
 * bylanguageautocompleteStatistics
 */
export interface CompletionByLanguage {
  /** languageID */
  language_id: number;
  /** languageName */
  language_name: string;
  /** autocompleteStatistics */
  statistics: CompletionStatistics;
}

/**
 * Chat Statistics
 */
export interface ChatStats {
  /** sendchatdayscount */
  chats_sent: number;
  /** receivechatdayscount */
  chats_received: number;
  /** acceptchatdayscount */
  chats_accepted: number;
  /** in光标处插入count */
  chats_inserted_at_cursor: number;
  /** applycount */
  chats_applied: number;
  /** usecodecoderowcount */
  chat_loc_used: number;
  /** usecodecodeblockcount */
  chat_code_blocks_used: number;
  /** functioncountsolvereleasecount */
  function_explain_count: number;
  /** documentstringgeneratecount */
  function_docstring_count: number;
  /** functioncount重构count */
  function_refactor_count: number;
  /** codecodeblocksolvereleasecount */
  code_block_explain_count: number;
  /** codecodeblock重构count */
  code_block_refactor_count: number;
  /** 问topicsolvereleasecount */
  problem_explain_count: number;
  /** singleelementtestgeneratecount */
  function_unit_tests_count: number;
  /** Activedevelopdayscount */
  active_developer_days: number;
}

/**
 * byDate Chat Statistics
 */
export interface ChatStatsByDay {
  /** DateTimetimestamp */
  timestamp: number;
  /** Datestring */
  date: string;
  /** Chat Statistics */
  stats: ChatStats;
}

/**
 * bymodel Chat Statistics
 */
export interface ChatStatsByModel {
  /** modelID */
  model_id: number;
  /** Model Name */
  model_name: string;
  /** Chat Statistics */
  stats: ChatStats;
}

/**
 * customqueryresponseitem
 */
export interface CustomQueryResponseItem {
  /** 键valuefordata */
  data: Record<string, string>;
}

/**
 * customqueryresponse
 */
export interface CustomQueryResponse {
  /** responseitemList */
  items: CustomQueryResponseItem[];
}

// ============== primarydatastructure ==============

/**
 * useAnalysisresponsedata
 */
export interface AnalyticsData {
  /** daily Cascade codecoderowcountStatistics (Field 18: cascade_lines) */
  daily_cascade_lines: DailyCascadeLinesCount[];
  /** tooluseStatistics (Field 19: cascade_tool_usage) */
  tool_usage: ToolUsageEntry[];
  /** modeluseDetails (Field 20: cascade_runs) */
  model_usage_details: ModelUsageEntry[];
  /** modelusesummaryTotal */
  model_usage_summary: ModelUsageSummary[];
  /** Overall Statistics */
  summary: AnalyticsSummary;
  
  // ===== add newfield =====
  /** codecodecontributepercentage */
  percent_code_written: PercentCodeWritten;
  /** autocompleteStatistics */
  completion_stats: CompletionStatistics;
  /** byDateautocompleteStatistics */
  completions_by_day: CompletionByDay[];
  /** bylanguageautocompleteStatistics */
  completions_by_language: CompletionByLanguage[];
  /** Chat Statistics */
  chat_stats: ChatStats;
  /** byDate Chat Statistics */
  chats_by_day: ChatStatsByDay[];
  /** bymodel Chat Statistics */
  chats_by_model: ChatStatsByModel[];
  /** customqueryresult */
  custom_query_results: CustomQueryResponse;
}

