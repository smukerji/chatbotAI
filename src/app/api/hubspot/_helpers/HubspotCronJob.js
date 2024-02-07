// cronJob.js

const cron = require('node-cron');

// Define your cron schedule (e.g., running every minute)
cron.schedule('*/2 * * * * *', () => {
  console.log('Cron job is running!');
  // Add your cron job logic here
});

// You can add more cron jobs if needed

// Keep the script running
process.stdin.resume();
