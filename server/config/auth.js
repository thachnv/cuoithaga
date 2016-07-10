module.exports = {
    'facebookAuth' : {
        'clientID' 		: '411546052326680', // your App ID
        'clientSecret' 	: '870e493af98e94bb84ff72955e01f584', // your App Secret
        'callbackURL' 	: '/api/auth/facebook/callback'
    },
    'twitterAuth' : {
        'consumerKey' 		: 'your-consumer-key-here',
        'consumerSecret' 	: 'your-client-secret-here',
        'callbackURL' 		: 'http://localhost:8080/auth/twitter/callback'
    },
    'googleAuth' : {
        'clientID' 		: '1010861104607-1v9870fmpae5ti8fsenbk0vcmhhgh3sd.apps.googleusercontent.com',
        'clientSecret' 	: '7GqzLDx_HWbpEti3UWr5uNWe',
        'callbackURL' 	: '/api/auth/google/callback'
    }

};