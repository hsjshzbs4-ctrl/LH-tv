// src/governance/policy/GovernancePipeline.ts — 统一治理管道
// PB7-S6: 固定顺序, 不可变, 支持 Hook 扩展但禁止重排

import { GovernanceRegistry } from '../registry'
import type { PipelineContext, PipelineResult, PipelineReport, MetricsSnapshot } from '../contracts'

/** Pipeline Hook */
export interface PipelineHook {
  beforeValidate?(ctx: PipelineContext): void
  afterValidate?(ctx: PipelineContext, result: PipelineResult): void
  beforeAuthorize?(ctx: PipelineContext): void
  afterAuthorize?(ctx: PipelineContext, result: PipelineResult): void
  beforeCertify?(ctx: PipelineContext): void
  afterCertify?(ctx: PipelineContext, result: PipelineResult): void
  beforeAudit?(ctx: PipelineContext): void
  afterAudit?(ctx: PipelineContext, result: PipelineResult): void
  beforeMetrics?(ctx: PipelineContext): void
  afterMetrics?(ctx: PipelineContext, result: PipelineResult): void
  beforeReport?(ctx: PipelineContext): void
  afterReport?(ctx: PipelineContext, result: PipelineResult): void
  afterPipeline?(ctx: PipelineContext, results: PipelineResult[]): void
}

export class GovernancePipeline {
  private hooks: PipelineHook[] = []

  /** 注册 Hook (只能添加, 不能修改管道顺序) */
  registerHook(hook: PipelineHook): void {
    this.hooks.push(hook)
  }

  /** 执行管道 — 固定顺序, 不可变 */
  executePipeline(ctx: PipelineContext): PipelineReport {
    const registry = GovernanceRegistry.getInstance()
    const results: PipelineResult[] = []

    // 阶段定义 — 固定顺序 (禁止运行时修改)
    const stages: Array<{ name: string; run: () => PipelineResult }> = [
      {
        name: 'validate',
        run: () => {
          this.runHooks('beforeValidate', ctx)
          const r = this.validate(ctx)
          this.runHooks('afterValidate', ctx, r)
          return r
        },
      },
      {
        name: 'authorize',
        run: () => {
          this.runHooks('beforeAuthorize', ctx)
          const r = this.authorize(ctx)
          this.runHooks('afterAuthorize', ctx, r)
          return r
        },
      },
      {
        name: 'certify',
        run: () => {
          this.runHooks('beforeCertify', ctx)
          const r = this.certify(ctx)
          this.runHooks('afterCertify', ctx, r)
          return r
        },
      },
      {
        name: 'audit',
        run: () => {
          this.runHooks('beforeAudit', ctx)
          const r = this.audit(ctx)
          this.runHooks('afterAudit', ctx, r)
          return r
        },
      },
      {
        name: 'metrics',
        run: () => {
          this.runHooks('beforeMetrics', ctx)
          const r = this.metrics(ctx, registry)
          this.runHooks('afterMetrics', ctx, r)
          return r
        },
      },
      {
        name: 'report',
        run: () => {
          this.runHooks('beforeReport', ctx)
          const r = this.report(ctx)
          this.runHooks('afterReport', ctx, r)
          return r
        },
      },
    ]

    for (const stage of stages) {
      const result = stage.run()
      results.push(result)
      if (!result.passed) break // 失败即停止
    }

    this.runHooks('afterPipeline', ctx, results)

    return {
      ctx,
      stages: results,
      passed: results.every((r) => r.passed),
      timestamp: Date.now(),
    }
  }

  private validate(ctx: PipelineContext): PipelineResult {
    if (!ctx.moduleId || !ctx.action) {
      return { passed: false, stage: 'validate', reason: 'Missing moduleId or action' }
    }
    return { passed: true, stage: 'validate' }
  }

  private authorize(ctx: PipelineContext): PipelineResult {
    // 委托给具体 Adapter
    return { passed: true, stage: 'authorize', data: { module: ctx.moduleId, action: ctx.action } }
  }

  private certify(ctx: PipelineContext): PipelineResult {
    return { passed: true, stage: 'certify' }
  }

  private audit(ctx: PipelineContext): PipelineResult {
    GovernanceRegistry.getInstance().recordEvent({
      id: `audit_${Date.now().toString(36)}`,
      event: 'policy' as any,
      module: ctx.moduleId,
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      detail: ctx.action,
      timestamp: Date.now(),
    })
    GovernanceRegistry.getInstance().incrementMetric('policies')
    return { passed: true, stage: 'audit' }
  }

  private metrics(ctx: PipelineContext, registry: GovernanceRegistry): PipelineResult {
    registry.incrementMetric('policies')
    return { passed: true, stage: 'metrics', data: { snapshot: registry.snapshot() } }
  }

  private report(ctx: PipelineContext): PipelineResult {
    return { passed: true, stage: 'report' }
  }

  // ── Hook runner ──

  private runHooks(method: keyof PipelineHook, ctx: PipelineContext, data?: PipelineResult | PipelineResult[]): void {
    for (const hook of this.hooks) {
      try {
        const fn = hook[method] as ((...args: unknown[]) => void) | undefined
        if (!fn) continue
        if (method === 'afterPipeline') (fn as (ctx: PipelineContext, results: PipelineResult[]) => void)(ctx, (data ?? []) as PipelineResult[])
        else if (data !== undefined) (fn as (ctx: PipelineContext, result: PipelineResult) => void)(ctx, data as PipelineResult)
        else (fn as (ctx: PipelineContext) => void)(ctx)
      } catch { /* hook 异常不影响管道 */ }
    }
  }
}
