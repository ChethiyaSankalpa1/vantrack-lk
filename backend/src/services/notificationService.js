const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const Trip = require('../models/Trip');

/**
 * Send in-app notification + Socket.IO real-time alert + FCM push
 */
exports.sendNotification = async ({ userId, title, message, type = 'general', data = {}, io = null }) => {
  try {
    // 1. Create In-App Notification in Database
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
      isRead: false,
    });

    // 2. Real-time Socket.IO Broadcast
    if (io) {
      // Emit to user room and parent-specific listener
      io.to(`user_${userId}`).emit('notification:new', notification);
      io.emit(`parent:${userId}:notification`, notification);
    }

    // 3. Firebase Cloud Messaging (FCM) Push Notification
    if (process.env.FIREBASE_SERVER_KEY && process.env.FIREBASE_SERVER_KEY.trim().length > 0) {
      try {
        const user = await User.findById(userId).select('fcmTokens').lean();
        const tokens = (user?.fcmTokens || []).map((t) => t.token).filter(Boolean);

        if (tokens.length > 0) {
          // Send FCM Legacy / HTTP request
          const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
          for (const token of tokens) {
            await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`,
              },
              body: JSON.stringify({
                to: token,
                notification: {
                  title,
                  body: message,
                  sound: 'default',
                  badge: 1,
                },
                data: {
                  ...data,
                  type,
                  notificationId: notification._id.toString(),
                },
              }),
            });
          }
        }
      } catch (fcmError) {
        console.warn('[FCM Push Warning]', fcmError.message);
      }
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error);
    return null;
  }
};

/**
 * Broadcast notification to all parents of students on a specific trip/vehicle
 */
exports.broadcastToTripParents = async ({ tripId, title, message, type = 'general', data = {}, io = null }) => {
  try {
    const trip = await Trip.findById(tripId).lean();
    if (!trip || !trip.vehicleId) return [];

    // Find students assigned to this vehicle
    const students = await Student.find({
      assignedVehicleId: trip.vehicleId,
      status: 'active',
    })
      .select('parentId name')
      .lean();

    const parentIds = [...new Set(students.map((s) => s.parentId?.toString()).filter(Boolean))];

    const results = [];
    for (const parentId of parentIds) {
      const notif = await exports.sendNotification({
        userId: parentId,
        title,
        message,
        type,
        data: {
          ...data,
          tripId: tripId.toString(),
        },
        io,
      });
      if (notif) results.push(notif);
    }

    return results;
  } catch (error) {
    console.error('[Broadcast To Trip Parents Error]', error);
    return [];
  }
};

/**
 * Register FCM Device Token for Push Notifications
 */
exports.registerFcmToken = async (userId, token, device = 'android') => {
  if (!token) return null;
  return await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        fcmTokens: {
          token,
          device,
          updatedAt: new Date(),
        },
      },
    },
    { new: true }
  );
};
