package com.gxyide.pricing.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.gxyide.pricing.entity.Notification;
import com.gxyide.pricing.mapper.NotificationMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService extends ServiceImpl<NotificationMapper, Notification> {

    public List<Notification> getUserNotifications(Long userId) {
        LambdaQueryWrapper<Notification> w = new LambdaQueryWrapper<>();
        w.eq(Notification::getUserId, userId)
         .orderByDesc(Notification::getCreateTime)
         .last("LIMIT 50");
        return list(w);
    }

    public long getUnreadCount(Long userId) {
        LambdaQueryWrapper<Notification> w = new LambdaQueryWrapper<>();
        w.eq(Notification::getUserId, userId).eq(Notification::getIsRead, 0);
        return count(w);
    }

    public void markAsRead(Long notificationId, Long userId) {
        Notification n = getById(notificationId);
        if (n != null && n.getUserId().equals(userId)) {
            n.setIsRead(1);
            updateById(n);
        }
    }

    public void markAllAsRead(Long userId) {
        LambdaQueryWrapper<Notification> w = new LambdaQueryWrapper<>();
        w.eq(Notification::getUserId, userId).eq(Notification::getIsRead, 0);
        Notification update = new Notification();
        update.setIsRead(1);
        update(update, w);
    }

    public void send(Long userId, Long quoteId, String type, String title, String message) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setQuoteId(quoteId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setIsRead(0);
        save(n);
    }
}
