-- Add welcome email trigger for new user registration
-- This would be added to your user registration flow

-- Example trigger for user registration (add to your registration component code):
/*
await emailTriggerService.triggerEmail('user:registered', {
  user: {
    id: authUser.id,
    email: authUser.email,
    full_name: authUser.user_metadata?.full_name || 'New User'
  }
});
*/

-- Add invoice status triggers (add to your invoice status update code):
/*
// In Invoices.jsx updateInvoiceStatus function:
await emailTriggerService.triggerEmail(`invoice:status:${newStatus}`, {
  invoice: invoiceData,
  client: clientData
});
*/

-- Add new booking trigger (add to your booking creation code):
/*
// In NewBooking.jsx after successful booking creation:
await emailTriggerService.triggerEmail('booking:created', {
  booking: bookingData,
  client: clientData
});
*/

-- Add scheduled reminders (add to your booking confirmation):
/*
// After booking confirmation:
emailTriggerService.scheduleAppointmentReminders(booking);
*/
