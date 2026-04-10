package com.smartqueue.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Queue - Password Reset OTP");
        message.setText("Your OTP for password reset is: " + otp +
                "\n\nThis OTP will expire in 10 minutes.\n\nDo not share this with anyone.");
        mailSender.send(message);
    }

    @Async
    public void sendTokenConfirmation(String toEmail, String tokenNumber, String serviceName,
                                      int queuePosition, int estimatedWait, java.time.LocalDateTime appointmentTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Queue - Token Confirmation #" + tokenNumber);
        
        String appointmentTimeStr = appointmentTime != null ? 
            appointmentTime.format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a, MMM dd")) : "TBD";
        
        message.setText(String.format(
                "Your token has been generated!\n\n" +
                "Token Number: %s\n" +
                "Service: %s\n" +
                "Queue Position: %d\n" +
                "Estimated Wait: ~%d minutes\n" +
                "Appointment Time: %s\n\n" +
                "Please arrive by the appointment time.\n" +
                "You will receive a reminder 20 minutes before your turn.",
                tokenNumber, serviceName, queuePosition, estimatedWait, appointmentTimeStr
        ));
        mailSender.send(message);
    }

    @Async
    public void sendReminder(String toEmail, String tokenNumber, int minutesLeft) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Queue - Your turn is approaching!");
        message.setText(String.format(
                "Your token number %s will be called in approximately %d minutes.\n\n" +
                "Please be ready at the service counter.",
                tokenNumber, minutesLeft
        ));
        mailSender.send(message);
    }
    
    @Async
    public void sendTokenCalled(String toEmail, String tokenNumber, String serviceName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Smart Queue - Your Token is Called!");
        message.setText(String.format(
                "🔔 Your token number %s has been called!\n\n" +
                "Service: %s\n\n" +
                "Please proceed to the service counter immediately.\n" +
                "This notification will remain active until you complete your service.",
                tokenNumber, serviceName
        ));
        mailSender.send(message);
    }
}
