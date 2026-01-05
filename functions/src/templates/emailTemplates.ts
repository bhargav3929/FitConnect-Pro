export const EMAIL_TEMPLATES = {
    WELCOME: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0066FF;">Welcome to FitConnect Pro! 🎉</h1>
      <p>Hi {{name}},</p>
      <p>We're thrilled to have you on board. Your journey to a healthier, stronger you starts here.</p>
      <p>With FitConnect Pro, you get access to top gyms and trainers in your area.</p>
      <a href="{{browseUrl}}" style="background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Browse Classes</a>
    </div>
  `,

    SUBSCRIPTION_ACTIVATED: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0066FF;">Your {{planName}} is Active!</h1>
      <p>Hi {{name}},</p>
      <p>Your subscription is now active until {{endDate}}.</p>
      <p>You can now book daily classes at any of our partner gyms.</p>
      <a href="{{browseUrl}}" style="background-color: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Book Your First Class</a>
    </div>
  `,

    BOOKING_CONFIRMED: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #10B981;">Class Booked! ✅</h1>
      <p>Hi {{name}},</p>
      <p>You're confirmed for <strong>{{classType}}</strong> with <strong>{{trainerName}}</strong>.</p>
      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Time:</strong> {{time}}</p>
        <p><strong>Location:</strong> {{gymName}}</p>
        <p><strong>Address:</strong> {{address}}</p>
      </div>
      <p>Don't forget to bring a water bottle and a towel!</p>
    </div>
  `,

    // Add remaining templates here
    REMINDER_24H: `<div>Class tomorrow...</div>`,
    REMINDER_1H: `<div>Class starting in 1 hour...</div>`,
    WAITLIST_SPOT: `<div>Spot opened! Claim now...</div>`,
    BOOKING_CANCELED: `<div>Booking canceled...</div>`,
    CLASS_CANCELED: `<div>Class canceled...</div>`,
    SUBSCRIPTION_EXPIRING: `<div>Expiring soon...</div>`,
    SUBSCRIPTION_EXPIRED: `<div>Expired...</div>`
};

export function getTemplate(type: keyof typeof EMAIL_TEMPLATES, data: Record<string, string>) {
    let template = EMAIL_TEMPLATES[type];
    Object.keys(data).forEach(key => {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    });
    return template;
}
