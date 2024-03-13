var exports = module.exports = {
    bot: {
        // CHZZK
        chzzk: {
            // NID_AUT & NID_SES (See https://github.com/kimcore/chzzk)
            nidAuth: '(NID_AUT)',
            nidSession: '(NID_SES)',
        },

        // YouTube
        youtube: {
            id: '(YouTube Bot Uid)',
        },

        // Twitch
        twitch: {
            id: '(Twitch Bot ID)',
            password: '(Twitch Bot oauth:password))',
        },

        // // kick
        // kick: {
        //     id: '(Kick Bot ID)',
        // },
    },

    api: {
        kakao: '(KAKAO API KEY)',
        naver: {
            id: '(NAVER API KEY)',
            secret: '(NAVER API SECRET KEY)',
        },
        youtubeApi: '(YOUTUBE API KEY)'
    },

    GoogleOAuth: {
        clientId: '(GOOGLE OAUTH CLIENT ID)',
        clientSecret: '(GOOGLE OAUTH CLIENT SECRET)',
        redirectUri: 'http://localhost:27510/youtube/callback',
    },
};
