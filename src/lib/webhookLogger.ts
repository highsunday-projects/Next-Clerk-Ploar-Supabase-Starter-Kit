/**
 * Webhook 本地文件日誌工具
 * 
 * 提供結構化的日誌記錄功能，同時輸出到控制台和本地文件
 * 方便開發和除錯時查看 webhook 處理過程
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG';
  requestId: string;
  event: string;
  message: string;
  data?: unknown;
  error?: Error | { message?: string; stack?: string; name?: string } | unknown;
}

class WebhookLogger {
  private logsDir: string;
  private dailyLogFile: string;
  private errorLogFile: string;

  constructor() {
    // 在項目根目錄創建 logs 文件夾
    this.logsDir = join(process.cwd(), 'logs', 'webhooks');
    this.ensureLogsDirectory();
    
    // 按日期分割日誌文件
    const today = new Date().toISOString().split('T')[0];
    this.dailyLogFile = join(this.logsDir, `webhook-${today}.log`);
    this.errorLogFile = join(this.logsDir, `webhook-errors-${today}.log`);
  }

  private ensureLogsDirectory(): void {
    try {
      if (!existsSync(this.logsDir)) {
        mkdirSync(this.logsDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const baseLog = `${entry.timestamp} [${entry.level}] [${entry.requestId}] ${entry.event} - ${entry.message}`;
    
    let formattedLog = baseLog;
    
    if (entry.data) {
      formattedLog += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    if (entry.error) {
      formattedLog += `\nError: ${JSON.stringify(entry.error, null, 2)}`;
    }
    
    return formattedLog + '\n' + '-'.repeat(80) + '\n';
  }

  private writeToFile(logEntry: LogEntry): void {
    try {
      const formattedLog = this.formatLogEntry(logEntry);
      
      // 寫入每日日誌文件
      appendFileSync(this.dailyLogFile, formattedLog);
      
      // 如果是錯誤，也寫入錯誤日誌文件
      if (logEntry.level === 'ERROR') {
        appendFileSync(this.errorLogFile, formattedLog);
      }
    } catch (error) {
      // 如果文件寫入失敗，只在控制台記錄錯誤，不拋出異常
      console.error('Failed to write to log file:', error);
    }
  }

  info(requestId: string, event: string, message: string, data?: unknown): void {
    const logEntry: LogEntry = {
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

  error(requestId: string, event: string, message: string, error?: Error | { message?: string; stack?: string; name?: string } | unknown, data?: unknown): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      requestId,
      event,
      message,
      data,
      error
    };

    // 輸出到控制台
    console.error(`[${requestId}] ❌ ${event} - ${message}`);
    if (data) {
      console.error(`[${requestId}] Data:`, data);
    }
    if (error) {
      console.error(`[${requestId}] Error:`, error);
    }

    // 寫入文件
    this.writeToFile(logEntry);
  }

  warn(requestId: string, event: string, message: string, data?: unknown): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      requestId,
      event,
      message,
      data
    };

    // 輸出到控制台
    console.warn(`[${requestId}] ⚠️ ${event} - ${message}`);
    if (data) {
      console.warn(`[${requestId}] Data:`, data);
    }

    // 寫入文件
    this.writeToFile(logEntry);
  }

  debug(requestId: string, event: string, message: string, data?: unknown): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      requestId,
      event,
      message,
      data
    };

    // 只在開發環境輸出 debug 到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${requestId}] 🔍 ${event} - ${message}`);
      if (data) {
        console.log(`[${requestId}] Debug data:`, data);
      }
    }

    // 始終寫入文件
    this.writeToFile(logEntry);
  }

  // 記錄 webhook 請求開始
  logRequestStart(requestId: string, request: Request): void {
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
      polarSignature: request.headers.get('x-polar-signature') ? 'Present' : 'Missing',
      polarEvent: request.headers.get('x-polar-event'),
      polarDelivery: request.headers.get('x-polar-delivery')
    };

    this.info(requestId, 'REQUEST_START', 'Webhook request received', requestInfo);
  }

  // 記錄 webhook 請求結束
  logRequestEnd(requestId: string, status: number, processingTime: number): void {
    this.info(requestId, 'REQUEST_END', `Request completed with status ${status}`, {
      status,
      processingTimeMs: processingTime
    });
  }

  // 記錄事件處理開始
  logEventStart(requestId: string, eventType: string, eventData: { id?: string; [key: string]: unknown }): void {
    this.info(requestId, `EVENT_${eventType.toUpperCase()}_START`, `Processing ${eventType} event`, {
      eventId: eventData.id,
      eventData: eventData
    });
  }

  // 記錄事件處理成功
  logEventSuccess(requestId: string, eventType: string, processingTime: number, result?: unknown): void {
    this.info(requestId, `EVENT_${eventType.toUpperCase()}_SUCCESS`, `${eventType} event processed successfully`, {
      processingTimeMs: processingTime,
      result
    });
  }

  // 記錄事件處理失敗
  logEventError(requestId: string, eventType: string, processingTime: number, error: Error | { message?: string; stack?: string; name?: string } | unknown): void {
    const errorInfo = this.extractErrorInfo(error);
    this.error(requestId, `EVENT_${eventType.toUpperCase()}_ERROR`, `${eventType} event processing failed`, {
      message: errorInfo.message,
      stack: errorInfo.stack,
      name: errorInfo.name
    }, {
      processingTimeMs: processingTime
    });
  }

  // 提取錯誤資訊的輔助方法
  private extractErrorInfo(error: unknown): { message?: string; stack?: string; name?: string } {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const errorObj = error as { message?: string; stack?: string; name?: string };
      return {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name
      };
    }

    return {
      message: String(error),
      stack: undefined,
      name: 'UnknownError'
    };
  }

  // 記錄資料庫操作
  logDatabaseOperation(requestId: string, operation: string, userId: string, data: unknown, result?: unknown): void {
    this.info(requestId, 'DATABASE_OPERATION', `${operation} for user ${userId}`, {
      operation,
      userId,
      updateData: data,
      result
    });
  }

  // 記錄資料庫錯誤
  logDatabaseError(requestId: string, operation: string, userId: string, error: Error | { message?: string; stack?: string; name?: string } | unknown): void {
    const errorInfo = this.extractErrorInfo(error);
    this.error(requestId, 'DATABASE_ERROR', `${operation} failed for user ${userId}`, {
      message: errorInfo.message,
      stack: errorInfo.stack,
      name: errorInfo.name
    }, {
      operation,
      userId
    });
  }
}

// 創建單例實例
export const webhookLogger = new WebhookLogger();