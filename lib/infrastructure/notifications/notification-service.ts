// lib/infrastructure/notifications/notification-service.ts
import { prisma } from '@/lib/infrastructure/database/prisma'
import { logger } from '@/lib/shared/logger'
import { NOTIFICATION_TYPE } from '@/lib/shared/constants'

export type NotificationType = 
  | 'BOOKING_CREATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_EXPIRED'
  | 'SLOT_REMINDER'
  | typeof NOTIFICATION_TYPE[keyof typeof NOTIFICATION_TYPE]

export interface NotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedId?: string
  data?: any
  channel?: 'APP' | 'EMAIL' | 'SMS'
}

export class NotificationService {
  async send(params: NotificationParams): Promise<void> {
    try {
      // 1. Save to DB
      await prisma.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          read: false,
          relatedId: params.relatedId,
          data: params.data || {}
        }
      })

      // 2. Send to external channels (async)
      this.sendToChannels(params).catch(error => {
        logger.error('Failed to send notification to channels', error)
      })

      logger.info('Notification sent', {
        userId: params.userId,
        type: params.type,
        relatedId: params.relatedId
      })
    } catch (error: any) {
      logger.error('Failed to save notification', error)
      // Notification failure shouldn't break business logic
    }
  }

  private async sendToChannels(params: NotificationParams): Promise<void> {
    const channels = params.channel ? [params.channel] : ['APP']
    
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'EMAIL':
            await this.sendEmail(params)
            break
          case 'SMS':
            await this.sendSMS(params)
            break
          // APP notifications already saved to DB
        }
      } catch (error: any) {
        logger.warn(`Failed to send ${channel} notification`, error)
      }
    }
  }

  private async sendEmail(params: NotificationParams): Promise<void> {
    // TODO: Integrate with email service
    const { RESEND_API_KEY, EMAIL_FROM } = process.env
    
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      logger.warn('Email service not configured', { userId: params.userId })
      return
    }

    logger.info('Email notification queued', {
      userId: params.userId,
      type: params.type
    })
    
    // Implement email sending here
  }

  private async sendSMS(params: NotificationParams): Promise<void> {
    // TODO: Integrate with SMS service
    logger.info('SMS notification queued', {
      userId: params.userId,
      type: params.type
    })
  }

  async getUserNotifications(userId: string, limit: number = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.update({
      where: { 
        id: notificationId,
        userId // Ensure user owns the notification
      },
      data: { read: true }
    })
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { 
        userId,
        read: false
      },
      data: { read: true }
    })
  }
}

export const notificationService = new NotificationService()