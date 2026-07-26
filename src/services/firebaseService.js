const { admin } = require('../config/firebase');

const firebaseService = {
  // Verify Firebase ID token (from mobile app)
  verifyIdToken: async (idToken) => {
    if (!admin) throw new Error('Firebase not initialized');
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      return {
        success: true,
        uid: decoded.uid,
        phone: decoded.phone_number,
        email: decoded.email,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Send push notification
  sendPushNotification: async (deviceToken, title, body, data = {}) => {
    if (!admin) return { success: false, message: 'Firebase not initialized' };
    try {
      const response = await admin.messaging().send({
        token: deviceToken,
        notification: { title, body },
        data,
      });
      return { success: true, messageId: response };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

module.exports = firebaseService;
