// src/diagnostics/index.ts — PB1 Diagnostics barrel export
export {
  DiagnosticsExporter,
  BasicSystemInfoProvider,
  type ISystemInfoProvider,
  type SystemInfo,
  type AppMetadata,
  type DiagnosticSnapshot
} from './diagnosticsExporter'
export {
  BugReportBuilder,
  type BugReport,
  type BugReportPackage
} from './bugReportBuilder'
