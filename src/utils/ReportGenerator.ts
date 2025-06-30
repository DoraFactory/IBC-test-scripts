import { RelayerTestLog, RelayerPerformanceMetrics } from '../types'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { logger } from './logger'

export class ReportGenerator {
  private logs: RelayerTestLog[]
  private metrics: RelayerPerformanceMetrics[]

  constructor(logs: RelayerTestLog[], metrics: RelayerPerformanceMetrics[]) {
    this.logs = logs
    this.metrics = metrics
  }

  generateHtmlReport(): string {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IBC Relayer 测试报告 | IBC Relayer Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        .language-toggle {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        .language-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 5px;
            transition: all 0.3s ease;
        }
        .language-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .language-button.active {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e1e5e9;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
        }
        .header h1 {
            color: #2d3748;
            margin: 0;
        }
        .header .subtitle {
            color: #718096;
            margin-top: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-card.success {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .summary-card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .summary-card.info {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .summary-card .value {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #2d3748;
            border-left: 4px solid #4299e1;
            padding-left: 15px;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        th {
            background-color: #f7fafc;
            font-weight: 600;
            color: #2d3748;
        }
        .status-success {
            color: #38a169;
            font-weight: bold;
        }
        .status-failed {
            color: #e53e3e;
            font-weight: bold;
        }
        .latency-excellent { color: #38a169; }
        .latency-good { color: #d69e2e; }
        .latency-poor { color: #e53e3e; }
        .validator-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .validator-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            background: white;
        }
        .validator-card h4 {
            margin: 0 0 15px 0;
            color: #2d3748;
        }
        .metric-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .metric-label {
            color: #718096;
        }
        .metric-value {
            font-weight: 600;
            color: #2d3748;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e2e8f0;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }
        .progress-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        .progress-success { background-color: #38a169; }
        .progress-warning { background-color: #d69e2e; }
        .progress-danger { background-color: #e53e3e; }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="language-toggle">
        <button class="language-button active" onclick="switchLanguage('zh')" id="zh-btn">中文</button>
        <button class="language-button" onclick="switchLanguage('en')" id="en-btn">English</button>
    </div>
    
    <div class="container">
        <div class="header">
            <h1 data-zh="🧪 IBC Relayer 测试报告" data-en="🧪 IBC Relayer Test Report">🧪 IBC Relayer 测试报告</h1>
            <div class="subtitle" data-zh="vota-bobtail 激励测试网 - 生成时间: ${new Date().toLocaleString(
              'zh-CN'
            )}" data-en="vota-bobtail Incentive Testnet - Generated at: ${new Date().toLocaleString(
      'en-US'
    )}">vota-bobtail 激励测试网 - 生成时间: ${new Date().toLocaleString(
      'zh-CN'
    )}</div>
        </div>

        <div class="summary">
            <div class="summary-card info">
                <h3 data-zh="总测试数" data-en="Total Tests">总测试数</h3>
                <div class="value">${this.logs.length}</div>
            </div>
            <div class="summary-card success">
                <h3 data-zh="成功率" data-en="Success Rate">成功率</h3>
                <div class="value">${this.calculateOverallSuccessRate().toFixed(
                  1
                )}%</div>
            </div>
            <div class="summary-card warning">
                <h3 data-zh="平均延迟" data-en="Average Latency">平均延迟</h3>
                <div class="value">${this.calculateAverageLatency().toFixed(
                  0
                )}ms</div>
            </div>
            <div class="summary-card">
                <h3 data-zh="活跃 Validators" data-en="Active Validators">活跃 Validators</h3>
                <div class="value">${this.metrics.length}</div>
            </div>
        </div>

        <div class="section">
            <h2 data-zh="📊 Validator 性能排名" data-en="📊 Validator Performance Ranking">📊 Validator 性能排名</h2>
            <div class="validator-metrics">
                ${this.generateValidatorCards()}
            </div>
        </div>

        <div class="section">
            <h2 data-zh="📝 最近测试日志" data-en="📝 Recent Test Logs">📝 最近测试日志</h2>
            <table>
                <thead>
                    <tr>
                        <th data-zh="测试时间" data-en="Test Time">测试时间</th>
                        <th data-zh="交易Hash" data-en="Transaction Hash">交易Hash</th>
                        <th data-zh="Packet序列" data-en="Packet Sequence">Packet序列</th>
                        <th data-zh="状态" data-en="Status">状态</th>
                        <th data-zh="延迟(ms)" data-en="Latency(ms)">延迟(ms)</th>
                        <th data-zh="Relayer标识" data-en="Relayer Identifier">Relayer标识</th>
                        <th data-zh="Signer地址" data-en="Signer Address">Signer地址</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateLogRows()}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 data-zh="📈 性能统计" data-en="📈 Performance Statistics">📈 性能统计</h2>
            <table>
                <thead>
                    <tr>
                        <th data-zh="Validator" data-en="Validator">Validator</th>
                        <th data-zh="总测试数" data-en="Total Tests">总测试数</th>
                        <th data-zh="成功数" data-en="Successful">成功数</th>
                        <th data-zh="成功率" data-en="Success Rate">成功率</th>
                        <th data-zh="平均延迟" data-en="Average Latency">平均延迟</th>
                        <th data-zh="最大延迟" data-en="Max Latency">最大延迟</th>
                        <th data-zh="连续失败" data-en="Consecutive Failures">连续失败</th>
                        <th data-zh="状态" data-en="Status">状态</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.generateMetricsRows()}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p data-zh="此报告由 IBC Relayer 测试系统自动生成" data-en="This report is automatically generated by the IBC Relayer testing system">此报告由 IBC Relayer 测试系统自动生成</p>
        </div>
    </div>

    <script>
        let currentLanguage = 'zh';

        function switchLanguage(lang) {
            currentLanguage = lang;
            localStorage.setItem('reportLanguage', lang);
            
            // Update button states
            document.getElementById('zh-btn').classList.toggle('active', lang === 'zh');
            document.getElementById('en-btn').classList.toggle('active', lang === 'en');
            
            // Update all elements with data-zh and data-en attributes
            const elements = document.querySelectorAll('[data-zh][data-en]');
            elements.forEach(element => {
                if (lang === 'zh') {
                    element.textContent = element.getAttribute('data-zh');
                } else {
                    element.textContent = element.getAttribute('data-en');
                }
            });

            // Update document language
            document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
            
            // Update page title
            document.title = lang === 'zh' ? 'IBC Relayer 测试报告' : 'IBC Relayer Test Report';
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Set default language from browser or saved preference
            const savedLang = localStorage.getItem('reportLanguage') || 'zh';
            switchLanguage(savedLang);
        });
    </script>
</body>
</html>
    `
    return html
  }

  generateMarkdownReport(): string {
    const md = `# 🧪 IBC Relayer 测试报告

**生成时间**: ${new Date().toLocaleString('zh-CN')}  
**测试网络**: vota-bobtail 激励测试网

---

## 📊 总体统计

| 指标 | 数值 |
|------|------|
| 总测试数 | ${this.logs.length} |
| 成功测试数 | ${this.logs.filter((l) => l.success).length} |
| 成功率 | ${this.calculateOverallSuccessRate().toFixed(2)}% |
| 平均延迟 | ${this.calculateAverageLatency().toFixed(0)}ms |
| 活跃 Validators | ${this.metrics.length} |

---

## 🏆 Validator 性能排名

${this.generateMarkdownValidatorRanking()}

---

## 📈 详细性能指标

| Validator | 总测试 | 成功 | 成功率 | 平均延迟 | 最大延迟 | 连续失败 | 状态 |
|-----------|--------|------|--------|----------|----------|----------|------|
${this.metrics
  .map(
    (m) =>
      `| ${m.validatorMoniker} | ${m.totalTests} | ${
        m.successfulRelays
      } | ${m.successRate.toFixed(1)}% | ${m.averageLatency.toFixed(
        0
      )}ms | ${m.maxLatency.toFixed(0)}ms | ${m.continuousFailures} | ${
        m.successRate >= 90
          ? '🟢 优秀'
          : m.successRate >= 70
          ? '🟡 良好'
          : '🔴 需改进'
      } |`
  )
  .join('\n')}

---

## 📝 最近测试记录 (最新10条)

| 时间 | 状态 | 延迟 | Validator | Packet序列 |
|------|------|------|-----------|------------|
${this.logs
  .slice(-10)
  .reverse()
  .map(
    (log) =>
      `| ${log.testTime.toLocaleString('zh-CN')} | ${
        log.success ? '✅ 成功' : '❌ 失败'
      } | ${log.latency}ms | ${
        log.memoIdentifier?.replace('relayed-by:', '') || 'Unknown'
      } | ${log.packetSequence} |`
  )
  .join('\n')}

---

## 💡 建议和总结

${this.generateRecommendations()}

---

*此报告由 IBC Relayer 测试系统自动生成*
`
    return md
  }

  private calculateOverallSuccessRate(): number {
    if (this.logs.length === 0) return 0
    const successCount = this.logs.filter((log) => log.success).length
    return (successCount / this.logs.length) * 100
  }

  private calculateAverageLatency(): number {
    const successfulLogs = this.logs.filter((log) => log.success)
    if (successfulLogs.length === 0) return 0
    const totalLatency = successfulLogs.reduce(
      (sum, log) => sum + log.latency,
      0
    )
    return totalLatency / successfulLogs.length
  }

  private generateValidatorCards(): string {
    return this.metrics
      .sort((a, b) => b.successRate - a.successRate)
      .map((metric) => {
        const progressClass =
          metric.successRate >= 90
            ? 'progress-success'
            : metric.successRate >= 70
            ? 'progress-warning'
            : 'progress-danger'

        return `
        <div class="validator-card">
            <h4>🏷️ ${metric.validatorMoniker}</h4>
            <div class="metric-row">
                <span class="metric-label" data-zh="成功率" data-en="Success Rate">成功率</span>
                <span class="metric-value">${metric.successRate.toFixed(
                  1
                )}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${progressClass}" style="width: ${
          metric.successRate
        }%"></div>
            </div>
            <div class="metric-row">
                <span class="metric-label" data-zh="总测试数" data-en="Total Tests">总测试数</span>
                <span class="metric-value">${metric.totalTests}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label" data-zh="平均延迟" data-en="Average Latency">平均延迟</span>
                <span class="metric-value">${metric.averageLatency.toFixed(
                  0
                )}ms</span>
            </div>
            <div class="metric-row">
                <span class="metric-label" data-zh="连续失败次数" data-en="Consecutive Failures">连续失败次数</span>
                <span class="metric-value">${metric.continuousFailures}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label" data-zh="最后活跃" data-en="Last Active">最后活跃</span>
                <span class="metric-value">${
                  metric.lastActiveTime
                    ? metric.lastActiveTime.toLocaleString('zh-CN')
                    : '未知'
                }</span>
            </div>
        </div>
        `
      })
      .join('')
  }

  private generateLogRows(): string {
    return this.logs
      .slice(-20) // 显示最近20条
      .reverse()
      .map((log) => {
        const statusClass = log.success ? 'status-success' : 'status-failed'
        const statusTextZh = log.success ? '✅ 成功' : '❌ 失败'
        const statusTextEn = log.success ? '✅ Success' : '❌ Failed'
        const latencyClass =
          log.latency < 5000
            ? 'latency-excellent'
            : log.latency < 10000
            ? 'latency-good'
            : 'latency-poor'

        return `
        <tr>
            <td>${log.testTime.toLocaleString('zh-CN')}</td>
            <td style="font-family: monospace; font-size: 12px;">${log.txHash.slice(
              0,
              16
            )}...</td>
            <td>${log.packetSequence}</td>
            <td class="${statusClass}" data-zh="${statusTextZh}" data-en="${statusTextEn}">${statusTextZh}</td>
            <td class="${latencyClass}">${log.latency}</td>
            <td>${
              log.memoIdentifier?.replace('relayed-by:', '') || 'Unknown'
            }</td>
            <td style="font-family: monospace; font-size: 12px;">${
              log.relayerSigner?.slice(0, 16) + '...' || 'Unknown'
            }</td>
        </tr>
        `
      })
      .join('')
  }

  private generateMetricsRows(): string {
    return this.metrics
      .sort((a, b) => b.successRate - a.successRate)
      .map((metric) => {
        const statusEmoji =
          metric.successRate >= 90
            ? '🟢'
            : metric.successRate >= 70
            ? '🟡'
            : '🔴'
        const statusTextZh =
          metric.successRate >= 90
            ? '优秀'
            : metric.successRate >= 70
            ? '良好'
            : '需改进'
        const statusTextEn =
          metric.successRate >= 90
            ? 'Excellent'
            : metric.successRate >= 70
            ? 'Good'
            : 'Needs Improvement'

        return `
        <tr>
            <td><strong>${metric.validatorMoniker}</strong></td>
            <td>${metric.totalTests}</td>
            <td>${metric.successfulRelays}</td>
            <td>${metric.successRate.toFixed(1)}%</td>
            <td>${metric.averageLatency.toFixed(0)}ms</td>
            <td>${metric.maxLatency.toFixed(0)}ms</td>
            <td>${metric.continuousFailures}</td>
            <td data-zh="${statusEmoji} ${statusTextZh}" data-en="${statusEmoji} ${statusTextEn}">${statusEmoji} ${statusTextZh}</td>
        </tr>
        `
      })
      .join('')
  }

  private generateMarkdownValidatorRanking(): string {
    return this.metrics
      .sort((a, b) => b.successRate - a.successRate)
      .map((metric, index) => {
        const medal =
          index === 0
            ? '🥇'
            : index === 1
            ? '🥈'
            : index === 2
            ? '🥉'
            : `${index + 1}.`
        const status =
          metric.successRate >= 90
            ? '🟢 优秀'
            : metric.successRate >= 70
            ? '🟡 良好'
            : '🔴 需改进'

        return `${medal} **${
          metric.validatorMoniker
        }** - 成功率: ${metric.successRate.toFixed(1)}% (${
          metric.successfulRelays
        }/${metric.totalTests}) ${status}`
      })
      .join('\n')
  }

  private generateRecommendations(): string {
    const overallSuccessRate = this.calculateOverallSuccessRate()
    const avgLatency = this.calculateAverageLatency()
    const poorPerformers = this.metrics.filter((m) => m.successRate < 70)

    let recommendations = []

    if (overallSuccessRate < 80) {
      recommendations.push(
        '⚠️ **整体成功率偏低**: 建议检查网络连接和 relayer 配置'
      )
    }

    if (avgLatency > 10000) {
      recommendations.push('⚠️ **平均延迟较高**: 建议优化 relayer 响应速度')
    }

    if (poorPerformers.length > 0) {
      recommendations.push(
        `⚠️ **性能不佳的 Validators**: ${poorPerformers
          .map((p) => p.validatorMoniker)
          .join(', ')} 需要改进`
      )
    }

    if (recommendations.length === 0) {
      recommendations.push(
        '✅ **整体表现良好**: 所有 validators 的 relayer 服务运行正常'
      )
    }

    return recommendations.join('\n\n')
  }

  saveReports(outputDir: string = process.cwd()): void {
    try {
      const htmlReport = this.generateHtmlReport()
      const mdReport = this.generateMarkdownReport()

      const htmlPath = join(outputDir, 'ibc-relayer-report.html')
      const mdPath = join(outputDir, 'ibc-relayer-report.md')

      writeFileSync(htmlPath, htmlReport, 'utf-8')
      writeFileSync(mdPath, mdReport, 'utf-8')

      logger.info(`Reports saved:`)
      logger.info(`  HTML: ${htmlPath}`)
      logger.info(`  Markdown: ${mdPath}`)
    } catch (error) {
      logger.error('Failed to save reports:', error)
    }
  }

  generateJSONSummary(): any {
    return {
      summary: {
        totalTests: this.logs.length,
        successfulTests: this.logs.filter((l) => l.success).length,
        successRate: this.calculateOverallSuccessRate(),
        averageLatency: this.calculateAverageLatency(),
        activeValidators: this.metrics.length,
        generatedAt: new Date().toISOString(),
      },
      validators: this.metrics.sort((a, b) => b.successRate - a.successRate),
      recentLogs: this.logs.slice(-10).reverse(),
    }
  }
}
