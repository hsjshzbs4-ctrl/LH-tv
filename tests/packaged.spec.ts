// tests/packaged.spec.ts - 打包后 exe 的冒烟测试
import { test, expect } from '@playwright/test'
import { join } from 'path'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'

const EXE_PATH = join(__dirname, '..', 'dist', 'LH 2.0.0.exe')

test.describe('打包 exe 冒烟测试', () => {

  test('exe 应能启动并保持运行', async () => {
    // 如果 exe 不存在则跳过
    if (!existsSync(EXE_PATH)) {
      test.skip(true, '打包 exe 不存在（需先执行 npm run dist）')
      return
    }

    test.setTimeout(30000)

    // 直接启动打包后的 EXE，验证进程能正常启动并保持运行
    const proc = spawn(EXE_PATH, [], {
      stdio: 'ignore',
      windowsHide: false
    })

    let exited = false
    let exitCode: number | null = null

    proc.on('exit', (code) => {
      exited = true
      exitCode = code
    })

    // 等待 5 秒，确认进程没有立即崩溃
    await new Promise<void>((resolve) => setTimeout(resolve, 5000))

    expect(exited).toBe(false)

    // 清理：结束测试进程
    proc.kill()
  })
})
