/**
 * 直接測試 webhookLogger 的 ES 模組腳本
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 簡化版 logger 測試
class TestLogger {
  constructor() {
    this.logsDir = join(process.cwd(), 'logs', 'webhooks');
    this.ensureLogsDirectory();
    
    const today = new Date().toISOString().split('T')[0];
    this.dailyLogFile = join(this.logsDir, `webhook-${today}.log`);
  }

  ensureLogsDirectory() {
    try {
      if (!existsSync(this.logsDir)) {
        mkdirSync(this.logsDir, { recursive: true });
        console.log('✅ Created logs directory:', this.logsDir);
      } else {
        console.log('✅ Logs directory exists:', this.logsDir);
      }
    } catch (error) {
      console.error('❌ Failed to create logs directory:', error);
    }
  }

  logRequestStart(requestId, mockRequest) {
    const requestInfo = {
      method: mockRequest.method,
      url: mockRequest.url,
      userAgent: mockRequest.headers['user-agent'],
      contentType: mockRequest.headers['content-type'],
      polarSignature: mockRequest.headers['x-polar-signature'] ? 'Present' : 'Missing',
      polarEvent: mockRequest.headers['x-polar-event'],
    };

    this.info(requestId, 'REQUEST_START', 'Webhook request received', requestInfo);
  }

  info(requestId, event, message, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      requestId,
      event,
      message,
      data
    };

    // 輸出到控制台
    console.log(`[${requestId}] ${event} - ${message}`);
    if (data) {
      console.log(`[${requestId}] Data:`, data);
    }

    // 寫入文件
    this.writeToFile(logEntry);
  }

  writeToFile(logEntry) {
    try {
      const formattedLog = this.formatLogEntry(logEntry);
      appendFileSync(this.dailyLogFile, formattedLog);
      console.log('✅ Successfully wrote to log file');
    } catch (error) {
      console.error('❌ Failed to write to log file:', error);
    }
  }

  formatLogEntry(entry) {
    const baseLog = `${entry.timestamp} [${entry.level}] [${entry.requestId}] ${entry.event} - ${entry.message}`;
    
    let formattedLog = baseLog;
    
    if (entry.data) {
      formattedLog += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    return formattedLog + '\n' + '-'.repeat(80) + '\n';
  }
}

// 執行測試
console.log('🧪 Testing webhook logger direct...\n');

const logger = new TestLogger();
const requestId = `test_direct_${Date.now()}`;

// 模擬請求
const mockRequest = {
  method: 'POST',
  url: 'http://localhost:3000/api/webhooks/polar',
  headers: {
    'content-type': 'application/json',
    'user-agent': 'Test-Agent/1.0',
    'x-polar-signature': 'test123',
    'x-polar-event': 'subscription.created'
  }
};

logger.logRequestStart(requestId, mockRequest);

console.log('\n✅ Direct logger test completed!');
console.log(`📍 Check the log file: ${logger.dailyLogFile}`);