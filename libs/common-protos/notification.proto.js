// // libs/common-protos/notification.proto
// syntax = "proto3";

// package notification;

// // Service definition for sending internal notifications
// service NotificationService {
//   rpc SendWelcomeEmail(WelcomeEmailRequest) returns(NotificationResponse);
//   rpc SendPasswordResetEmail(PasswordResetEmailRequest) returns(NotificationResponse);
//     // Add other internal notification types here
// }

// // Message for a welcome email notification
// message WelcomeEmailRequest {
//   string recipient_email = 1;
//   string user_name = 2;
// }

// // Message for a password reset email notification
// message PasswordResetEmailRequest {
//   string recipient_email = 1;
//   string reset_link = 2;
// }

// // Generic response for notification requests
// message NotificationResponse {
//   bool success = 1;
//   string message = 2;
//   string notification_id = 3; // Optional: ID of the queued/sent notification
// }
