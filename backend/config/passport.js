const passport = require('passport');

// Only initialize Google OAuth if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('your_google')) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;
  const User = require('../models/User');

  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          user = await User.findOne({ email: profile.emails[0].value });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = profile.photos[0]?.value || '';
            await user.save({ validateBeforeSave: false });
            return done(null, user);
          }

          user = await User.create({
            name:     profile.displayName,
            email:    profile.emails[0].value,
            googleId: profile.id,
            avatar:   profile.photos[0]?.value || '',
            password: Math.random().toString(36).slice(-16) + 'Aa1!',
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const User = require('../models/User');
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  console.log('Google OAuth initialized');
} else {
  console.log('Google OAuth skipped — credentials not configured');
}

module.exports = passport;
