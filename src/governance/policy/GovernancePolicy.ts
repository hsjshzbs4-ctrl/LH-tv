// src/governance/policy/GovernancePolicy.ts — 唯一治理入口
// PB7-S6: executePipeline() 统一执行 validate→authorize→certify→audit→metrics→report

import { GovernancePipeline } from './GovernancePipeline'
import type { PipelineContext, PipelineReport } from '../contracts'

export class GovernancePolicy {
  private static pipeline = new GovernancePipeline()

  /** 注册 Hook */
  static registerHook(hook: Parameters<GovernancePipeline['registerHook']>[0]): void {
    GovernancePolicy.pipeline.registerHook(hook)
  }

  /** 执行治理管道 */
  static executePipeline(ctx: PipelineContext): PipelineReport {
    return GovernancePolicy.pipeline.executePipeline(ctx)
  }

  /** 批量执行 */
  static batchExecute(contexts: PipelineContext[]): PipelineReport[] {
    return contexts.map((ctx) => GovernancePolicy.executePipeline(ctx))
  }
}
