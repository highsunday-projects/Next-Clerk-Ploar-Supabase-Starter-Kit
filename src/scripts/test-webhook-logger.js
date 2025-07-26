/**
 * 測試 webhook logger 功能的腳本
 */

// 使用 ES6 模組語法
import fs from 'fs';
import path from 'path';

// 模擬 webhookLogger 的簡化版本來測試文件寫入
class TestWebhookLogger {
  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs', 'webhooks');
    this.ensureLogsDirectory();
    
    const today = new Date().toISOString().split('T')[0];
    this.dailyLogFile = path.join(this.logsDir, `webhook-${today}.log`);
    this.errorLogFile = path.join(this.logsDir, `webhook-errors-${today}.log`);
  }

  ensureLogsDirectory() {
    try {
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
        console.log('✅ Created logs directory:', this.logsDir);
      } else {
        console.log('✅ Logs directory already exists:', this.logsDir);
      }
    } catch (error) {
      console.error('❌ Failed to create logs directory:', error);
    }
  }

  writeTestLog() {
    try {
      const testLog = `${new Date().toISOString()} [INFO] [test_${Date.now()}] TEST_LOG - This is a test log entry\nData: {"test": "data", "timestamp": "${new Date().toISOString()}"}\n${'='.repeat(80)}\n`;
      
      fs.appendFileSync(this.dailyLogFile, testLog);
      console.log('✅ Successfully wrote test log to:', this.dailyLogFile);
      
      const errorTestLog = `${new Date().toISOString()} [ERROR] [test_${Date.now()}] TEST_ERROR - This is a test error log entry\nError: {"message": "Test error", "type": "TEST"}\n${'='.repeat(80)}\n`;
      
      fs.appendFileSync(this.errorLogFile, errorTestLog);
      console.log('✅ Successfully wrote test error log to:', this.errorLogFile);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to write test log:', error);
      return false;
    }
  }

  checkLogFiles() {
    console.log('\n📁 Checking log files:');
    
    try {
      if (fs.existsSync(this.dailyLogFile)) {
        const stats = fs.statSync(this.dailyLogFile);
        console.log(`✅ Daily log file exists: ${this.dailyLogFile} (${stats.size} bytes)`);
      } else {
        console.log(`❌ Daily log file does not exist: ${this.dailyLogFile}`);
      }
      
      if (fs.existsSync(this.errorLogFile)) {
        const stats = fs.statSync(this.errorLogFile);
        console.log(`✅ Error log file exists: ${this.errorLogFile} (${stats.size} bytes)`);
      } else {
        console.log(`❌ Error log file does not exist: ${this.errorLogFile}`);
      }
    } catch (error) {
      console.error('❌ Error checking log files:', error);
    }
  }

  readLogFiles() {
    console.log('\n📖 Reading log file contents:');
    
    try {
      if (fs.existsSync(this.dailyLogFile)) {
        const content = fs.readFileSync(this.dailyLogFile, 'utf8');
        console.log('📄 Daily log content (last 500 chars):');
        console.log(content.slice(-500));
      }
      
      if (fs.existsSync(this.errorLogFile)) {
        const content = fs.readFileSync(this.errorLogFile, 'utf8');
        console.log('🚨 Error log content (last 500 chars):');
        console.log(content.slice(-500));
      }
    } catch (error) {
      console.error('❌ Error reading log files:', error);
    }
  }
}

// 執行測試
console.log('🧪 Starting webhook logger test...\n');

const testLogger = new TestWebhookLogger();

console.log('\n📝 Writing test logs...');
const writeSuccess = testLogger.writeTestLog();

console.log('\n🔍 Checking log files...');
testLogger.checkLogFiles();

if (writeSuccess) {
  console.log('\n📚 Reading log file contents...');
  testLogger.readLogFiles();
}

console.log('\n✅ Test completed! Check the logs directory for generated files.');
console.log(`📍 Logs are located at: ${path.join(process.cwd(), 'logs', 'webhooks')}`);